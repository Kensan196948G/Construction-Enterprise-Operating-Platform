"""
日報APIルーター
GET    /api/v1/projects/{project_id}/daily-reports
POST   /api/v1/projects/{project_id}/daily-reports
GET    /api/v1/daily-reports/{id}
PUT    /api/v1/daily-reports/{id}
DELETE /api/v1/daily-reports/{id}
"""

import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.access_control import assert_project_access
from app.core.config import settings
from app.core.rbac import UserRole, require_roles
from app.db.base import AsyncSessionLocal, get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.daily_report import (
    DailyReportCreate,
    DailyReportResponse,
    DailyReportUpdate,
)
from app.schemas.legal import LegalEvidenceCreate
from app.services.daily_report_service import DailyReportService
from app.services.legal.evidence_service import EvidenceService
from app.services.notification_hook import fire_notification_hook

logger = logging.getLogger(__name__)

router = APIRouter(tags=["日報管理"])


async def _record_daily_report_evidence(
    report_id: uuid.UUID,
    project_id: uuid.UUID,
    report_date: object,  # date
    work_content: str | None,
    created_by: uuid.UUID,
) -> None:
    """日報提出時に法的証跡（legal_evidence）テーブルへ記録するバックグラウンドタスク。

    レスポンス送信後に実行されるため AsyncSessionLocal で独立したセッションを使用する。
    Phase 3-b: 建設業法 第26条の4 — 施工体制台帳・工事記録保存義務
    """
    content_preview = (work_content or "")[:50]
    title = f"日報 {report_date} — {content_preview}"
    payload = LegalEvidenceCreate(
        project_id=project_id,
        source_type="daily_report",
        source_id=report_id,
        title=title,
        event_date=report_date,  # type: ignore[arg-type]
        description=(
            f"日報 ID={report_id} が提出されました。工事記録として法的証跡に自動登録。"
        ),
    )
    try:
        async with AsyncSessionLocal() as bg_db:
            svc = EvidenceService(bg_db)
            await svc.add_evidence(payload, created_by=created_by)
            await bg_db.commit()
    except Exception:
        logger.exception(
            "Failed to record daily_report legal evidence: report_id=%s", report_id
        )


@router.get(
    "/projects/{project_id}/daily-reports",
    response_model=PaginatedResponse[DailyReportResponse],
)
async def list_daily_reports(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.PROJECT_MANAGER,
                UserRole.SITE_SUPERVISOR,
                UserRole.VIEWER,
            )
        ),
    ],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    svc = DailyReportService(db)
    reports, total = await svc.list_reports(project_id, page, per_page)
    return PaginatedResponse(
        data=reports,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page) if total > 0 else 0,
        ),
    )


@router.post(
    "/projects/{project_id}/daily-reports",
    response_model=ApiResponse[DailyReportResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_daily_report(
    project_id: uuid.UUID,
    payload: DailyReportCreate,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.SITE_SUPERVISOR
            )
        ),
    ],
):
    # IDOR 防止: 作成・証跡登録（副作用）前に当該プロジェクトへのアクセス権を検証
    await assert_project_access(current_user, project_id, db)
    svc = DailyReportService(db)
    report = await svc.create_report(project_id, payload, created_by=current_user.id)
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    project_name = (
        report.project_name  # type: ignore[attr-defined]
        if hasattr(report, "project_name")
        else str(project_id)
    )
    await fire_notification_hook(
        background_tasks,
        db,
        event_key="daily_report_submitted",
        context={
            "report_id": str(report.id),
            "project_id": str(project_id),
            "project_name": project_name,
            "submitted_by": current_user.full_name,
            "submitted_at": now_str,
            "app_url": settings.APP_URL,
        },
    )
    # Phase 3-b: 建設業法 第26条の4 — 日報を法的証跡に自動登録
    background_tasks.add_task(
        _record_daily_report_evidence,
        report_id=report.id,
        project_id=project_id,
        report_date=payload.report_date,
        work_content=payload.work_content,
        created_by=current_user.id,
    )
    return ApiResponse(data=report)


@router.get(
    "/daily-reports/{report_id}", response_model=ApiResponse[DailyReportResponse]
)
async def get_daily_report(
    report_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.PROJECT_MANAGER,
                UserRole.SITE_SUPERVISOR,
                UserRole.VIEWER,
            )
        ),
    ],
):
    svc = DailyReportService(db)
    report = await svc.get_report(report_id)
    return ApiResponse(data=report)


@router.put(
    "/daily-reports/{report_id}", response_model=ApiResponse[DailyReportResponse]
)
async def update_daily_report(
    report_id: uuid.UUID,
    payload: DailyReportUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.SITE_SUPERVISOR
            )
        ),
    ],
):
    svc = DailyReportService(db)
    # IDOR 防止: 更新前に既存日報の所属プロジェクトへのアクセス権を検証
    existing = await svc.get_report(report_id)
    await assert_project_access(current_user, existing.project_id, db)
    report = await svc.update_report(report_id, payload, updated_by=current_user.id)
    return ApiResponse(data=report)


@router.delete("/daily-reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_report(
    report_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User, Depends(require_roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER))
    ],
):
    svc = DailyReportService(db)
    # IDOR 防止: 削除前に既存日報の所属プロジェクトへのアクセス権を検証
    existing = await svc.get_report(report_id)
    await assert_project_access(current_user, existing.project_id, db)
    await svc.delete_report(report_id, deleted_by=current_user.id)
    return None

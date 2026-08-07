"""
工事案件APIルーター
GET    /api/v1/projects                     - 一覧
POST   /api/v1/projects                     - 新規作成
GET    /api/v1/projects/{id}               - 詳細
PUT    /api/v1/projects/{id}               - 更新
DELETE /api/v1/projects/{id}               - 論理削除
GET    /api/v1/projects/{id}/contracts     - 契約一覧 (Legal Tech Phase 1 #228)
GET    /api/v1/projects/{id}/legal-risks   - 法的リスク評価 (Legal Tech Phase 1 #228)
"""

import math
import uuid
from datetime import date, datetime, timezone
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.access_control import assert_project_access
from app.core.config import settings
from app.core.rbac import UserRole, require_roles
from app.db.base import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.legal import ContractResponse, ProjectLegalRisk
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.notification_hook import fire_notification_hook
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["工事案件管理"])


@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.PROJECT_MANAGER,
                UserRole.SITE_SUPERVISOR,
                UserRole.COST_MANAGER,
                UserRole.VIEWER,
            )
        ),
    ],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    filter_status: str | None = Query(default=None, alias="status"),
):
    """工事案件一覧を取得します（ページネーション付き）。

    - `status` フィルター: `planning` / `active` / `on_hold` / `completed` / `cancelled`
    - `per_page` 最大値: 100
    - 論理削除済み案件は含まれません
    - 権限: VIEWER 以上
    """
    svc = ProjectService(db)
    projects, total = await svc.list_projects(page, per_page, status=filter_status)
    return PaginatedResponse(
        data=projects,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page) if total > 0 else 0,
        ),
    )


@router.post(
    "", response_model=ApiResponse[ProjectResponse], status_code=status.HTTP_201_CREATED
)
async def create_project(
    payload: ProjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User, Depends(require_roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER))
    ],
):
    """新しい工事案件を作成します。

    - `project_code` は一意である必要があります（重複時は 409）
    - 初期ステータスは `planning` または `active` を推奨
    - 権限: PROJECT_MANAGER 以上
    """
    svc = ProjectService(db)
    project = await svc.create_project(payload, created_by=current_user.id)
    return ApiResponse(data=project)


@router.get("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def get_project(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.PROJECT_MANAGER,
                UserRole.SITE_SUPERVISOR,
                UserRole.COST_MANAGER,
                UserRole.VIEWER,
            )
        ),
    ],
):
    svc = ProjectService(db)
    project = await svc.get_project(project_id)
    return ApiResponse(data=project)


@router.put("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User, Depends(require_roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER))
    ],
):
    svc = ProjectService(db)
    # Capture old status before update for notification context
    old_project = await svc.get_project(project_id)
    old_status = old_project.status if old_project else None
    project = await svc.update_project(project_id, payload, updated_by=current_user.id)
    # Notify on status change only
    if payload.status is not None and payload.status != old_status:
        changed_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        await fire_notification_hook(
            background_tasks,
            db,
            event_key="project_status_changed",
            context={
                "project_id": str(project_id),
                "project_name": project.name,
                "old_status": old_status or "未設定",
                "new_status": payload.status,
                "changed_by": current_user.full_name,
                "changed_at": changed_at,
                "app_url": settings.APP_URL,
            },
        )
    return ApiResponse(data=project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
):
    svc = ProjectService(db)
    await svc.delete_project(project_id, deleted_by=current_user.id)
    return None


# ---------- Legal Tech Phase 1: 契約紐付け + 工期遅延法的リスク評価 (#228) ----------


@router.get(
    "/{project_id}/contracts",
    response_model=ApiResponse[list[ContractResponse]],
)
async def list_project_contracts(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.VIEWER)
        ),
    ],
):
    """工事案件に紐付く契約一覧を返します。

    - 元請（PRIME）・下請（SUB）・二次下請（SECONDARY_SUB）を一括取得
    - AI リスクスコア付きで返します
    """
    # IDOR 防止: legal/contracts.py の get/update/analyze と同一情報への
    # アクセス制御を統一（projects 経由の read-side bypass を防ぐ）
    await assert_project_access(current_user, project_id, db)
    from app.repositories.legal import ContractRepository

    repo = ContractRepository(db)
    contracts = await repo.list_by_project(project_id)
    return ApiResponse(
        data=[ContractResponse.model_validate(c) for c in contracts],
    )


@router.get(
    "/{project_id}/legal-risks",
    response_model=ApiResponse[ProjectLegalRisk],
)
async def get_project_legal_risks(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.VIEWER)
        ),
    ],
):
    """工事案件の法的リスクサマリーを返します。

    - 契約 AI リスクスコアの集計（CRITICAL/HIGH/MEDIUM/LOW 件数）
    - 工期遅延リスク評価（end_date を現在日付と比較）
    - CRITICAL 契約が存在する場合は ITSM エスカレーション推奨
    """
    # IDOR 防止: 法的リスク（契約スコア集計）は機微情報のため
    # legal/contracts.py と同一アクセス制御を適用
    await assert_project_access(current_user, project_id, db)
    from app.repositories.legal import ContractRepository

    repo = ContractRepository(db)
    svc = ProjectService(db)

    project = await svc.get_project(project_id)

    contracts = await repo.list_by_project(project_id)

    critical_ids = [c.id for c in contracts if c.ai_risk_score == "CRITICAL"]
    high_ids = [c.id for c in contracts if c.ai_risk_score == "HIGH"]

    overall_risk = "NONE"
    if critical_ids:
        overall_risk = "CRITICAL"
    elif high_ids:
        overall_risk = "HIGH"
    elif any(c.ai_risk_score == "MEDIUM" for c in contracts):
        overall_risk = "MEDIUM"
    elif any(c.ai_risk_score == "LOW" for c in contracts):
        overall_risk = "LOW"

    today = date.today()
    delay_risk = False
    delay_days: int | None = None
    if (
        project.end_date
        and project.end_date < today
        and project.status not in ("COMPLETED", "CANCELLED")
    ):
        delay_risk = True
        delay_days = (today - project.end_date).days

    recommendations: list[str] = []
    if critical_ids:
        recommendations.append(
            f"CRITICAL リスクの契約が {len(critical_ids)} 件あります。"
            "直ちに法務担当にエスカレーションしてください。"
        )
    if delay_risk and delay_days:
        recommendations.append(
            f"工期が {delay_days} 日超過しています。"
            "建設業法第24条の7（工期の延長）に基づく手続きを確認してください。"
        )
    if any(c.ai_risk_score == "PENDING" for c in contracts):
        recommendations.append(
            "未解析の契約があります。"
            "/analyze エンドポイントで AI 解析を実行してください。"
        )

    risk = ProjectLegalRisk(
        project_id=project_id,
        risk_level=overall_risk,
        open_contracts=len(contracts),
        critical_contracts=critical_ids,
        high_contracts=high_ids,
        delay_risk=delay_risk,
        delay_days=delay_days,
        legal_recommendations=recommendations,
        evaluated_at=datetime.now(timezone.utc),
    )
    return ApiResponse(data=risk)

"""安全・品質管理APIルーター"""

import logging
import math
import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.access_control import assert_project_access
from app.core.rbac import UserRole, require_roles
from app.db.base import AsyncSessionLocal, get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.legal import ComplianceCheckRequest
from app.schemas.safety import (
    QualityInspectionCreate,
    QualityInspectionResponse,
    SafetyCheckCreate,
    SafetyCheckResponse,
)
from app.services.legal.compliance_service import ComplianceService
from app.services.safety_service import SafetyService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["安全・品質管理"])


async def _run_safety_compliance_check(
    project_id: uuid.UUID,
    check_id: uuid.UUID,
    items_ng: int,
    created_by: uuid.UUID,
) -> None:
    """安全チェックが NG 結果の場合に労働安全衛生法違反
    コンプライアンスチェックを実行するバックグラウンドタスク。

    Phase 3-c: 労働安全衛生法 第3条 — 事業者の安全衛生義務
    レスポンス送信後に実行されるため AsyncSessionLocal で独立したセッションを使用する。
    """
    compliance_req = ComplianceCheckRequest(
        check_type="labor_safety",
        near_miss_count=items_ng,
    )
    try:
        async with AsyncSessionLocal() as bg_db:
            svc = ComplianceService(bg_db)
            await svc.run_check(project_id, compliance_req, created_by=created_by)
            await bg_db.commit()
    except Exception:
        logger.exception(
            "Failed to run safety compliance check: project_id=%s check_id=%s",
            project_id,
            check_id,
        )


@router.post(
    "/projects/{project_id}/safety-checks",
    response_model=ApiResponse[SafetyCheckResponse],
    status_code=201,
)
async def create_safety_check(
    project_id: uuid.UUID,
    payload: SafetyCheckCreate,
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
    """安全確認チェックリストを記録します。

    - 1 日 1 案件につき複数回記録可能
    - `items`: チェック項目ごとに `category`, `checked` (bool), `note` を含む配列
    - `overall_result` が NG の場合、労働安全衛生法違反
      コンプライアンスチェックを自動実行
    - 権限: SITE_SUPERVISOR 以上
    """
    # IDOR 防止: 当該プロジェクトへのアクセス権を検証（ADMIN はバイパス）
    await assert_project_access(current_user, project_id, db)
    svc = SafetyService(db)
    data = await svc.create_safety_check(
        project_id, payload, created_by=current_user.id
    )
    # Phase 3-c: 労働安全衛生法 第3条 — NG 判定時はコンプライアンスチェックを非同期実行
    if payload.overall_result == "NG":
        background_tasks.add_task(
            _run_safety_compliance_check,
            project_id=project_id,
            check_id=data.id,
            items_ng=payload.items_ng,
            created_by=current_user.id,
        )
    return ApiResponse(data=data)


@router.get(
    "/projects/{project_id}/safety-checks",
    response_model=PaginatedResponse[SafetyCheckResponse],
)
async def list_safety_checks(
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
    svc = SafetyService(db)
    items, total = await svc.list_safety_checks(project_id, page, per_page)
    return PaginatedResponse(
        data=items,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page) if total > 0 else 0,
        ),
    )


@router.post(
    "/projects/{project_id}/quality-inspections",
    response_model=ApiResponse[QualityInspectionResponse],
    status_code=201,
)
async def create_quality_inspection(
    project_id: uuid.UUID,
    payload: QualityInspectionCreate,
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
    # IDOR 防止: 当該プロジェクトへのアクセス権を検証（ADMIN はバイパス）
    await assert_project_access(current_user, project_id, db)
    svc = SafetyService(db)
    data = await svc.create_quality_inspection(
        project_id, payload, created_by=current_user.id
    )
    return ApiResponse(data=data)


@router.get(
    "/projects/{project_id}/quality-inspections",
    response_model=PaginatedResponse[QualityInspectionResponse],
)
async def list_quality_inspections(
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
    svc = SafetyService(db)
    items, total = await svc.list_quality_inspections(project_id, page, per_page)
    return PaginatedResponse(
        data=items,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page) if total > 0 else 0,
        ),
    )


@router.delete(
    "/projects/{project_id}/safety-checks/{check_id}",
    status_code=204,
)
async def delete_safety_check(
    project_id: uuid.UUID,
    check_id: uuid.UUID,
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
    # IDOR 防止: 当該プロジェクトへのアクセス権を検証（ADMIN はバイパス）
    await assert_project_access(current_user, project_id, db)
    svc = SafetyService(db)
    await svc.delete_safety_check(project_id, check_id)


@router.delete(
    "/projects/{project_id}/quality-inspections/{inspection_id}",
    status_code=204,
)
async def delete_quality_inspection(
    project_id: uuid.UUID,
    inspection_id: uuid.UUID,
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
    # IDOR 防止: 当該プロジェクトへのアクセス権を検証（ADMIN はバイパス）
    await assert_project_access(current_user, project_id, db)
    svc = SafetyService(db)
    await svc.delete_quality_inspection(project_id, inspection_id)

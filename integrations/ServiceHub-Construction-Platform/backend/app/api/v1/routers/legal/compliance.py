"""
Legal Tech — コンプライアンスチェック API（Phase 2）
POST   /api/v1/legal/compliance/{project_id}/check   - チェック実行
GET    /api/v1/legal/compliance/{project_id}/status  - 最新ステータス
GET    /api/v1/legal/compliance/{project_id}/history - チェック履歴
"""

import math
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.access_control import assert_project_access
from app.core.rbac import UserRole, require_roles
from app.db.base import get_db
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.legal import (
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    ComplianceStatusSummary,
)
from app.services.legal.compliance_service import ComplianceService

router = APIRouter(prefix="/legal/compliance", tags=["Legal Tech — コンプライアンス"])

_LEGAL_ROLES = (UserRole.ADMIN, UserRole.PROJECT_MANAGER)


@router.post(
    "/{project_id}/check",
    response_model=ApiResponse[ComplianceCheckResponse],
    status_code=status.HTTP_201_CREATED,
)
async def run_compliance_check(
    project_id: uuid.UUID,
    payload: ComplianceCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES)),
):
    """コンプライアンスチェックを実行します。

    - ANTHROPIC_API_KEY 設定時は Claude AI による高精度解析
    - 未設定時はルールベースエンジン（下請法60日・ヒヤリハット件数・建設業法）でチェック
    """
    await assert_project_access(current_user, project_id, db)
    svc = ComplianceService(db)
    result = await svc.run_check(
        project_id=project_id,
        data=payload,
        created_by=current_user.id,
    )
    msg = f"コンプライアンスチェック完了: {result.status} (スコア: {result.score})"
    return ApiResponse(data=result, message=msg)


@router.get(
    "/{project_id}/status",
    response_model=ApiResponse[ComplianceStatusSummary],
)
async def get_compliance_status(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES, UserRole.VIEWER)),
):
    """プロジェクトの最新コンプライアンスステータスを返します。"""
    await assert_project_access(current_user, project_id, db)
    svc = ComplianceService(db)
    summary = await svc.get_status(project_id)
    return ApiResponse(data=summary)


@router.get(
    "/{project_id}/history",
    response_model=PaginatedResponse[ComplianceCheckResponse],
)
async def get_compliance_history(
    project_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES, UserRole.VIEWER)),
):
    """コンプライアンスチェック履歴を取得します（最新順）。"""
    await assert_project_access(current_user, project_id, db)
    svc = ComplianceService(db)
    items, total = await svc.get_history(
        project_id=project_id,
        page=page,
        per_page=per_page,
    )
    return PaginatedResponse(
        data=items,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page) if total > 0 else 0,
        ),
    )

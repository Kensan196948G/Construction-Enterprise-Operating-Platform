"""
Legal Tech — 法的証跡タイムライン API（Phase 2）
GET    /api/v1/legal/evidence/{project_id}/timeline  - 証跡タイムライン取得
POST   /api/v1/legal/evidence/{project_id}           - 証跡追加
GET    /api/v1/legal/evidence/{project_id}/verify    - 整合性検証
GET    /api/v1/legal/evidence/entry/{evidence_id}    - 証跡単体取得
"""

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.access_control import assert_project_access
from app.core.rbac import UserRole, require_roles
from app.db.base import get_db
from app.schemas.common import ApiResponse
from app.schemas.legal import (
    EvidenceVerifyResult,
    LegalEvidenceCreate,
    LegalEvidenceResponse,
    LegalEvidenceTimeline,
)
from app.services.legal.evidence_service import EvidenceService

router = APIRouter(prefix="/legal/evidence", tags=["Legal Tech — 証跡管理"])

_LEGAL_ROLES = (UserRole.ADMIN, UserRole.PROJECT_MANAGER)


@router.get(
    "/{project_id}/timeline",
    response_model=ApiResponse[LegalEvidenceTimeline],
)
async def get_timeline(
    project_id: uuid.UUID,
    source_type: str | None = Query(
        None, description="フィルタ: daily_report/safety/photo/contract/manual"
    ),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES, UserRole.VIEWER)),
):
    """プロジェクトの法的証跡タイムラインを取得します（event_date 昇順）。"""
    await assert_project_access(current_user, project_id, db)
    svc = EvidenceService(db)
    timeline = await svc.get_timeline(
        project_id=project_id,
        source_type=source_type,
        limit=limit,
    )
    return ApiResponse(data=timeline)


@router.post(
    "/{project_id}",
    response_model=ApiResponse[LegalEvidenceResponse],
    status_code=status.HTTP_201_CREATED,
)
async def add_evidence(
    project_id: uuid.UUID,
    payload: LegalEvidenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES)),
):
    """法的証跡を追加します。content_hash は省略可（自動計算）。"""
    await assert_project_access(current_user, project_id, db)
    # Ensure project_id consistency between path and body
    payload = payload.model_copy(update={"project_id": project_id})
    svc = EvidenceService(db)
    evidence = await svc.add_evidence(payload, created_by=current_user.id)
    return ApiResponse(data=evidence, message="証跡を登録しました")


@router.get(
    "/{project_id}/verify",
    response_model=ApiResponse[EvidenceVerifyResult],
)
async def verify_integrity(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES)),
):
    """プロジェクトの全証跡に対してハッシュ整合性を検証します。"""
    await assert_project_access(current_user, project_id, db)
    svc = EvidenceService(db)
    result = await svc.verify_integrity(project_id)
    return ApiResponse(
        data=result,
        message=(
            "整合性チェック完了（問題なし）"
            if result.integrity_ok
            else f"整合性チェック完了（{result.hash_mismatches}件要確認）"
        ),
    )


@router.get(
    "/entry/{evidence_id}",
    response_model=ApiResponse[LegalEvidenceResponse],
)
async def get_evidence(
    evidence_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES)),  # VIEWER は除外 (IDOR 対策)
):
    """法的証跡の詳細を取得します。

    NOTE: VIEWER ロールはアクセス不可。
    project-level IDOR 対策として evidence を先取得し、
    そのプロジェクトに対するアクセス権を assert_project_access() で検証する。
    """
    svc = EvidenceService(db)
    evidence = await svc.get_evidence(evidence_id)
    # IDOR 防止: role チェック通過後にプロジェクト所有者チェック
    await assert_project_access(current_user, evidence.project_id, db)
    return ApiResponse(data=evidence)

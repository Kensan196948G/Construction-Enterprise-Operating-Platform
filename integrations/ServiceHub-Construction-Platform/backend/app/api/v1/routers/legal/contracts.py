"""
Legal Tech — 契約管理 API
GET    /api/v1/legal/contracts         - 一覧
POST   /api/v1/legal/contracts         - 新規登録
GET    /api/v1/legal/contracts/{id}    - 詳細
PUT    /api/v1/legal/contracts/{id}    - 更新
POST   /api/v1/legal/contracts/{id}/analyze - AI 解析（建設業法・下請法）
"""

import math
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.access_control import assert_project_access
from app.core.rbac import UserRole, require_roles
from app.db.base import get_db
from app.repositories.project import ProjectRepository
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.legal import (
    ContractAnalysisRequest,
    ContractAnalysisResult,
    ContractCreate,
    ContractResponse,
    ContractUpdate,
)
from app.services.legal.contracts_service import ContractsService

router = APIRouter(prefix="/legal/contracts", tags=["Legal Tech — 契約管理"])

_LEGAL_ROLES = (UserRole.ADMIN, UserRole.PROJECT_MANAGER)


@router.get("", response_model=PaginatedResponse[ContractResponse])
async def list_contracts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    project_id: uuid.UUID | None = None,
    contract_type: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    risk_score: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES)),
):
    """契約一覧を取得します。"""
    # IDOR 防止:
    #   - project_id 指定時: そのプロジェクトへのアクセス権を検証
    #   - project_id 未指定かつ非 ADMIN: 自身が管理するプロジェクトにスコープ
    #     （未指定経路で全プロジェクトの契約が漏れるゲートバイパスを防ぐ）
    allowed_project_ids: list[uuid.UUID] | None = None
    if project_id is not None:
        await assert_project_access(current_user, project_id, db)
    elif UserRole(current_user.role) != UserRole.ADMIN:
        allowed_project_ids = await ProjectRepository(db).list_manager_project_ids(
            current_user.id
        )
    svc = ContractsService(db)
    items, total = await svc.list_contracts(
        page=page,
        per_page=per_page,
        project_id=project_id,
        contract_type=contract_type,
        status=status_filter,
        risk_score=risk_score,
        project_ids=allowed_project_ids,
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


@router.post(
    "",
    response_model=ApiResponse[ContractResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_contract(
    payload: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES)),
):
    """契約を新規登録します。"""
    # IDOR 防止: 指定プロジェクトへのアクセス権を検証
    # （非 ADMIN が他プロジェクトの project_id を指定する write-side IDOR =
    #   管理外プロジェクトへの契約注入を防ぐ）
    await assert_project_access(current_user, payload.project_id, db)
    svc = ContractsService(db)
    contract = await svc.create_contract(payload, created_by=current_user.id)
    return ApiResponse(data=contract, message="契約を登録しました")


@router.get("/{contract_id}", response_model=ApiResponse[ContractResponse])
async def get_contract(
    contract_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES, UserRole.VIEWER)),
):
    """契約詳細を取得します。"""
    svc = ContractsService(db)
    contract = await svc.get_contract(contract_id)
    # IDOR 防止: 取得した契約の所属プロジェクトへのアクセス権を検証
    await assert_project_access(current_user, contract.project_id, db)
    return ApiResponse(data=contract)


@router.put("/{contract_id}", response_model=ApiResponse[ContractResponse])
async def update_contract(
    contract_id: uuid.UUID,
    payload: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES)),
):
    """契約情報を更新します。"""
    svc = ContractsService(db)
    # IDOR 防止: 更新前に既存契約の所属プロジェクトへのアクセス権を検証
    existing = await svc.get_contract(contract_id)
    await assert_project_access(current_user, existing.project_id, db)
    contract = await svc.update_contract(
        contract_id, payload, updated_by=current_user.id
    )
    return ApiResponse(data=contract, message="契約を更新しました")


@router.post(
    "/{contract_id}/analyze",
    response_model=ApiResponse[ContractAnalysisResult],
)
async def analyze_contract(
    contract_id: uuid.UUID,
    payload: ContractAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_roles(*_LEGAL_ROLES)),
):
    """契約書テキストを Claude で解析し、建設業法・下請法リスクを評価します。

    - ANTHROPIC_API_KEY 未設定時は risk_score=PENDING を返します
    - 解析結果は contracts.ai_analysis_json に保存されます
    """
    svc = ContractsService(db)
    # IDOR 防止: 解析（副作用・AI コスト）前に所属プロジェクトへのアクセス権を検証
    existing = await svc.get_contract(contract_id)
    await assert_project_access(current_user, existing.project_id, db)
    result = await svc.analyze_contract(
        contract_id=contract_id,
        contract_text=payload.contract_text,
        contract_type=payload.contract_type,
    )
    return ApiResponse(data=result, message="契約書の AI 解析が完了しました")

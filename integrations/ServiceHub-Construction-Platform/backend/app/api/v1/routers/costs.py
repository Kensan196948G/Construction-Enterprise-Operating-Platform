"""原価・工数管理APIルーター"""

import math
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.access_control import assert_project_access
from app.core.rbac import UserRole, require_roles
from app.db.base import get_db
from app.models.cost import CostRecord
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.cost import (
    CostRecordCreate,
    CostRecordResponse,
    CostSummary,
    WorkHourCreate,
    WorkHourResponse,
)
from app.schemas.legal import CostPaymentLegalCheckResult, PaymentOverdueRecord
from app.services.cost_service import CostService

router = APIRouter(tags=["原価・工数管理"])


@router.post(
    "/projects/{project_id}/cost-records",
    response_model=ApiResponse[CostRecordResponse],
    status_code=201,
)
async def create_cost_record(
    project_id: uuid.UUID,
    payload: CostRecordCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.COST_MANAGER
            )
        ),
    ],
):
    """原価記録を新規作成します。

    - `category`: `materials` / `labor` / `equipment` / `subcontract` / `other`
    - `amount`: 税込金額（円、正の整数）
    - 権限: COST_MANAGER 以上
    """
    svc = CostService(db)
    data = await svc.create_record(project_id, payload, created_by=current_user.id)
    return ApiResponse(data=data)


@router.get(
    "/projects/{project_id}/cost-records",
    response_model=PaginatedResponse[CostRecordResponse],
)
async def list_cost_records(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.COST_MANAGER
            )
        ),
    ],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
):
    svc = CostService(db)
    items, total = await svc.list_records(project_id, page, per_page)
    return PaginatedResponse(
        data=items,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page) if total > 0 else 0,
        ),
    )


@router.get(
    "/projects/{project_id}/cost-summary",
    response_model=ApiResponse[CostSummary],
)
async def get_cost_summary(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.COST_MANAGER
            )
        ),
    ],
):
    """案件の予実対比サマリーを取得します。

    予算総額・実績合計・差異・進捗率をカテゴリ別に集計して返します。
    権限: COST_MANAGER 以上
    """
    svc = CostService(db)
    summary = await svc.get_summary(project_id)
    return ApiResponse(data=summary)


@router.post(
    "/projects/{project_id}/work-hours",
    response_model=ApiResponse[WorkHourResponse],
    status_code=201,
)
async def create_work_hour(
    project_id: uuid.UUID,
    payload: WorkHourCreate,
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
    svc = CostService(db)
    data = await svc.create_work_hour(project_id, payload, created_by=current_user.id)
    return ApiResponse(data=data)


@router.delete(
    "/projects/{project_id}/cost-records/{record_id}",
    status_code=204,
)
async def delete_cost_record(
    project_id: uuid.UUID,
    record_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.COST_MANAGER
            )
        ),
    ],
):
    svc = CostService(db)
    await svc.delete_record(project_id, record_id)


# Legal compliance constants
_PAYMENT_OVERDUE_DAYS = 60  # 下請法 第2条の2 — 支払期日の上限
_WARNING_THRESHOLD_DAYS = 45  # 期限まで15日以内で警告


@router.get(
    "/projects/{project_id}/cost-records/legal-check",
    response_model=ApiResponse[CostPaymentLegalCheckResult],
)
async def check_payment_legal_compliance(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.COST_MANAGER
            )
        ),
    ],
):
    """下請法第2条の2 — 下請代金60日支払期限チェック。

    カテゴリが SUBCONTRACT の原価記録に対して、record_date から60日以上経過した
    レコードを違反として検出します。45日以上のレコードを WARNING として警告します。

    - CRITICAL: 91日以上経過
    - HIGH: 61〜90日経過（既に60日超過 = 法的違反）
    - MEDIUM: 45〜60日経過（期限まで15日以内 = 警告）
    - 権限: COST_MANAGER 以上
    """
    # IDOR 防止: 当該プロジェクトへのアクセス権を検証（ADMIN はバイパス）
    await assert_project_access(current_user, project_id, db)

    today = datetime.now(timezone.utc).date()

    stmt = select(CostRecord).where(
        CostRecord.project_id == project_id,
        CostRecord.category == "SUBCONTRACT",
        CostRecord.deleted_at.is_(None),
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    overdue_records: list[PaymentOverdueRecord] = []
    warning_count = 0

    for rec in records:
        days_elapsed = (today - rec.record_date).days
        if days_elapsed >= _WARNING_THRESHOLD_DAYS:
            if days_elapsed > 90:
                severity = "CRITICAL"
            elif days_elapsed > _PAYMENT_OVERDUE_DAYS:
                severity = "HIGH"
            else:
                severity = "MEDIUM"  # 45-60 days: approaching limit
            overdue_records.append(
                PaymentOverdueRecord(
                    record_id=rec.id,
                    record_date=rec.record_date,
                    description=rec.description,
                    vendor_name=rec.vendor_name,
                    actual_amount=rec.actual_amount,
                    days_elapsed=days_elapsed,
                    severity=severity,
                )
            )
            if days_elapsed <= _PAYMENT_OVERDUE_DAYS:
                warning_count += 1

    overdue_count = sum(
        1 for r in overdue_records if r.severity in ("CRITICAL", "HIGH")
    )
    if overdue_count > 0:
        status = "FAIL"
    elif warning_count > 0:
        status = "WARNING"
    else:
        status = "PASS"

    check_result = CostPaymentLegalCheckResult(
        project_id=project_id,
        status=status,
        overdue_count=overdue_count,
        warning_count=warning_count,
        overdue_records=overdue_records,
        checked_at=datetime.now(timezone.utc),
    )
    return ApiResponse(data=check_result)

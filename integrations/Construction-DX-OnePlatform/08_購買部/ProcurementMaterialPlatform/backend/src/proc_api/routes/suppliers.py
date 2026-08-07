"""協力会社マスタ CRUD + 評価."""
from __future__ import annotations

import re
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Supplier
from ..services import (
    HistoricalRecord,
    SupplierMetrics,
    evaluate_supplier,
    evaluate_supplier_with_ai,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

# 適格請求書発行事業者番号: T + 13 桁数字
QUALIFIED_INVOICE_PATTERN = re.compile(r"^T\d{13}$")


class SupplierIn(BaseModel):
    supplier_code: str = Field(..., max_length=20)
    company_name: str = Field(..., max_length=200)
    category: str = "資材"
    construction_license_no: str | None = None
    qualified_invoice_no: str | None = None
    credit_limit: float | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    address: str | None = None

    @field_validator("qualified_invoice_no")
    @classmethod
    def _validate_invoice(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if not QUALIFIED_INVOICE_PATTERN.match(v):
            raise ValueError("適格請求書事業者番号は T + 13 桁の数字 (例: T1234567890123)")
        return v


class SupplierOut(SupplierIn):
    id: int
    evaluation_rank: str | None = None
    evaluation_score: float | None = None


class MetricsIn(BaseModel):
    on_time_delivery_rate: float = Field(..., ge=0, le=1)
    defect_rate: float = Field(..., ge=0, le=1)
    average_price_ratio: float = Field(..., gt=0)
    accidents_last_year: int = Field(..., ge=0)
    orders_last_year: int = Field(..., ge=0)


@router.get("", response_model=list[SupplierOut])
async def list_suppliers(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[SupplierOut]:
    result = await session.execute(select(Supplier))
    return [SupplierOut.model_validate(s, from_attributes=True) for s in result.scalars().all()]


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    body: SupplierIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SupplierOut:
    sup = Supplier(**body.model_dump(exclude_none=True))
    session.add(sup)
    await session.flush()
    return SupplierOut.model_validate(sup, from_attributes=True)


@router.get("/{supplier_id}", response_model=SupplierOut)
async def get_supplier(
    supplier_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SupplierOut:
    sup = await session.get(Supplier, supplier_id)
    if sup is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "supplier not found")
    return SupplierOut.model_validate(sup, from_attributes=True)


@router.get("/{supplier_id}/ai-evaluation")
async def ai_evaluation(
    supplier_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """AI 拡張評価 (ルールベース + リスク予測 + 要約)."""
    sup = await session.get(Supplier, supplier_id)
    if sup is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "supplier not found")

    # 現在の評価ランクが入っていなければデフォルト推定指標を使う
    rank_to_ot = {"S": 0.99, "A": 0.95, "B": 0.90, "C": 0.85, "D": 0.78}
    base_ot = rank_to_ot.get(sup.evaluation_rank or "B", 0.90)
    metrics = SupplierMetrics(
        on_time_delivery_rate=base_ot,
        defect_rate=max(0.0, 0.05 - (base_ot - 0.85) * 0.5),
        average_price_ratio=1.0,
        accidents_last_year=0,
        orders_last_year=20,
    )

    # 履歴は本実装では PurchaseOrder / Delivery から導出するが、
    # ここでは骨格保持のため空履歴で AI 評価し、要約のみ返す。
    history: list[HistoricalRecord] = []
    result = evaluate_supplier_with_ai(
        supplier_id=supplier_id,
        supplier_name=sup.company_name,
        current_metrics=metrics,
        history=history,
    )
    return {
        "supplier_id": result.supplier_id,
        "supplier_name": sup.company_name,
        "base_rank": result.base_rank,
        "base_score": result.base_score,
        "risk_score": result.risk_score,
        "risk_level": result.risk_level,
        "trend": result.trend,
        "summary": result.summary,
        "factors": result.factors,
        "powered_by": result.powered_by,
    }


@router.post("/{supplier_id}/evaluate")
async def evaluate(
    supplier_id: int,
    body: MetricsIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """5 指標を入力として評価ランクを算出・保存する."""
    sup = await session.get(Supplier, supplier_id)
    if sup is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "supplier not found")
    metrics = SupplierMetrics(**body.model_dump())
    ev = evaluate_supplier(metrics)
    sup.evaluation_rank = ev.rank
    sup.evaluation_score = ev.total_score
    sup.safety_score = ev.safety_score
    await session.flush()
    return {
        "supplier_id": supplier_id,
        "rank": ev.rank,
        "total_score": ev.total_score,
        "breakdown": {
            "on_time_score": ev.on_time_score,
            "quality_score": ev.quality_score,
            "price_score": ev.price_score,
            "safety_score": ev.safety_score,
            "continuity_score": ev.continuity_score,
        },
    }

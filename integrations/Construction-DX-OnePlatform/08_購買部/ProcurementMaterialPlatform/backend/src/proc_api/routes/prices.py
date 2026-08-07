"""価格履歴 + トレンド + 相見積."""
from __future__ import annotations

from datetime import date
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import PriceHistory
from ..services import (
    PriceQuote,
    QuoteInput,
    compare_quotes,
    recommend_quotes,
    summarize_price_history,
)

router = APIRouter(prefix="/prices", tags=["prices"])


class PriceIn(BaseModel):
    material_code: str
    material_name: str | None = None
    supplier_id: int | None = None
    unit_price: float
    unit: str = "個"
    effective_date: date
    source: str = "actual"


class QuoteIn(BaseModel):
    supplier_id: int
    supplier_name: str
    unit_price: float
    delivery_lead_days: int = 0


@router.get("/history")
async def history(
    material_code: Annotated[str, Query(...)],
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    rows = (
        await session.execute(
            select(PriceHistory)
            .where(PriceHistory.material_code == material_code)
            .order_by(PriceHistory.effective_date)
        )
    ).scalars().all()
    trend = summarize_price_history(
        [{"effective_date": r.effective_date, "unit_price": float(r.unit_price)} for r in rows]
    )
    return {
        "material_code": material_code,
        "history": [
            {
                "effective_date": r.effective_date.isoformat(),
                "unit_price": float(r.unit_price),
                "supplier_id": r.supplier_id,
                "source": r.source,
            }
            for r in rows
        ],
        "trend": [
            {
                "period": t.period,
                "avg_price": t.avg_price,
                "min_price": t.min_price,
                "max_price": t.max_price,
                "sample_size": t.sample_size,
            }
            for t in trend
        ],
    }


@router.post("")
async def add_price(
    body: PriceIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    p = PriceHistory(**body.model_dump(exclude_none=True))
    session.add(p)
    await session.flush()
    return {"id": p.id, "material_code": p.material_code}


@router.post("/compare")
async def compare(
    quotes: list[QuoteIn],
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict:
    """相見積比較."""
    qs = [PriceQuote(**q.model_dump()) for q in quotes]
    return compare_quotes(qs)


class RecommendQuoteIn(BaseModel):
    """相見積最適提案 1 件."""

    supplier_id: int
    supplier_name: str
    unit_price: float
    delivery_lead_days: int = 7
    supplier_rating: float = 70.0
    safety_score: float = 80.0
    quantity: float = 1.0


class RecommendIn(BaseModel):
    quotes: list[RecommendQuoteIn]
    strategies: list[str] | None = None


@router.post("/recommend")
async def recommend(
    body: RecommendIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict:
    """相見積を 3 戦略 (cheapest / quality / delivery) でスコア化して推奨."""
    inputs = [QuoteInput(**q.model_dump()) for q in body.quotes]
    strategies = body.strategies or ["cheapest", "quality", "delivery"]
    return recommend_quotes(inputs, strategies=strategies)

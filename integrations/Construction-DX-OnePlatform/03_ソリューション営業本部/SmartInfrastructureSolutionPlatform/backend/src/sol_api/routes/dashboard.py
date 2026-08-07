"""提案実績ダッシュボード (採択率 / カテゴリ別収益)."""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import CaseStudy, Proposal

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class CategoryStat(BaseModel):
    category: str
    count: int
    amount: Decimal


class DashboardSummary(BaseModel):
    proposing_count: int
    won_count: int
    lost_count: int
    in_negotiation_count: int
    total_amount_won: Decimal
    win_rate: float
    by_category: list[CategoryStat]


@router.get("/summary", response_model=DashboardSummary)
async def summary(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DashboardSummary:
    # 状態別集計
    res = await session.execute(
        select(Proposal.status, func.count(Proposal.id)).group_by(Proposal.status)
    )
    counts: dict[str, int] = {s: int(c) for s, c in res.all()}
    proposing = counts.get("proposing", 0)
    won = counts.get("won", 0)
    lost = counts.get("lost", 0)
    in_neg = counts.get("in_negotiation", 0)

    # 採択(won)合計金額
    total_won_res = await session.execute(
        select(func.coalesce(func.sum(Proposal.expected_amount), 0)).where(
            Proposal.status == "won"
        )
    )
    total_amount_won = Decimal(str(total_won_res.scalar() or 0))

    # 採択率 = won / (won + lost)
    decided = won + lost
    win_rate = (won / decided) if decided > 0 else 0.0

    # カテゴリ別収益 (case_study ベース)
    cat_res = await session.execute(
        select(
            CaseStudy.category,
            func.count(CaseStudy.id),
            func.coalesce(func.sum(CaseStudy.contract_amount), 0),
        ).group_by(CaseStudy.category)
    )
    by_category = [
        CategoryStat(category=row[0], count=int(row[1]), amount=Decimal(str(row[2])))
        for row in cat_res.all()
    ]

    return DashboardSummary(
        proposing_count=proposing,
        won_count=won,
        lost_count=lost,
        in_negotiation_count=in_neg,
        total_amount_won=total_amount_won,
        win_rate=round(win_rate, 4),
        by_category=by_category,
    )

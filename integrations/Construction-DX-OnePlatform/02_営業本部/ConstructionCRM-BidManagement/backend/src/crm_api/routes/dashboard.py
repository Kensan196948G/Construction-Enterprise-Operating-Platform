"""ダッシュボード集計 (受注見込 / 受注実績 / 失注分析)."""

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
from ..models import Contract, Opportunity

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardSummary(BaseModel):
    pipeline_count: int
    pipeline_gross_amount: Decimal
    won_count: int
    won_amount: Decimal
    lost_count: int
    contract_count: int
    contract_amount: Decimal


@router.get("/summary", response_model=DashboardSummary)
async def summary(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DashboardSummary:
    pipe_count = await session.scalar(
        select(func.count(Opportunity.id)).where(
            Opportunity.stage.in_(["lead", "qualified", "proposal", "bid"])
        )
    )
    pipe_amount = await session.scalar(
        select(func.coalesce(func.sum(Opportunity.expected_amount), 0)).where(
            Opportunity.stage.in_(["lead", "qualified", "proposal", "bid"])
        )
    )
    won_count = await session.scalar(
        select(func.count(Opportunity.id)).where(Opportunity.stage == "won")
    )
    won_amount = await session.scalar(
        select(func.coalesce(func.sum(Opportunity.expected_amount), 0)).where(
            Opportunity.stage == "won"
        )
    )
    lost_count = await session.scalar(
        select(func.count(Opportunity.id)).where(Opportunity.stage == "lost")
    )
    contract_count = await session.scalar(select(func.count(Contract.id)))
    contract_amount = await session.scalar(
        select(func.coalesce(func.sum(Contract.contract_amount), 0))
    )
    return DashboardSummary(
        pipeline_count=int(pipe_count or 0),
        pipeline_gross_amount=Decimal(pipe_amount or 0),
        won_count=int(won_count or 0),
        won_amount=Decimal(won_amount or 0),
        lost_count=int(lost_count or 0),
        contract_count=int(contract_count or 0),
        contract_amount=Decimal(contract_amount or 0),
    )

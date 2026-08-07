"""案件パイプライン + フォーキャスト集計."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Client, Opportunity
from ..services.pipeline_forecaster import OpportunityForecastInput, forecast
from ..services.proposal_summarizer import (
    ProposalSummarizeInput,
    summarize_opportunity,
)

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


class OpportunityIn(BaseModel):
    opportunity_code: str
    title: str
    client_id: int
    stage: str = "lead"
    project_type: str = "private"
    work_category: str | None = None
    win_probability: Decimal = Decimal("0")
    expected_amount: Decimal | None = None
    expected_close_date: date | None = None
    owner_employee_code: str | None = None
    description: str | None = None


class OpportunityOut(OpportunityIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ForecastBucketOut(BaseModel):
    period: str
    opportunity_count: int
    gross_amount: Decimal
    weighted_amount: Decimal
    lower_bound: Decimal | None = None
    upper_bound: Decimal | None = None


class ForecastOut(BaseModel):
    total_count: int
    total_gross_amount: Decimal
    total_weighted_amount: Decimal
    buckets: list[ForecastBucketOut]
    model_used: str = "weighted_average"
    average_risk_score: Decimal = Decimal("0")


class SummarizeOut(BaseModel):
    summary: str
    email_skeleton: str
    model_used: str


@router.get("", response_model=list[OpportunityOut])
async def list_opportunities(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    stage: str | None = None,
) -> list[OpportunityOut]:
    stmt = select(Opportunity)
    if stage:
        stmt = stmt.where(Opportunity.stage == stage)
    result = await session.execute(stmt)
    return [OpportunityOut.model_validate(o) for o in result.scalars().all()]


@router.post("", response_model=OpportunityOut, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    body: OpportunityIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> OpportunityOut:
    opp = Opportunity(**body.model_dump(exclude_none=True))
    session.add(opp)
    await session.flush()
    return OpportunityOut.model_validate(opp)


class OpportunityPatch(BaseModel):
    stage: str | None = None
    win_probability: Decimal | None = None
    expected_amount: Decimal | None = None
    expected_close_date: date | None = None
    owner_employee_code: str | None = None
    description: str | None = None
    lost_reason: str | None = None


@router.patch("/{opportunity_id}", response_model=OpportunityOut)
async def patch_opportunity(
    opportunity_id: int,
    body: OpportunityPatch,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> OpportunityOut:
    """部分更新 (Kanban DnD のステージ変更等)."""
    opp = await session.get(Opportunity, opportunity_id)
    if opp is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "opportunity not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(opp, k, v)
    await session.flush()
    return OpportunityOut.model_validate(opp)


@router.get("/{opportunity_id}", response_model=OpportunityOut)
async def get_opportunity(
    opportunity_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> OpportunityOut:
    opp = await session.get(Opportunity, opportunity_id)
    if opp is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "opportunity not found")
    return OpportunityOut.model_validate(opp)


@router.get("/forecast/summary", response_model=ForecastOut)
async def forecast_summary(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ForecastOut:
    """加重期待値ベースの受注フォーキャスト."""
    result = await session.execute(select(Opportunity))
    inputs = [
        OpportunityForecastInput(
            opportunity_id=o.id,
            win_probability=o.win_probability or Decimal("0"),
            expected_amount=o.expected_amount or Decimal("0"),
            expected_close_date=o.expected_close_date,
            stage=o.stage,
        )
        for o in result.scalars().all()
    ]
    f = forecast(inputs)
    return ForecastOut(
        total_count=f.total_count,
        total_gross_amount=f.total_gross_amount,
        total_weighted_amount=f.total_weighted_amount,
        buckets=[
            ForecastBucketOut(
                period=b.period,
                opportunity_count=b.opportunity_count,
                gross_amount=b.gross_amount,
                weighted_amount=b.weighted_amount,
                lower_bound=b.lower_bound,
                upper_bound=b.upper_bound,
            )
            for b in f.buckets
        ],
        model_used=f.model_used,
        average_risk_score=f.average_risk_score,
    )


@router.post("/{opportunity_id}/summarize", response_model=SummarizeOut)
async def summarize(
    opportunity_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> SummarizeOut:
    """案件サマリ + 顧客向けメール骨子を AI で生成 (未設定時はテンプレ)."""
    opp = await session.get(Opportunity, opportunity_id)
    if opp is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "opportunity not found")
    client = await session.get(Client, opp.client_id)
    result = summarize_opportunity(
        ProposalSummarizeInput(
            opportunity_code=opp.opportunity_code,
            title=opp.title,
            client_name=client.client_name if client else "",
            stage=opp.stage,
            win_probability=opp.win_probability or Decimal("0"),
            expected_amount=opp.expected_amount,
            work_category=opp.work_category,
            description=opp.description,
        )
    )
    return SummarizeOut(
        summary=result.summary,
        email_skeleton=result.email_skeleton,
        model_used=result.model_used,
    )

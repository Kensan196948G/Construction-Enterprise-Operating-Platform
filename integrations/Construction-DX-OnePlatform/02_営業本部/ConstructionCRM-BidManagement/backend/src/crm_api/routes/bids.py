"""入札情報 CRUD + 落札統計."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import BidRecord
from ..services.bid_analyzer import BidAnalysisInput, analyze

router = APIRouter(prefix="/bids", tags=["bids"])

BidType = Literal["public", "private"]


class BidIn(BaseModel):
    bid_code: str
    opportunity_id: int | None = None
    bid_type: BidType = "public"
    bid_method: str | None = None
    issuer_name: str
    project_name: str
    announcement_date: date | None = None
    bid_date: date | None = None
    award_date: date | None = None
    bid_price: Decimal | None = None
    estimated_price: Decimal | None = None
    award_price: Decimal | None = None
    technical_score: Decimal | None = None
    price_score: Decimal | None = None
    evaluation_score: Decimal | None = None
    result: str = "pending"
    winner_name: str | None = None
    remarks: str | None = None


class BidOut(BidIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CompetitorWinOut(BaseModel):
    name: str
    wins: int


class BidStatsOut(BaseModel):
    total_count: int
    won_count: int
    lost_count: int
    win_rate: Decimal
    average_price_gap_ratio: Decimal | None
    top_competitors: list[CompetitorWinOut]


class GroupStatOut(BaseModel):
    key: str
    total: int
    won: int
    win_rate: Decimal


class CompetitorStatOut(BaseModel):
    name: str
    wins: int
    win_rate: Decimal


class StrategyStatOut(BaseModel):
    tier: str
    count: int
    won: int
    win_rate: Decimal


class BidAnalyticsOut(BaseModel):
    total_count: int
    won_count: int
    lost_count: int
    win_rate: Decimal
    average_price_gap_ratio: Decimal | None
    average_award_deviation_ratio: Decimal | None
    competitor_stats: list[CompetitorStatOut]
    by_issuer: list[GroupStatOut]
    by_work_category: list[GroupStatOut]
    by_period: list[GroupStatOut]
    strategy_distribution: list[StrategyStatOut]


@router.get("", response_model=list[BidOut])
async def list_bids(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    bid_type: BidType | None = None,
) -> list[BidOut]:
    stmt = select(BidRecord)
    if bid_type:
        stmt = stmt.where(BidRecord.bid_type == bid_type)
    result = await session.execute(stmt)
    return [BidOut.model_validate(b) for b in result.scalars().all()]


@router.post("", response_model=BidOut, status_code=status.HTTP_201_CREATED)
async def create_bid(
    body: BidIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BidOut:
    bid = BidRecord(**body.model_dump(exclude_none=True))
    session.add(bid)
    await session.flush()
    return BidOut.model_validate(bid)


@router.get("/{bid_id}", response_model=BidOut)
async def get_bid(
    bid_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BidOut:
    bid = await session.get(BidRecord, bid_id)
    if bid is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "bid not found")
    return BidOut.model_validate(bid)


@router.get("/stats/summary", response_model=BidStatsOut)
async def stats_summary(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BidStatsOut:
    """落札率 / 競合分析サマリ."""
    result = await session.execute(select(BidRecord))
    inputs = [
        BidAnalysisInput(
            bid_id=b.id,
            result=b.result,
            bid_price=b.bid_price,
            estimated_price=b.estimated_price,
            winner_name=b.winner_name,
        )
        for b in result.scalars().all()
    ]
    a = analyze(inputs)
    return BidStatsOut(
        total_count=a.total_count,
        won_count=a.won_count,
        lost_count=a.lost_count,
        win_rate=a.win_rate,
        average_price_gap_ratio=a.average_price_gap_ratio,
        top_competitors=[CompetitorWinOut(name=n, wins=w) for n, w in a.top_competitors],
    )


@router.get("/analytics", response_model=BidAnalyticsOut)
async def bid_analytics(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    period: Literal["all", "month", "quarter", "year"] = "all",
    date_from: date | None = None,
    date_to: date | None = None,
) -> BidAnalyticsOut:
    """落札率/競合分析/逸脱率/価格戦略分析の詳細サマリ."""
    stmt = select(BidRecord)
    if date_from:
        stmt = stmt.where(BidRecord.bid_date >= date_from)
    if date_to:
        stmt = stmt.where(BidRecord.bid_date <= date_to)
    result = await session.execute(stmt)
    inputs = [
        BidAnalysisInput(
            bid_id=b.id,
            result=b.result,
            bid_price=b.bid_price,
            estimated_price=b.estimated_price,
            award_price=b.award_price,
            winner_name=b.winner_name,
            issuer_name=b.issuer_name,
            work_category=None,  # bid モデルに無いので opportunity との JOIN 拡張余地
            bid_date=b.bid_date,
        )
        for b in result.scalars().all()
    ]
    a = analyze(inputs)
    return BidAnalyticsOut(
        total_count=a.total_count,
        won_count=a.won_count,
        lost_count=a.lost_count,
        win_rate=a.win_rate,
        average_price_gap_ratio=a.average_price_gap_ratio,
        average_award_deviation_ratio=a.average_award_deviation_ratio,
        competitor_stats=[
            CompetitorStatOut(name=c.name, wins=c.wins, win_rate=c.win_rate)
            for c in a.competitor_stats
        ],
        by_issuer=[
            GroupStatOut(key=g.key, total=g.total, won=g.won, win_rate=g.win_rate)
            for g in a.by_issuer
        ],
        by_work_category=[
            GroupStatOut(key=g.key, total=g.total, won=g.won, win_rate=g.win_rate)
            for g in a.by_work_category
        ],
        by_period=[
            GroupStatOut(key=g.key, total=g.total, won=g.won, win_rate=g.win_rate)
            for g in a.by_period
        ],
        strategy_distribution=[
            StrategyStatOut(tier=s.tier, count=s.count, won=s.won, win_rate=s.win_rate)
            for s in a.strategy_distribution
        ],
    )

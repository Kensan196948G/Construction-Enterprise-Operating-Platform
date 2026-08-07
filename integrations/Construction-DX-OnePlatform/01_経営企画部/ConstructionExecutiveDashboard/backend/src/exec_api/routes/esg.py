"""ESG / SDGs 指標."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user, require_roles
from cdx_auth.models import AuthenticatedUser, Role
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import EsgIndicator
from ..services.esg_calculator import (
    Co2Input,
    calc_co2,
    calc_female_manager_ratio,
    calc_overall_esg_score,
    calc_sdg_coverage,
    calc_turnover_rate,
    get_sdg_mapping,
)

router = APIRouter(prefix="/esg", tags=["esg"])


class EsgIndicatorIn(BaseModel):
    fiscal_year: int
    fiscal_month: int | None = None
    report_date: date
    axis: str
    indicator_code: str
    indicator_name: str
    value: Decimal
    unit: str | None = None
    target_value: Decimal | None = None
    sdgs_goal: int | None = None


class EsgIndicatorOut(EsgIndicatorIn):
    id: int

    class Config:
        from_attributes = True


@router.get("/metrics", response_model=list[EsgIndicatorOut])
async def list_metrics(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    axis: str | None = Query(default=None),
    fiscal_year: int | None = Query(default=None),
) -> list[EsgIndicator]:
    stmt = select(EsgIndicator).order_by(EsgIndicator.report_date.desc()).limit(200)
    if axis:
        stmt = stmt.where(EsgIndicator.axis == axis)
    if fiscal_year:
        stmt = stmt.where(EsgIndicator.fiscal_year == fiscal_year)
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


@router.post("/metrics", response_model=EsgIndicatorOut, status_code=status.HTTP_201_CREATED)
async def create_metric(
    payload: EsgIndicatorIn,
    user: Annotated[AuthenticatedUser, Depends(require_roles(Role.EXECUTIVE, Role.SYSTEM_ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EsgIndicator:
    row = EsgIndicator(**payload.model_dump())
    session.add(row)
    await session.flush()
    return row


class Co2Request(BaseModel):
    scope1_t: float
    scope2_t: float
    scope3_t: float


@router.post("/co2")
async def co2(
    body: Co2Request,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    r = calc_co2(Co2Input(**body.model_dump()))
    return {
        "total_t": r.total_t,
        "scope1_t": r.scope1_t,
        "scope2_t": r.scope2_t,
        "scope3_t": r.scope3_t,
        "scope3_share": r.scope3_share,
    }


class ScorecardRequest(BaseModel):
    co2_total_t: float
    co2_target_t: float
    leavers: int
    avg_headcount: int
    female_managers: int
    total_managers: int
    compliance_violations: int
    partner_score_avg: float = 70.0


@router.post("/scorecard")
async def scorecard(
    body: ScorecardRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    turnover = calc_turnover_rate(body.leavers, body.avg_headcount)
    female = calc_female_manager_ratio(body.female_managers, body.total_managers)
    s = calc_overall_esg_score(
        co2_total_t=body.co2_total_t,
        co2_target_t=body.co2_target_t,
        turnover_rate=turnover,
        female_manager_ratio=female,
        compliance_violations=body.compliance_violations,
        partner_score_avg=body.partner_score_avg,
    )
    return {
        "turnover_rate": turnover,
        "female_manager_ratio": female,
        "environment_score": s.environment_score,
        "social_score": s.social_score,
        "governance_score": s.governance_score,
        "overall_score": s.overall_score,
    }


@router.get("/sdg-mapping")
async def sdg_mapping(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    active_kpis: str | None = Query(
        default=None,
        description="カバレッジ計算対象の KPI 名 (カンマ区切り)",
    ),
) -> dict[str, Any]:
    """社内 KPI → SDGs 17 ゴール のマッピングを返す.

    ``active_kpis`` を指定すると、その KPI 集合が 17 ゴールのうち
    何件をカバーしているか (coverage_ratio) も併せて返す。
    """
    mapping = get_sdg_mapping()
    coverage = None
    if active_kpis:
        kpis = [k.strip() for k in active_kpis.split(",") if k.strip()]
        coverage = calc_sdg_coverage(kpis)
    return {"mapping": mapping, "coverage": coverage}


@router.get("/summary")
async def summary(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    fiscal_year: int = Query(...),
) -> dict[str, Any]:
    stmt = select(EsgIndicator.axis, func.count(EsgIndicator.id), func.sum(EsgIndicator.value)) \
        .where(EsgIndicator.fiscal_year == fiscal_year) \
        .group_by(EsgIndicator.axis)
    rows = (await session.execute(stmt)).all()
    return {"fiscal_year": fiscal_year, "by_axis": [
        {"axis": axis, "count": int(c), "sum_value": float(v or 0)} for axis, c, v in rows
    ]}

"""経営ダッシュボード主指標."""

from __future__ import annotations

from datetime import date
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from ..services.aggregator import aggregate_all, consolidate_kpi

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardSummary(BaseModel):
    period: str
    kpis: dict[str, Any]
    sources: dict[str, Any]
    departments: dict[str, Any]
    department_errors: dict[str, str]
    errors: list[str]


@router.get("/summary", response_model=DashboardSummary)
async def summary(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    period: str = Query(default="current", description="current|YYYY-Qn|YYYY-MM"),
) -> DashboardSummary:
    """他部門 API を集約してトップレベル KPI と 10 部門個別 KPI を返す."""
    metrics = await aggregate_all()
    kpis = consolidate_kpi(metrics)
    return DashboardSummary(
        period=period if period != "current" else date.today().strftime("%Y-%m"),
        kpis=kpis,
        sources={
            "sales": metrics.sales,
            "construction": metrics.construction,
            "safety": metrics.safety,
            "corporate": metrics.corporate,
            "procurement": metrics.procurement,
            "itsm": metrics.itsm,
        },
        departments=metrics.departments,
        department_errors=metrics.department_errors,
        errors=metrics.errors,
    )


@router.get("/orders")
async def orders(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    metrics = await aggregate_all()
    return {"orders_amount": consolidate_kpi(metrics)["orders_amount"], "source": metrics.sales}


@router.get("/profit")
async def profit(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    metrics = await aggregate_all()
    k = consolidate_kpi(metrics)
    return {
        "average_profit_margin": k["average_profit_margin"],
        "deficit_project_count": k["deficit_project_count"],
        "source": metrics.construction,
    }


@router.get("/safety")
async def safety(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    metrics = await aggregate_all()
    k = consolidate_kpi(metrics)
    return {
        "accident_count": k["accident_count"],
        "near_miss_count": k["near_miss_count"],
        "source": metrics.safety,
    }

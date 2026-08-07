"""KPI スナップショット CRUD + 集計."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user, require_roles
from cdx_auth.models import AuthenticatedUser, Role
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import KpiSnapshot

router = APIRouter(prefix="/kpi", tags=["kpi"])


class KpiSnapshotIn(BaseModel):
    snapshot_date: date
    period_type: str = "monthly"
    fiscal_year: int | None = None
    fiscal_month: int | None = None
    department_code: str | None = None
    branch_code: str | None = None
    kpi_type: str
    target_value: Decimal | None = None
    actual_value: Decimal = Field(default=Decimal("0"))
    unit: str | None = None
    source: str | None = None


class KpiSnapshotOut(KpiSnapshotIn):
    id: int
    achievement_rate: Decimal | None = None

    class Config:
        from_attributes = True


@router.get("", response_model=list[KpiSnapshotOut])
async def list_kpis(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    kpi_type: str | None = Query(default=None),
    department_code: str | None = Query(default=None),
    fiscal_year: int | None = Query(default=None),
    limit: int = Query(default=100, le=500),
) -> list[KpiSnapshot]:
    stmt = select(KpiSnapshot).limit(limit)
    if kpi_type:
        stmt = stmt.where(KpiSnapshot.kpi_type == kpi_type)
    if department_code:
        stmt = stmt.where(KpiSnapshot.department_code == department_code)
    if fiscal_year:
        stmt = stmt.where(KpiSnapshot.fiscal_year == fiscal_year)
    result = await session.execute(stmt.order_by(KpiSnapshot.snapshot_date.desc()))
    return list(result.scalars().all())


@router.post("", response_model=KpiSnapshotOut, status_code=status.HTTP_201_CREATED)
async def create_kpi(
    payload: KpiSnapshotIn,
    user: Annotated[AuthenticatedUser, Depends(require_roles(Role.EXECUTIVE, Role.SYSTEM_ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> KpiSnapshot:
    row = KpiSnapshot(**payload.model_dump())
    if row.target_value and row.target_value > 0 and row.actual_value is not None:
        row.achievement_rate = Decimal(row.actual_value) / Decimal(row.target_value)
    session.add(row)
    await session.flush()
    return row


@router.get("/aggregate")
async def aggregate(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    kpi_type: str = Query(...),
    fiscal_year: int | None = Query(default=None),
) -> dict[str, Any]:
    """KPI 種別の合計と達成率の平均."""
    stmt = select(
        func.coalesce(func.sum(KpiSnapshot.actual_value), 0),
        func.coalesce(func.avg(KpiSnapshot.achievement_rate), 0),
        func.count(KpiSnapshot.id),
    ).where(KpiSnapshot.kpi_type == kpi_type)
    if fiscal_year:
        stmt = stmt.where(KpiSnapshot.fiscal_year == fiscal_year)
    row = (await session.execute(stmt)).one()
    return {
        "kpi_type": kpi_type,
        "fiscal_year": fiscal_year,
        "sum_actual": float(row[0] or 0),
        "avg_achievement_rate": float(row[1] or 0),
        "count": int(row[2] or 0),
    }


@router.get("/{kpi_id}", response_model=KpiSnapshotOut)
async def get_kpi(
    kpi_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> KpiSnapshot:
    row = await session.get(KpiSnapshot, kpi_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "kpi_not_found")
    return row

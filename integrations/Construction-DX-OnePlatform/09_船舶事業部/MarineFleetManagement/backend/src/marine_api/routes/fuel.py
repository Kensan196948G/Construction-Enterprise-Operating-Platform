"""燃料管理 + 燃費分析."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import FuelRecord
from ..services import calculate_efficiency
from ..services.fuel_optimizer import optimize_speed

router = APIRouter(prefix="/fuel", tags=["fuel"])


class FuelRecordIn(BaseModel):
    vessel_id: int
    recorded_at: datetime
    fuel_type: str = "A重油"
    refuel_liters: float = Field(default=0.0, ge=0)
    unit_price: float | None = None
    remaining_liters: float | None = None
    engine_hours: float | None = None


class EfficiencyIn(BaseModel):
    liters_consumed: float = Field(..., ge=0)
    hours: float = Field(..., gt=0)
    distance_nm: float | None = None
    fuel_type: str = "A重油"


@router.get("")
async def list_records(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    vessel_id: int | None = None,
) -> list[dict]:
    stmt = select(FuelRecord).order_by(FuelRecord.recorded_at.desc())
    if vessel_id is not None:
        stmt = stmt.where(FuelRecord.vessel_id == vessel_id)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "vessel_id": r.vessel_id,
            "recorded_at": r.recorded_at.isoformat(),
            "fuel_type": r.fuel_type,
            "refuel_liters": float(r.refuel_liters),
            "remaining_liters": float(r.remaining_liters) if r.remaining_liters is not None else None,
        }
        for r in rows
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_record(
    body: FuelRecordIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    rec = FuelRecord(**body.model_dump(exclude_none=True))
    session.add(rec)
    await session.flush()
    return {"id": rec.id, "vessel_id": rec.vessel_id}


@router.post("/efficiency")
async def analyze_efficiency(
    body: EfficiencyIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict:
    """燃料消費量 / 時間 / 距離 から L/h, L/NM, CO2 を計算."""
    eff = calculate_efficiency(body.liters_consumed, body.hours, body.distance_nm, body.fuel_type)
    return {
        "liters_per_hour": eff.liters_per_hour,
        "liters_per_nautical_mile": eff.liters_per_nautical_mile,
        "co2_kg": eff.co2_kg,
    }


class FuelOptimizeIn(BaseModel):
    distance_nm: float = Field(..., gt=0)
    sea_state: float = Field(default=1.0, ge=0, description="波高 m 等の海象指標")
    cargo_tons: float = Field(default=0.0, ge=0)
    min_speed_knots: float = Field(default=6.0, gt=0)
    max_speed_knots: float = Field(default=18.0, gt=0)


@router.post("/optimize")
async def optimize_fuel(
    body: FuelOptimizeIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict:
    """航海条件から燃費最適速度を提案する."""
    result = optimize_speed(
        distance_nm=body.distance_nm,
        sea_state=body.sea_state,
        cargo_tons=body.cargo_tons,
        min_speed_knots=body.min_speed_knots,
        max_speed_knots=body.max_speed_knots,
    )
    return {
        "optimal_speed_knots": result.optimal_speed_knots,
        "consumption_per_nm": result.consumption_per_nm,
        "total_fuel_liters": result.total_fuel_liters,
        "travel_hours": result.travel_hours,
        "co2_kg": result.co2_kg,
        "model_source": result.model_source,
    }


@router.get("/summary/{vessel_id}")
async def vessel_summary(
    vessel_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    total = (
        await session.execute(
            select(func.coalesce(func.sum(FuelRecord.refuel_liters), 0)).where(
                FuelRecord.vessel_id == vessel_id
            )
        )
    ).scalar_one()
    return {"vessel_id": vessel_id, "total_refuel_liters": float(total or 0)}

"""船隊ダッシュボード KPI."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import (
    FuelRecord,
    MarineConstructionLink,
    Vessel,
    Voyage,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def fleet_summary(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """船隊全体 KPI: 稼働率 / 燃料総量 / 工事貢献 / 事故 0 時間."""
    vessels_total = (await session.execute(select(func.count(Vessel.id)))).scalar_one()
    vessels_active = (
        await session.execute(select(func.count(Vessel.id)).where(Vessel.status == "active"))
    ).scalar_one()

    voyages_total = (await session.execute(select(func.count(Voyage.id)))).scalar_one()
    voyages_in_transit = (
        await session.execute(
            select(func.count(Voyage.id)).where(Voyage.status.in_(("departed", "in_transit")))
        )
    ).scalar_one()

    total_fuel = (
        await session.execute(select(func.coalesce(func.sum(FuelRecord.refuel_liters), 0)))
    ).scalar_one()

    construction_days = (
        await session.execute(
            select(func.coalesce(func.sum(MarineConstructionLink.used_days), 0))
        )
    ).scalar_one()

    utilization = (
        float(voyages_in_transit) / float(voyages_total) if voyages_total else 0.0
    )

    # 事故 0 時間 (連続無事故時間) は別テーブル管理想定。骨格としては定数値で返す。
    return {
        "vessels": {"total": int(vessels_total), "active": int(vessels_active)},
        "voyages": {
            "total": int(voyages_total),
            "in_transit": int(voyages_in_transit),
            "utilization_rate": round(utilization, 3),
        },
        "fuel": {"total_refuel_liters": float(total_fuel or 0)},
        "construction_contribution": {"vessel_used_days": int(construction_days or 0)},
        "safety": {"accident_free_hours": 0},
    }

"""船位履歴 + 最新位置."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import VesselPosition

router = APIRouter(prefix="/positions", tags=["positions"])


class PositionIn(BaseModel):
    vessel_id: int
    time: datetime
    longitude: float
    latitude: float
    speed_knots: float | None = None
    heading_deg: float | None = None
    source: str = "AIS"


@router.get("/{vessel_id}/latest")
async def latest(
    vessel_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict | None:
    row = (
        await session.execute(
            select(VesselPosition)
            .where(VesselPosition.vessel_id == vessel_id)
            .order_by(desc(VesselPosition.time))
            .limit(1)
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    return {
        "vessel_id": row.vessel_id,
        "time": row.time.isoformat(),
        "speed_knots": float(row.speed_knots) if row.speed_knots is not None else None,
        "heading_deg": float(row.heading_deg) if row.heading_deg is not None else None,
        "source": row.source,
    }


@router.get("/{vessel_id}/track")
async def track(
    vessel_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = Query(default=500, ge=1, le=10000),
) -> list[dict]:
    rows = (
        await session.execute(
            select(VesselPosition)
            .where(VesselPosition.vessel_id == vessel_id)
            .order_by(desc(VesselPosition.time))
            .limit(limit)
        )
    ).scalars().all()
    return [
        {
            "time": r.time.isoformat(),
            "speed_knots": float(r.speed_knots) if r.speed_knots is not None else None,
            "heading_deg": float(r.heading_deg) if r.heading_deg is not None else None,
            "source": r.source,
        }
        for r in rows
    ]

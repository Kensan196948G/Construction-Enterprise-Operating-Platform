"""海象データ取得 (気象庁 stub)."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import MarineWeather
from ..services import fetch_marine_forecast

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/forecast")
async def forecast(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    area_code: str = Query(default="130000", description="気象庁エリアコード (例: 東京 130000)"),
) -> dict:
    """気象庁海上予報 API を呼び出す (stub)."""
    fc = await fetch_marine_forecast(area_code)
    return {
        "area_code": fc.area_code,
        "issued_at": fc.issued_at.isoformat(),
        "wind_speed_mps": fc.wind_speed_mps,
        "wind_direction_deg": fc.wind_direction_deg,
        "wave_height_m": fc.wave_height_m,
        "visibility_km": fc.visibility_km,
        "source": fc.source,
    }


@router.get("/observations")
async def observations(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    station_code: str | None = None,
    limit: int = Query(default=200, ge=1, le=10000),
) -> list[dict]:
    stmt = select(MarineWeather).order_by(MarineWeather.time.desc()).limit(limit)
    if station_code:
        stmt = stmt.where(MarineWeather.station_code == station_code)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        {
            "time": r.time.isoformat(),
            "station_code": r.station_code,
            "wind_speed_mps": float(r.wind_speed_mps) if r.wind_speed_mps is not None else None,
            "wave_height_m": float(r.wave_height_m) if r.wave_height_m is not None else None,
            "source": r.source,
        }
        for r in rows
    ]

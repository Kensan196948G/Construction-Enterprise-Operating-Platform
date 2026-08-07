"""運航計画 CRUD + ETA 計算."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Voyage
from ..services import calculate_eta

router = APIRouter(prefix="/voyages", tags=["voyages"])


class VoyageIn(BaseModel):
    voyage_no: str = Field(..., max_length=30)
    vessel_id: int
    project_code: str | None = None
    departure_port: str
    arrival_port: str
    planned_departure_at: datetime
    planned_arrival_at: datetime
    purpose: str | None = None


class VoyageOut(VoyageIn):
    id: int
    status: str = "planned"
    actual_departure_at: datetime | None = None
    actual_arrival_at: datetime | None = None


class ETARequest(BaseModel):
    current_lat: float
    current_lon: float
    dest_lat: float
    dest_lon: float
    speed_knots: float = Field(..., gt=0)
    wave_height_m: float | None = None


@router.get("", response_model=list[VoyageOut])
async def list_voyages(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[VoyageOut]:
    rows = (await session.execute(select(Voyage))).scalars().all()
    return [VoyageOut.model_validate(v, from_attributes=True) for v in rows]


@router.post("", response_model=VoyageOut, status_code=status.HTTP_201_CREATED)
async def create_voyage(
    body: VoyageIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> VoyageOut:
    v = Voyage(**body.model_dump(exclude_none=True))
    session.add(v)
    await session.flush()
    return VoyageOut.model_validate(v, from_attributes=True)


@router.get("/{voyage_id}", response_model=VoyageOut)
async def get_voyage(
    voyage_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> VoyageOut:
    v = await session.get(Voyage, voyage_id)
    if v is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "voyage not found")
    return VoyageOut.model_validate(v, from_attributes=True)


@router.post("/eta")
async def compute_eta(
    body: ETARequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict:
    """現在位置・速度・海象から ETA を計算する."""
    eta = calculate_eta(
        body.current_lat, body.current_lon, body.dest_lat, body.dest_lon,
        body.speed_knots, wave_height_m=body.wave_height_m,
    )
    return {
        "distance_nm": eta.distance_nm,
        "effective_speed_knots": eta.effective_speed_knots,
        "travel_hours": eta.travel_hours,
        "eta_utc": eta.eta_utc.isoformat(),
    }

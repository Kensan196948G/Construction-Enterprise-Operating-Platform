"""船舶マスタ CRUD + 稼働率."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Vessel, Voyage

router = APIRouter(prefix="/vessels", tags=["vessels"])


class VesselIn(BaseModel):
    vessel_code: str = Field(..., max_length=20)
    vessel_name: str = Field(..., max_length=100)
    vessel_type: str = "作業船"
    imo_number: str | None = None
    mmsi: str | None = None
    gross_tonnage: float | None = None
    length_overall_m: float | None = None
    draft_m: float | None = None
    main_engine_kw: float | None = None
    build_year: int | None = None
    home_port: str | None = None


class VesselOut(VesselIn):
    id: int
    status: str = "active"


@router.get("", response_model=list[VesselOut])
async def list_vessels(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[VesselOut]:
    result = await session.execute(select(Vessel))
    return [VesselOut.model_validate(v, from_attributes=True) for v in result.scalars().all()]


@router.post("", response_model=VesselOut, status_code=status.HTTP_201_CREATED)
async def create_vessel(
    body: VesselIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> VesselOut:
    v = Vessel(**body.model_dump(exclude_none=True))
    session.add(v)
    await session.flush()
    return VesselOut.model_validate(v, from_attributes=True)


@router.get("/{vessel_id}", response_model=VesselOut)
async def get_vessel(
    vessel_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> VesselOut:
    v = await session.get(Vessel, vessel_id)
    if v is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "vessel not found")
    return VesselOut.model_validate(v, from_attributes=True)


@router.get("/{vessel_id}/utilization")
async def utilization(
    vessel_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """対象船舶の稼働 voyage 数からシンプル稼働率を返す."""
    total = (
        await session.execute(select(func.count(Voyage.id)).where(Voyage.vessel_id == vessel_id))
    ).scalar_one()
    active = (
        await session.execute(
            select(func.count(Voyage.id)).where(
                Voyage.vessel_id == vessel_id,
                Voyage.status.in_(("departed", "in_transit")),
            )
        )
    ).scalar_one()
    rate = float(active) / float(total) if total else 0.0
    return {"vessel_id": vessel_id, "voyages_total": int(total), "voyages_active": int(active),
            "utilization_rate": round(rate, 3)}

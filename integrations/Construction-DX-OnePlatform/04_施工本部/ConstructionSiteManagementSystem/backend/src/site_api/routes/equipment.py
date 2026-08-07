"""重機管理."""
from __future__ import annotations

from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Equipment

router = APIRouter(prefix="/equipment", tags=["equipment"])


class EquipmentIn(BaseModel):
    equipment_name: str
    equipment_type: str | None = None
    project_id: int | None = None
    gps_device_id: str | None = None
    current_location_wkt: str | None = None
    status: str = "active"
    operating_hours: Decimal | None = None


class EquipmentOut(EquipmentIn):
    id: int


@router.get("", response_model=list[EquipmentOut])
async def list_equipment(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[EquipmentOut]:
    rows = (await session.execute(select(Equipment))).scalars().all()
    return [EquipmentOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=EquipmentOut, status_code=201)
async def create_equipment(
    body: EquipmentIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> EquipmentOut:
    rec = Equipment(**body.model_dump())
    session.add(rec)
    await session.flush()
    return EquipmentOut.model_validate(rec, from_attributes=True)

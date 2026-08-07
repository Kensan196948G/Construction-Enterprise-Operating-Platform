"""パートナー管理."""

from __future__ import annotations

from typing import Annotated, Literal

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import PartnerOrg

router = APIRouter(prefix="/partners", tags=["partners"])

PartnerType = Literal["tech_partner", "university", "municipality", "startup", "consultant"]


class PartnerIn(BaseModel):
    partner_code: str
    name: str
    partner_type: PartnerType
    contact_name: str | None = None
    contact_email: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None
    specialties: dict | None = None
    collaboration_history: dict | None = None
    notes: str | None = None
    is_active: bool = True


class PartnerOut(PartnerIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


@router.get("", response_model=list[PartnerOut])
async def list_partners(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    partner_type: Annotated[PartnerType | None, Query()] = None,
) -> list[PartnerOut]:
    stmt = select(PartnerOrg)
    if partner_type:
        stmt = stmt.where(PartnerOrg.partner_type == partner_type)
    result = await session.execute(stmt)
    return [PartnerOut.model_validate(p) for p in result.scalars().all()]


@router.post("", response_model=PartnerOut, status_code=status.HTTP_201_CREATED)
async def create_partner(
    body: PartnerIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PartnerOut:
    obj = PartnerOrg(**body.model_dump(exclude_none=True))
    session.add(obj)
    await session.flush()
    return PartnerOut.model_validate(obj)


@router.get("/{partner_id}", response_model=PartnerOut)
async def get_partner(
    partner_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PartnerOut:
    obj = await session.get(PartnerOrg, partner_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "partner not found")
    return PartnerOut.model_validate(obj)

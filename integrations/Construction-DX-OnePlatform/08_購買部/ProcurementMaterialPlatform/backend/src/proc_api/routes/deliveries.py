"""納品検収."""
from __future__ import annotations

from datetime import date
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Delivery

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


class DeliveryIn(BaseModel):
    delivery_no: str = Field(..., max_length=20)
    order_id: int
    order_item_id: int | None = None
    delivered_qty: float
    defective_qty: float = 0
    delivery_date: date
    inspector_name: str | None = None
    note: str | None = None


class DeliveryOut(DeliveryIn):
    id: int
    status: str
    inspected_at: date | None = None


@router.get("", response_model=list[DeliveryOut])
async def list_deliveries(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[DeliveryOut]:
    rows = (await session.execute(select(Delivery))).scalars().all()
    return [DeliveryOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=DeliveryOut, status_code=status.HTTP_201_CREATED)
async def receive(
    body: DeliveryIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DeliveryOut:
    d = Delivery(**body.model_dump(exclude_none=True), status="received")
    session.add(d)
    await session.flush()
    return DeliveryOut.model_validate(d, from_attributes=True)


@router.post("/{delivery_id}/inspect")
async def inspect(
    delivery_id: int,
    accept: bool,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    d = await session.get(Delivery, delivery_id)
    if d is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "delivery not found")
    d.status = "accepted" if accept else "rejected"
    d.inspected_at = date.today()
    await session.flush()
    return {"delivery_id": delivery_id, "status": d.status}

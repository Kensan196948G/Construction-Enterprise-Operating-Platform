"""寄港記録 CRUD."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import PortCall

router = APIRouter(prefix="/port-calls", tags=["port_calls"])


class PortCallIn(BaseModel):
    vessel_id: int
    voyage_id: int | None = None
    port_name: str
    port_unlocode: str | None = None
    arrived_at: datetime
    departed_at: datetime | None = None
    purpose: str | None = None
    cost_jpy: float | None = None


@router.get("")
async def list_port_calls(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    vessel_id: int | None = None,
) -> list[dict]:
    stmt = select(PortCall).order_by(PortCall.arrived_at.desc())
    if vessel_id is not None:
        stmt = stmt.where(PortCall.vessel_id == vessel_id)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "vessel_id": r.vessel_id,
            "port_name": r.port_name,
            "arrived_at": r.arrived_at.isoformat(),
            "departed_at": r.departed_at.isoformat() if r.departed_at else None,
            "purpose": r.purpose,
            "cost_jpy": float(r.cost_jpy) if r.cost_jpy is not None else None,
        }
        for r in rows
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_port_call(
    body: PortCallIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    pc = PortCall(**body.model_dump(exclude_none=True))
    session.add(pc)
    await session.flush()
    return {"id": pc.id}

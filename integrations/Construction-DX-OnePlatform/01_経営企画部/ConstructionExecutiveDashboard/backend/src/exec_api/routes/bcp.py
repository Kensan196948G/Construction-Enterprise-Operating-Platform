"""BCP 状況."""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated

from cdx_auth.dependencies import get_current_user, require_roles
from cdx_auth.models import AuthenticatedUser, Role
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import BcpStatus

router = APIRouter(prefix="/bcp", tags=["bcp"])


class BcpStatusIn(BaseModel):
    branch_code: str
    branch_name: str
    latitude: float | None = None
    longitude: float | None = None
    operation_status: str = "normal"
    disaster_type: str | None = None
    disaster_severity: str | None = None
    impact_summary: str | None = None
    recovery_plan: str | None = None
    recovery_target_date: date | None = None


class BcpStatusOut(BcpStatusIn):
    id: int
    last_reported_at: datetime

    class Config:
        from_attributes = True


@router.get("/status", response_model=list[BcpStatusOut])
async def list_status(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[BcpStatus]:
    rows = (await session.execute(select(BcpStatus).order_by(BcpStatus.branch_code))).scalars().all()
    return list(rows)


@router.post("/status", response_model=BcpStatusOut, status_code=status.HTTP_201_CREATED)
async def upsert_status(
    payload: BcpStatusIn,
    user: Annotated[AuthenticatedUser, Depends(require_roles(Role.EXECUTIVE, Role.SYSTEM_ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BcpStatus:
    existing = (
        await session.execute(select(BcpStatus).where(BcpStatus.branch_code == payload.branch_code))
    ).scalar_one_or_none()
    now = datetime.utcnow()
    if existing:
        for k, v in payload.model_dump().items():
            setattr(existing, k, v)
        existing.last_reported_at = now
        row = existing
    else:
        row = BcpStatus(**payload.model_dump(), last_reported_at=now)
        session.add(row)
    await session.flush()
    return row


@router.get("/status/{branch_code}", response_model=BcpStatusOut)
async def get_status(
    branch_code: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BcpStatus:
    row = (
        await session.execute(select(BcpStatus).where(BcpStatus.branch_code == branch_code))
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "bcp_status_not_found")
    return row

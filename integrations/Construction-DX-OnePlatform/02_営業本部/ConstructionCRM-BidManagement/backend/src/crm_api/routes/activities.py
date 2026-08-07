"""営業活動履歴 CRUD."""

from __future__ import annotations

from datetime import date, datetime
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import SalesActivity

router = APIRouter(prefix="/activities", tags=["activities"])


class ActivityIn(BaseModel):
    activity_date: date
    activity_type: str  # visit|call|email|proposal|meeting|other
    client_id: int | None = None
    opportunity_id: int | None = None
    subject: str
    contact_person: str | None = None
    content: str | None = None
    result: str | None = None
    follow_up_date: date | None = None
    follow_up_action: str | None = None
    reporter_employee_code: str | None = None


class ActivityOut(ActivityIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    follow_up_completed_at: datetime | None = None


@router.get("", response_model=list[ActivityOut])
async def list_activities(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ActivityOut]:
    result = await session.execute(select(SalesActivity))
    return [ActivityOut.model_validate(a) for a in result.scalars().all()]


@router.post("", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
async def create_activity(
    body: ActivityIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ActivityOut:
    activity = SalesActivity(**body.model_dump(exclude_none=True))
    session.add(activity)
    await session.flush()
    return ActivityOut.model_validate(activity)


@router.get("/{activity_id}", response_model=ActivityOut)
async def get_activity(
    activity_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ActivityOut:
    a = await session.get(SalesActivity, activity_id)
    if a is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "activity not found")
    return ActivityOut.model_validate(a)

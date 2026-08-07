"""出来高 (Progress) 入力 / 取得."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import ProgressRecord

router = APIRouter(prefix="/projects/{project_id}/progress", tags=["progress"])


class ProgressIn(BaseModel):
    record_date: date
    task_id: int | None = None
    progress_rate: Decimal
    earned_value: Decimal | None = None
    remarks: str | None = None
    client_id: str | None = None


class ProgressOut(ProgressIn):
    id: int


@router.get("", response_model=list[ProgressOut])
async def list_progress(
    project_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ProgressOut]:
    rows = (
        await session.execute(
            select(ProgressRecord).where(ProgressRecord.project_id == project_id)
        )
    ).scalars().all()
    return [ProgressOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=ProgressOut, status_code=201)
async def create_progress(
    project_id: int,
    body: ProgressIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProgressOut:
    rec = ProgressRecord(project_id=project_id, **body.model_dump())
    session.add(rec)
    await session.flush()
    return ProgressOut.model_validate(rec, from_attributes=True)

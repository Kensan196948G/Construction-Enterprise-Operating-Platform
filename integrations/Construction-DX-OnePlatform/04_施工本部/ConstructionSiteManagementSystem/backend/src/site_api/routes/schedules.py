"""工程・ガントチャート."""
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
from ..models import ScheduleTask
from ..services.critical_path import compute_from_schedules

router = APIRouter(prefix="/projects/{project_id}/schedule", tags=["schedules"])


class CPMTaskOut(BaseModel):
    id: str
    duration: int
    es: int
    ef: int
    ls: int
    lf: int
    slack: int
    is_critical: bool


class CriticalPathOut(BaseModel):
    tasks: list[CPMTaskOut]
    critical_path: list[str]
    duration: int


class GanttTaskIn(BaseModel):
    task_id: str
    task_name: str
    parent_task_id: str | None = None
    predecessor_task_id: str | None = None
    planned_start: date | None = None
    planned_end: date | None = None
    progress_rate: Decimal = Decimal("0")
    is_critical: bool = False
    sort_order: int = 0


class GanttTaskOut(GanttTaskIn):
    id: int


@router.get("", response_model=list[GanttTaskOut])
async def get_schedule(
    project_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[GanttTaskOut]:
    result = await session.execute(
        select(ScheduleTask).where(ScheduleTask.project_id == project_id).order_by(ScheduleTask.sort_order)
    )
    return [GanttTaskOut.model_validate(t, from_attributes=True) for t in result.scalars().all()]


@router.put("", response_model=list[GanttTaskOut])
async def upsert_schedule(
    project_id: int,
    tasks: list[GanttTaskIn],
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[GanttTaskOut]:
    """工程一括更新 (簡易: 既存削除→投入)."""
    existing = (
        await session.execute(select(ScheduleTask).where(ScheduleTask.project_id == project_id))
    ).scalars().all()
    for t in existing:
        await session.delete(t)
    out: list[GanttTaskOut] = []
    for t in tasks:
        rec = ScheduleTask(project_id=project_id, **t.model_dump())
        session.add(rec)
        await session.flush()
        out.append(GanttTaskOut.model_validate(rec, from_attributes=True))
    return out


@router.get("/critical-path", response_model=CriticalPathOut)
async def critical_path(
    project_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CriticalPathOut:
    """工程からクリティカルパスを CPM で算出して返却."""
    rows = (
        await session.execute(
            select(ScheduleTask)
            .where(ScheduleTask.project_id == project_id)
            .order_by(ScheduleTask.sort_order)
        )
    ).scalars().all()
    result = compute_from_schedules(rows)
    return CriticalPathOut(
        tasks=[
            CPMTaskOut(
                id=r.id,
                duration=r.duration,
                es=r.es,
                ef=r.ef,
                ls=r.ls,
                lf=r.lf,
                slack=r.slack,
                is_critical=r.is_critical,
            )
            for r in result.tasks
        ],
        critical_path=result.critical_path,
        duration=result.duration,
    )

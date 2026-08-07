"""作業日報 + 承認ワークフロー."""
from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser, Role
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import DailySiteReport

router = APIRouter(prefix="/daily-reports", tags=["daily-reports"])


class DailyReportIn(BaseModel):
    project_id: int
    report_date: date
    weather: str | None = None
    temperature_max: Decimal | None = None
    temperature_min: Decimal | None = None
    work_content: list[dict[str, Any]] | None = None
    safety_notes: str | None = None
    ky_records: list[dict[str, Any]] | None = None
    reporter_id: int | None = None
    client_id: str | None = None


class DailyReportOut(DailyReportIn):
    id: int
    approval_status: str


@router.get("", response_model=list[DailyReportOut])
async def list_reports(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    project_id: int | None = None,
) -> list[DailyReportOut]:
    stmt = select(DailySiteReport)
    if project_id is not None:
        stmt = stmt.where(DailySiteReport.project_id == project_id)
    rows = (await session.execute(stmt)).scalars().all()
    return [DailyReportOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=DailyReportOut, status_code=201)
async def create_report(
    body: DailyReportIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DailyReportOut:
    rec = DailySiteReport(**body.model_dump(), approval_status="draft")
    session.add(rec)
    await session.flush()
    return DailyReportOut.model_validate(rec, from_attributes=True)


@router.post("/{report_id}/submit", response_model=DailyReportOut)
async def submit_report(
    report_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DailyReportOut:
    rec = await session.get(DailySiteReport, report_id)
    if rec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "report not found")
    rec.approval_status = "submitted"
    await session.flush()
    return DailyReportOut.model_validate(rec, from_attributes=True)


@router.post("/{report_id}/approve", response_model=DailyReportOut)
async def approve_report(
    report_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DailyReportOut:
    if not user.has_role(Role.SITE_MANAGER, Role.EXECUTIVE, Role.SYSTEM_ADMIN):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "approver role required")
    rec = await session.get(DailySiteReport, report_id)
    if rec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "report not found")
    rec.approval_status = "approved"
    rec.approved_at = datetime.now(tz=timezone.utc)
    await session.flush()
    return DailyReportOut.model_validate(rec, from_attributes=True)

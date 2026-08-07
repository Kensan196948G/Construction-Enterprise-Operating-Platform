"""作業員入退場 + QRトークン発行/検証."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import WorkerAttendance
from ..services.qr_token import issue_token, verify_token

router = APIRouter(prefix="/attendance", tags=["attendance"])


class AttendanceOut(BaseModel):
    id: int
    project_id: int
    worker_name: str
    company_name: str | None
    check_in_at: datetime | None
    check_out_at: datetime | None
    method: str


class QRIssueRequest(BaseModel):
    project_id: int
    worker_id: int


class QRIssueResponse(BaseModel):
    token: str
    expires_in: int


class QRCheckInRequest(BaseModel):
    token: str
    worker_name: str
    company_name: str | None = None
    direction: str = "in"  # in / out


@router.get("", response_model=list[AttendanceOut])
async def list_attendance(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    project_id: int | None = None,
) -> list[AttendanceOut]:
    stmt = select(WorkerAttendance)
    if project_id is not None:
        stmt = stmt.where(WorkerAttendance.project_id == project_id)
    rows = (await session.execute(stmt)).scalars().all()
    return [AttendanceOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("/qr/issue", response_model=QRIssueResponse)
async def issue_qr(
    body: QRIssueRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> QRIssueResponse:
    from ..config import get_settings

    token = issue_token(body.project_id, body.worker_id)
    return QRIssueResponse(token=token, expires_in=get_settings().qr_token_ttl_seconds)


@router.post("/qr/checkin", response_model=AttendanceOut, status_code=201)
async def check_in(
    body: QRCheckInRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AttendanceOut:
    try:
        payload = verify_token(body.token)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"invalid QR token: {e}")
    now = datetime.now(tz=timezone.utc)
    rec = WorkerAttendance(
        project_id=payload["project_id"],
        worker_id=payload["worker_id"],
        worker_name=body.worker_name,
        company_name=body.company_name,
        method="qr_code",
        qr_token_jti=payload["jti"],
        check_in_at=now if body.direction == "in" else None,
        check_out_at=now if body.direction == "out" else None,
    )
    session.add(rec)
    await session.flush()
    return AttendanceOut.model_validate(rec, from_attributes=True)

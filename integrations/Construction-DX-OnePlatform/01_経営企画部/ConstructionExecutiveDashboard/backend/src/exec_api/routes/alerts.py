"""経営アラート."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user, require_roles
from cdx_auth.models import AuthenticatedUser, Role
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import ExecutiveAlert
from ..services.aggregator import aggregate_all, consolidate_kpi
from ..services.alert_evaluator import evaluate

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertOut(BaseModel):
    id: int
    alert_code: str
    triggered_at: datetime
    level: str
    category: str
    title: str
    message: str
    status: str

    class Config:
        from_attributes = True


@router.get("", response_model=list[AlertOut])
async def list_alerts(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    status_filter: str | None = Query(default=None, alias="status"),
    level: str | None = Query(default=None),
) -> list[ExecutiveAlert]:
    stmt = select(ExecutiveAlert).order_by(ExecutiveAlert.triggered_at.desc()).limit(200)
    if status_filter:
        stmt = stmt.where(ExecutiveAlert.status == status_filter)
    if level:
        stmt = stmt.where(ExecutiveAlert.level == level)
    rows = (await session.execute(stmt)).scalars().all()
    return list(rows)


@router.post("/evaluate", response_model=list[AlertOut])
async def evaluate_alerts(
    user: Annotated[AuthenticatedUser, Depends(require_roles(Role.EXECUTIVE, Role.SYSTEM_ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ExecutiveAlert]:
    """他部門 API から集約した KPI を閾値評価し, 新規アラートを永続化."""
    metrics = await aggregate_all()
    kpis = consolidate_kpi(metrics)
    candidates = evaluate(kpis)
    saved: list[ExecutiveAlert] = []
    for c in candidates:
        row = ExecutiveAlert(
            alert_code=c.alert_code,
            triggered_at=c.triggered_at,
            level=c.level,
            category=c.category,
            title=c.title,
            message=c.message,
            kpi_type=c.kpi_type,
            threshold_value=c.threshold_value,
            actual_value=c.actual_value,
            status="open",
            notify_targets=c.notify_targets,
        )
        session.add(row)
        saved.append(row)
    await session.flush()
    return saved


@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
async def acknowledge(
    alert_id: int,
    user: Annotated[AuthenticatedUser, Depends(require_roles(Role.EXECUTIVE, Role.SYSTEM_ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExecutiveAlert:
    row = await session.get(ExecutiveAlert, alert_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "alert_not_found")
    row.status = "acknowledged"
    row.acknowledged_by = user.upn or user.sub
    row.acknowledged_at = datetime.utcnow()
    await session.flush()
    return row


@router.get("/{alert_id}/notifications")
async def notifications(
    alert_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, Any]:
    row = await session.get(ExecutiveAlert, alert_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "alert_not_found")
    return {
        "alert_id": alert_id,
        "notify_targets": row.notify_targets or [],
        "notification_log": row.notification_log or [],
    }

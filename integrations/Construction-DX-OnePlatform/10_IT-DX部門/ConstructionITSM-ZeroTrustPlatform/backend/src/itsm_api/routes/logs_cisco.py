"""Cisco SNMP trap query endpoints."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from itsm_api.db.session import get_db
from itsm_api.deps import get_current_user
from itsm_api.models.cisco_event import CiscoEvent

router = APIRouter(prefix="/api/v1/logs/cisco", tags=["logs:cisco"])


@router.get("")
def list_events(
    since: datetime | None = None,
    severity: str | None = None,
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    stmt = select(CiscoEvent).order_by(CiscoEvent.time.desc()).limit(limit)
    if since:
        stmt = stmt.where(CiscoEvent.time >= since)
    if severity:
        stmt = stmt.where(CiscoEvent.severity == severity)
    rows = db.execute(stmt).scalars().all()
    return [
        {
            "time": r.time.isoformat(),
            "device_ip": r.device_ip,
            "device_name": r.device_name,
            "trap_oid": r.trap_oid,
            "severity": r.severity,
            "message": r.message,
        }
        for r in rows
    ]


@router.get("/summary")
def summary(hours: int = 24, db: Session = Depends(get_db), user=Depends(get_current_user)):
    since = datetime.now(UTC) - timedelta(hours=hours)
    stmt = (
        select(CiscoEvent.severity, func.count())
        .where(CiscoEvent.time >= since)
        .group_by(CiscoEvent.severity)
    )
    rows = db.execute(stmt).all()
    return {"window_hours": hours, "by_severity": {s or "unknown": c for s, c in rows}}

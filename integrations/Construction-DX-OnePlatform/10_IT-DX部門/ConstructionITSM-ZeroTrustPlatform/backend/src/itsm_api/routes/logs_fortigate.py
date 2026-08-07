"""FortiGate Syslog search/aggregation endpoints."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from itsm_api.db.session import get_db
from itsm_api.deps import get_current_user
from itsm_api.models.fortigate_log import FortigateLog

router = APIRouter(prefix="/api/v1/logs/fortigate", tags=["logs:fortigate"])


@router.get("")
def search(
    since: datetime | None = None,
    action: str | None = None,
    severity: str | None = None,
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    stmt = select(FortigateLog).order_by(FortigateLog.time.desc()).limit(limit)
    if since:
        stmt = stmt.where(FortigateLog.time >= since)
    if action:
        stmt = stmt.where(FortigateLog.action == action)
    if severity:
        stmt = stmt.where(FortigateLog.severity == severity)
    rows = db.execute(stmt).scalars().all()
    return [
        {
            "time": r.time.isoformat(),
            "device": r.device_name,
            "src": r.src_ip,
            "dst": r.dst_ip,
            "action": r.action,
            "threat": r.threat,
            "severity": r.severity,
            "message": r.message,
        }
        for r in rows
    ]


@router.get("/summary")
def summary(
    hours: int = 24,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    since = datetime.now(UTC) - timedelta(hours=hours)
    stmt = (
        select(FortigateLog.action, func.count())
        .where(FortigateLog.time >= since)
        .group_by(FortigateLog.action)
    )
    rows = db.execute(stmt).all()
    return {"window_hours": hours, "by_action": {a or "unknown": c for a, c in rows}}

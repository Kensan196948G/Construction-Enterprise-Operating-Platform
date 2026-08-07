"""Entra ID sign-in log endpoints."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from itsm_api.db.session import get_db
from itsm_api.deps import get_current_user
from itsm_api.models.entra_signin import EntraSignin
from itsm_api.services.entra_log_fetcher import fetch_signin_logs

router = APIRouter(prefix="/api/v1/logs/entra", tags=["logs:entra"])


@router.get("/signins")
def list_signins(
    risk_state: str | None = None,
    since: datetime | None = None,
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    stmt = select(EntraSignin).order_by(EntraSignin.occurred_at.desc()).limit(limit)
    if risk_state:
        stmt = stmt.where(EntraSignin.risk_state == risk_state)
    if since:
        stmt = stmt.where(EntraSignin.occurred_at >= since)
    rows = db.execute(stmt).scalars().all()
    return [
        {
            "id": str(r.signin_id),
            "occurred_at": r.occurred_at.isoformat(),
            "user": r.user_principal_name,
            "app": r.app_display_name,
            "ip": r.ip_address,
            "country": r.country,
            "city": r.city,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "risk_state": r.risk_state,
            "risk_level": r.risk_level,
            "success": r.success,
        }
        for r in rows
    ]


@router.post("/sync")
async def sync_entra(user=Depends(get_current_user)):
    """Trigger ad-hoc Entra sign-in sync."""
    items = await fetch_signin_logs()
    return {"fetched": len(items)}

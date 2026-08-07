"""SLA contract management & ad-hoc report."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from itsm_api.db.session import get_db
from itsm_api.deps import get_current_user
from itsm_api.models.sla import SlaContract

router = APIRouter(prefix="/api/v1/sla", tags=["sla"])


@router.get("/contracts")
def list_contracts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.execute(select(SlaContract)).scalars().all()
    return [
        {
            "sla_id": str(r.sla_id),
            "name": r.name,
            "priority": r.priority.value,
            "response_target_min": r.response_target_min,
            "resolution_target_min": r.resolution_target_min,
            "description": r.description,
        }
        for r in rows
    ]

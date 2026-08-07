"""ISO 9001/14001/45001 監査 CRUD + チェックリストテンプレ."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..services.iso_audit_helper import get_checklist
from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="audit_id")


class Finding(BaseModel):
    finding_type: str = "observation"  # major/minor/observation/opportunity
    clause: str | None = None
    description: str
    severity: str = "minor"


class IsoAuditIn(BaseModel):
    audit_type: str = "internal"  # internal/external/surveillance
    iso_standard: str = "ISO9001"
    plan_date: str | None = None
    audit_date: str | None = None
    follow_up_date: str | None = None
    scope: str | None = None
    findings: list[Finding] = Field(default_factory=list)
    lead_auditor: str | None = None
    status: str = "planned"


@router.get("/checklist-template")
def checklist_template(
    standard: str = Query(default="ISO9001", description="ISO9001/ISO14001/ISO45001"),
) -> dict[str, Any]:
    return {"standard": standard, "items": get_checklist(standard)}  # type: ignore[arg-type]


@router.get("")
def list_audits() -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create_audit(payload: IsoAuditIn) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/{audit_id}")
def get_audit(audit_id: str) -> dict[str, Any]:
    item = _store.get(audit_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.put("/{audit_id}")
def update_audit(audit_id: str, payload: IsoAuditIn) -> dict[str, Any]:
    item = _store.update(audit_id, payload.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.delete("/{audit_id}", status_code=204)
def delete_audit(audit_id: str) -> None:
    if not _store.delete(audit_id):
        raise HTTPException(status_code=404, detail="not found")

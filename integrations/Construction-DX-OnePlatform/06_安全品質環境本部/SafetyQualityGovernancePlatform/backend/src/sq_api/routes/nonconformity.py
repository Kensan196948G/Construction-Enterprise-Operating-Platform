"""不適合 + CAPA (corrective/preventive/effectiveness)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.capa_tracker import evaluate as capa_evaluate
from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="nc_id")

CAPA_FLOW = ["open", "corrected", "prevented", "verified", "closed"]


class NonconformityIn(BaseModel):
    project_id: str | None = None
    detected_at: str
    title: str
    description: str | None = None
    severity: str = "minor"
    corrective_action: str | None = None
    preventive_action: str | None = None
    effectiveness_verification: str | None = None
    capa_status: str = "open"
    due_date: str | None = None


def _validate_status(s: str) -> None:
    if s not in CAPA_FLOW:
        raise HTTPException(status_code=400, detail=f"capa_status must be one of {CAPA_FLOW}")


@router.get("")
def list_nc() -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create_nc(payload: NonconformityIn) -> dict[str, Any]:
    _validate_status(payload.capa_status)
    return _store.create(payload.model_dump())


@router.get("/capa-status")
def capa_status() -> dict[str, Any]:
    """CAPA の段階別滞留状況。30 日以上停滞している案件をフラグ立て."""
    return capa_evaluate(_store.list())


@router.get("/{nc_id}")
def get_nc(nc_id: str) -> dict[str, Any]:
    item = _store.get(nc_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.put("/{nc_id}")
def update_nc(nc_id: str, payload: NonconformityIn) -> dict[str, Any]:
    _validate_status(payload.capa_status)
    item = _store.update(nc_id, payload.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.post("/{nc_id}/capa/advance")
def advance_capa(nc_id: str) -> dict[str, Any]:
    """CAPA を是正→予防→効果確認→クローズへ1段階進める."""
    item = _store.get(nc_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    cur = item.get("capa_status", "open")
    if cur == "closed":
        return item
    idx = CAPA_FLOW.index(cur)
    item["capa_status"] = CAPA_FLOW[min(idx + 1, len(CAPA_FLOW) - 1)]
    return _store.update(nc_id, item)  # type: ignore[return-value]


@router.delete("/{nc_id}", status_code=204)
def delete_nc(nc_id: str) -> None:
    if not _store.delete(nc_id):
        raise HTTPException(status_code=404, detail="not found")

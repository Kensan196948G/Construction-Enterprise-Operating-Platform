"""環境記録 (CO2 Scope1/2/3 + 産廃マニフェスト) CRUD."""
from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="env_id")


class EnvIn(BaseModel):
    project_id: str | None = None
    record_type: str = "co2"  # co2/waste/noise/water
    record_date: str
    scope: str | None = None  # scope1/scope2/scope3
    quantity: float = 0.0
    unit: str = "tCO2e"
    manifest_number: str | None = None


@router.get("")
def list_env() -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create_env(payload: EnvIn) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/co2")
def co2_summary() -> dict[str, Any]:
    """CO2 Scope1/2/3 排出量集計."""
    totals: dict[str, float] = defaultdict(float)
    for it in _store.list():
        if it.get("record_type") != "co2":
            continue
        scope = it.get("scope") or "unknown"
        totals[scope] += float(it.get("quantity") or 0)
    return {"unit": "tCO2e", "by_scope": dict(totals), "total": sum(totals.values())}


@router.get("/{env_id}")
def get_env(env_id: str) -> dict[str, Any]:
    item = _store.get(env_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.put("/{env_id}")
def update_env(env_id: str, payload: EnvIn) -> dict[str, Any]:
    item = _store.update(env_id, payload.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.delete("/{env_id}", status_code=204)
def delete_env(env_id: str) -> None:
    if not _store.delete(env_id):
        raise HTTPException(status_code=404, detail="not found")

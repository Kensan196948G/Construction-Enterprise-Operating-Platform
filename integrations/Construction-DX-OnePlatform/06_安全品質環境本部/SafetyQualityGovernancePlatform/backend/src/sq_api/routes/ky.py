"""KY 活動 CRUD."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="ky_id")


class Hazard(BaseModel):
    hazard: str
    risk_rank: str = "B"  # A/B/C
    measure: str | None = None


class KyIn(BaseModel):
    project_id: str | None = None
    activity_date: str
    work_content: str
    hazards: list[Hazard] = Field(default_factory=list)
    participants: list[str] = Field(default_factory=list)
    leader_id: str | None = None


@router.get("")
def list_ky() -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create_ky(payload: KyIn) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/{ky_id}")
def get_ky(ky_id: str) -> dict[str, Any]:
    item = _store.get(ky_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.put("/{ky_id}")
def update_ky(ky_id: str, payload: KyIn) -> dict[str, Any]:
    item = _store.update(ky_id, payload.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.delete("/{ky_id}", status_code=204)
def delete_ky(ky_id: str) -> None:
    if not _store.delete(ky_id):
        raise HTTPException(status_code=404, detail="not found")

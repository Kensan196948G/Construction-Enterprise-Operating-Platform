"""安全パトロール CRUD."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="patrol_id")


class CheckItem(BaseModel):
    item: str
    result: str = "pass"  # pass/fail/na
    comment: str | None = None
    photo_id: str | None = None


class PatrolIn(BaseModel):
    project_id: str | None = None
    patrol_date: str
    inspector_id: str | None = None
    checklist: list[CheckItem] = Field(default_factory=list)
    overall_rating: str = "B"  # A/B/C/D
    corrective_orders: list[str] = Field(default_factory=list)
    photo_ids: list[str] = Field(default_factory=list)
    follow_up_date: str | None = None
    correction_status: str = "open"


@router.get("")
def list_patrols() -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create_patrol(payload: PatrolIn) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/{patrol_id}")
def get_patrol(patrol_id: str) -> dict[str, Any]:
    item = _store.get(patrol_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.put("/{patrol_id}")
def update_patrol(patrol_id: str, payload: PatrolIn) -> dict[str, Any]:
    item = _store.update(patrol_id, payload.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.delete("/{patrol_id}", status_code=204)
def delete_patrol(patrol_id: str) -> None:
    if not _store.delete(patrol_id):
        raise HTTPException(status_code=404, detail="not found")

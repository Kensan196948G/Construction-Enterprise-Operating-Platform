"""法務案件."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ._auth import get_current_user
from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="matter_id")


class LegalMatterIn(BaseModel):
    title: str
    matter_type: str = Field(pattern="^(dispute|claim|compliance|ip|labor|other)$")
    counterparty_name: str | None = None
    assigned_lawyer: str | None = None
    opened_at: str | None = None
    status: str = "open"
    related_files: list[dict[str, Any]] = []
    description: str | None = None


@router.get("")
def list_items(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create(payload: LegalMatterIn, _=Depends(get_current_user)) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/{matter_id}")
def get_one(matter_id: str, _=Depends(get_current_user)) -> dict[str, Any]:
    item = _store.get(matter_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item

"""売掛金 + 督促."""
from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ._auth import get_current_user
from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="receivable_id")


class ReceivableIn(BaseModel):
    invoice_id: str | None = None
    counterparty_name: str
    amount: float
    scheduled_date: str
    status: str = "pending"


@router.get("")
def list_items(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create(payload: ReceivableIn, _=Depends(get_current_user)) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/dunning-list")
def dunning_list(_=Depends(get_current_user)) -> dict[str, Any]:
    """督促リスト: 入金予定日を過ぎても未回収のもの."""
    today = date.today().isoformat()
    items = _store.list()
    overdue = [
        i
        for i in items
        if i.get("status") == "pending" and i.get("scheduled_date", "") < today
    ]
    return {
        "overdue": sorted(overdue, key=lambda x: x.get("scheduled_date", "")),
        "total_overdue": sum(float(i["amount"]) for i in overdue),
    }


class DunningRegisterIn(BaseModel):
    note: str | None = None


@router.post("/{receivable_id}/dunning")
def register_dunning(
    receivable_id: str,
    payload: DunningRegisterIn,
    _=Depends(get_current_user),
) -> dict[str, Any]:
    item = _store.get(receivable_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    item["dunning_count"] = int(item.get("dunning_count", 0)) + 1
    item["last_dunning_date"] = date.today().isoformat()
    if payload.note:
        item["dunning_note"] = payload.note
    return item

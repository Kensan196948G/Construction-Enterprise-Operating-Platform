"""契約管理."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ._auth import get_current_user
from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="contract_id")


class ContractIn(BaseModel):
    contract_no: str
    title: str
    contract_type: str = Field(pattern="^(construction|subcontract|lease|service|nda|other)$")
    counterparty_name: str
    start_date: str
    end_date: str | None = None
    amount: float = 0
    auto_renewal: bool = False
    termination_clause: str | None = None
    file_path: str | None = None
    status: str = "active"


@router.get("")
def list_contracts(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create(payload: ContractIn, _=Depends(get_current_user)) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/{contract_id}")
def get_one(contract_id: str, _=Depends(get_current_user)) -> dict[str, Any]:
    item = _store.get(contract_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.get("/expiring/list")
def expiring(days: int = Query(default=60, ge=1), _=Depends(get_current_user)) -> dict[str, Any]:
    """期限が近い契約一覧."""
    threshold = (date.today() + timedelta(days=days)).isoformat()
    items = [
        i
        for i in _store.list()
        if i.get("end_date") and i["end_date"] <= threshold and i.get("status") == "active"
    ]
    return {"days": days, "items": items}

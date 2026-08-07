"""品質記録 CRUD."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="quality_id")


class QualityIn(BaseModel):
    project_id: str | None = None
    record_type: str = "inspection"  # inspection/test/ncr/capa
    title: str
    description: str | None = None
    measurement_value: float | None = None
    spec_upper: float | None = None
    spec_lower: float | None = None
    result: str = "pass"  # pass/fail/conditional
    evidence_files: list[str] = Field(default_factory=list)
    inspector_id: str | None = None


def _judge(payload: dict[str, Any]) -> dict[str, Any]:
    v = payload.get("measurement_value")
    u = payload.get("spec_upper")
    l_ = payload.get("spec_lower")
    if v is None:
        return payload
    if u is not None and v > u or l_ is not None and v < l_:
        payload["result"] = "fail"
    else:
        payload["result"] = payload.get("result") or "pass"
    return payload


@router.get("")
def list_quality() -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create_quality(payload: QualityIn) -> dict[str, Any]:
    return _store.create(_judge(payload.model_dump()))


@router.get("/{quality_id}")
def get_quality(quality_id: str) -> dict[str, Any]:
    item = _store.get(quality_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.put("/{quality_id}")
def update_quality(quality_id: str, payload: QualityIn) -> dict[str, Any]:
    item = _store.update(quality_id, _judge(payload.model_dump()))
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.delete("/{quality_id}", status_code=204)
def delete_quality(quality_id: str) -> None:
    if not _store.delete(quality_id):
        raise HTTPException(status_code=404, detail="not found")

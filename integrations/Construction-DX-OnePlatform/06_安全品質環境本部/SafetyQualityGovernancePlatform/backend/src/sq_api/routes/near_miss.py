"""ヒヤリハット CRUD + 4M 分析集計."""
from __future__ import annotations

from collections import Counter
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..services.four_m_analyzer import summarize as four_m_summarize
from ._store import MemoryStore
from .accidents import _store as _accident_store

router = APIRouter()
_store = MemoryStore(id_key="near_miss_id")


class FourM(BaseModel):
    """4M 分析: Man/Machine/Material/Method."""

    man: bool = False
    machine: bool = False
    material: bool = False
    method: bool = False


class NearMissIn(BaseModel):
    project_id: str | None = None
    occurred_at: str
    location: str | None = None
    description: str
    cause_analysis: FourM = Field(default_factory=FourM)
    risk_level: str = "medium"
    corrective_action: str | None = None
    photo_ids: list[str] = Field(default_factory=list)


@router.get("")
def list_near_miss() -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create_near_miss(payload: NearMissIn) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/analysis")
def analysis_4m() -> dict[str, Any]:
    """4M 分類別の発生件数集計."""
    counts: Counter[str] = Counter()
    risk_counts: Counter[str] = Counter()
    for it in _store.list():
        ca = it.get("cause_analysis") or {}
        for k in ("man", "machine", "material", "method"):
            if ca.get(k):
                counts[k] += 1
        risk_counts[it.get("risk_level", "unknown")] += 1
    return {
        "total": len(_store.list()),
        "by_4m": dict(counts),
        "by_risk_level": dict(risk_counts),
    }


@router.get("/four-m-summary")
def four_m_summary(
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
    dept_id: str | None = Query(default=None),
) -> dict[str, Any]:
    """ヒヤリハット + 労災を統合した 4M 別集計."""
    nm = _store.list()
    ac = _accident_store.list()
    summary = four_m_summarize(nm, ac, from_=from_, to=to, dept_id=dept_id)
    out = summary.to_dict()
    out["from"] = from_
    out["to"] = to
    out["dept_id"] = dept_id
    return out


@router.get("/{near_miss_id}")
def get_near_miss(near_miss_id: str) -> dict[str, Any]:
    item = _store.get(near_miss_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.put("/{near_miss_id}")
def update_near_miss(near_miss_id: str, payload: NearMissIn) -> dict[str, Any]:
    item = _store.update(near_miss_id, payload.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.delete("/{near_miss_id}", status_code=204)
def delete_near_miss(near_miss_id: str) -> None:
    if not _store.delete(near_miss_id):
        raise HTTPException(status_code=404, detail="not found")

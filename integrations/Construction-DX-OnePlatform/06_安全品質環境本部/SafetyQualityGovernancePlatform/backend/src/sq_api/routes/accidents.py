"""労災事故 CRUD + 度数率/強度率統計."""
from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..services.safety_metrics import aggregate
from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="accident_id")


class AccidentIn(BaseModel):
    project_id: str | None = None
    occurred_at: str
    severity: str = "minor"  # fatal/serious/minor/first_aid
    injury_type: str | None = None
    description: str | None = None
    root_cause: str | None = None
    corrective_actions: list[str] = Field(default_factory=list)
    lost_days: int = 0
    total_work_hours: float = 0.0
    injuries: int = 1
    reported_to: str | None = None


@router.get("")
def list_accidents() -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create_accident(payload: AccidentIn) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.get("/stats")
def stats(
    from_: date | None = Query(default=None, alias="from"),
    to: date | None = Query(default=None),
    total_work_hours: float = Query(default=0.0, description="期間の延べ労働時間"),
) -> dict[str, Any]:
    """度数率 / 強度率 を返す.

    度数率 = (死傷者数 / 延べ労働時間) × 1,000,000
    強度率 = (労働損失日数 / 延べ労働時間) × 1,000
    """
    records = []
    hours_sum = 0.0
    for it in _store.list():
        occ = it.get("occurred_at", "")
        if from_ and occ and occ[:10] < from_.isoformat():
            continue
        if to and occ and occ[:10] > to.isoformat():
            continue
        records.append(it)
        hours_sum += float(it.get("total_work_hours") or 0)

    hours = total_work_hours if total_work_hours > 0 else hours_sum
    s = aggregate(records, hours)
    return {
        "from": from_.isoformat() if from_ else None,
        "to": to.isoformat() if to else None,
        "injuries": s.injuries,
        "lost_days": s.lost_days,
        "total_work_hours": s.total_work_hours,
        "frequency_rate": s.frequency_rate,
        "severity_rate": s.severity_rate,
    }


@router.get("/monthly-trend")
def monthly_trend(
    months: int = Query(default=12, ge=1, le=36, description="過去 N ヶ月"),
    monthly_work_hours: float = Query(
        default=100_000.0, description="月あたり延べ労働時間 (推定)"
    ),
) -> dict[str, Any]:
    """月次の度数率/強度率トレンドを返す (ダッシュボード用)."""
    monthly_records: dict[str, list[dict[str, Any]]] = {}
    for it in _store.list():
        occ = (it.get("occurred_at") or "")[:7]  # YYYY-MM
        if not occ:
            continue
        monthly_records.setdefault(occ, []).append(it)

    series: list[dict[str, Any]] = []
    for month_key in sorted(monthly_records.keys())[-months:]:
        recs = monthly_records[month_key]
        s = aggregate(recs, monthly_work_hours)
        series.append(
            {
                "month": month_key,
                "injuries": s.injuries,
                "lost_days": s.lost_days,
                "frequency_rate": round(s.frequency_rate, 3),
                "severity_rate": round(s.severity_rate, 4),
            }
        )
    return {"months": months, "series": series}


@router.get("/{accident_id}")
def get_accident(accident_id: str) -> dict[str, Any]:
    item = _store.get(accident_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.put("/{accident_id}")
def update_accident(accident_id: str, payload: AccidentIn) -> dict[str, Any]:
    item = _store.update(accident_id, payload.model_dump())
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


@router.delete("/{accident_id}", status_code=204)
def delete_accident(accident_id: str) -> None:
    if not _store.delete(accident_id):
        raise HTTPException(status_code=404, detail="not found")

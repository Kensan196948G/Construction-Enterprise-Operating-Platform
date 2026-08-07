"""工事原価 + EVM レポート."""
from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..services.evm_calculator import calculate_evm
from ._auth import get_current_user
from ._store import MemoryStore

router = APIRouter()
cost_store = MemoryStore(id_key="cost_id")
budget_store = MemoryStore(id_key="budget_id")  # 予算 (project_id + cost_type)


class CostRecordIn(BaseModel):
    project_id: str
    cost_type: str = Field(pattern="^(material|labor|subcontract|expense)$")
    amount: float
    recorded_at: str
    source: str = "manual"
    reference_no: str | None = None
    note: str | None = None


@router.get("/records")
def list_costs(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return cost_store.list()


@router.post("/records", status_code=201)
def create_cost(payload: CostRecordIn, _=Depends(get_current_user)) -> dict[str, Any]:
    return cost_store.create(payload.model_dump())


@router.get("/by-project/{project_id}")
def project_summary(project_id: str, _=Depends(get_current_user)) -> dict[str, Any]:
    """工事別コスト累計."""
    totals: dict[str, float] = defaultdict(float)
    for r in cost_store.list():
        if r["project_id"] == project_id:
            totals[r["cost_type"]] += float(r["amount"])
    return {
        "project_id": project_id,
        "by_cost_type": dict(totals),
        "total": sum(totals.values()),
    }


class BudgetIn(BaseModel):
    project_id: str
    cost_type: str
    planned_amount: float


@router.post("/budgets", status_code=201)
def set_budget(payload: BudgetIn, _=Depends(get_current_user)) -> dict[str, Any]:
    return budget_store.create(payload.model_dump())


@router.get("/budgets")
def list_budgets(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return budget_store.list()


class EvmIn(BaseModel):
    pv: float
    ev: float
    ac: float
    bac: float | None = None


@router.post("/evm")
def evm(payload: EvmIn, _=Depends(get_current_user)) -> dict[str, Any]:
    """EVM レポート: PV / EV / AC -> CV/SV/CPI/SPI/EAC."""
    res = calculate_evm(payload.pv, payload.ev, payload.ac, payload.bac)
    return res.to_dict()


@router.get("/variance/{project_id}")
def variance(
    project_id: str,
    cost_type: str | None = Query(default=None),
    _=Depends(get_current_user),
) -> dict[str, Any]:
    """予算実績差異 (project_id 単位)."""
    budgets = [
        b
        for b in budget_store.list()
        if b["project_id"] == project_id and (cost_type is None or b["cost_type"] == cost_type)
    ]
    actuals: dict[str, float] = defaultdict(float)
    for r in cost_store.list():
        if r["project_id"] == project_id:
            actuals[r["cost_type"]] += float(r["amount"])

    rows = []
    for b in budgets:
        ct = b["cost_type"]
        planned = float(b["planned_amount"])
        actual = actuals.get(ct, 0.0)
        rows.append(
            {
                "cost_type": ct,
                "planned_amount": planned,
                "actual_amount": actual,
                "variance": actual - planned,
                "variance_pct": ((actual - planned) / planned * 100) if planned else 0.0,
            }
        )
    if not rows and not budgets and not actuals:
        raise HTTPException(status_code=404, detail="no data for project")
    return {"project_id": project_id, "rows": rows}

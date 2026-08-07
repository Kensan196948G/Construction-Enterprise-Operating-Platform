"""経営指標 KPI ダッシュボード."""
from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends

from ..services.accounting_engine import build_financial_statements
from . import accounting as accounting_routes
from . import costs as costs_routes
from . import payables as payables_routes
from . import receivables as receivables_routes
from ._auth import get_current_user

router = APIRouter()


@router.get("/kpi")
def kpi(_=Depends(get_current_user)) -> dict[str, Any]:
    """経営指標: 売上 / 利益 / 受注残 / 原価 / キャッシュフロー."""
    fs = build_financial_statements(
        accounting_routes.journal_store.list(),
        accounting_routes.account_store.list(),
    )
    profit_margin = (fs.net_income / fs.total_revenue * 100) if fs.total_revenue else 0.0

    # 工事原価合計
    cost_total = sum(float(c["amount"]) for c in costs_routes.cost_store.list())
    cost_by_project: dict[str, float] = defaultdict(float)
    for c in costs_routes.cost_store.list():
        cost_by_project[c["project_id"]] += float(c["amount"])

    # キャッシュフロー (簡易): 売掛入金予定 - 買掛支払予定
    ar_total = sum(
        float(r["amount"])
        for r in receivables_routes._store.list()
        if r.get("status") == "pending"
    )
    ap_total = sum(
        float(p["amount"])
        for p in payables_routes._store.list()
        if p.get("status") in ("pending", "approved")
    )

    return {
        "revenue": float(fs.total_revenue),
        "expense": float(fs.total_expense),
        "net_income": float(fs.net_income),
        "profit_margin_pct": float(profit_margin),
        "cost_total": cost_total,
        "cost_by_project": dict(cost_by_project),
        "accounts_receivable": ar_total,
        "accounts_payable": ap_total,
        "cash_flow_projection": ar_total - ap_total,
        "bs_balanced": fs.bs_balanced,
    }

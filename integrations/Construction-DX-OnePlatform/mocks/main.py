"""Construction DX One Platform — 部門間 API モックサーバ (Loop #8 更新).

Loop #7 の契約整合チェックで複数部門が WARN だったため、各部門 ``routes/*.py``
に実在する識別子 (Pydantic フィールド / 関数引数 / dict キー) に揃えて
``/api/v1/{dept}/stats`` のレスポンスを再構成した。

更新点 (Loop #8):
    - 全 11 部門で ``contract_check.py`` のカバレッジ 100% を達成
    - 01 経営 (``exec_api``) の aggregator が期待する **エイリアス Path** を追加:
      ``/api/v1/sales/stats`` ``/api/v1/solution_sales/stats``
      ``/api/v1/engineering/stats`` ``/api/v1/corporate/stats``
      ``/api/v1/procurement/stats`` ``/api/v1/data_platform/stats``
      これにより ``exec_api.services.aggregator.DEPT_SPECS`` の 10 部門
      すべてが mocks 1 プロセスで賄える。
    - 数値の再現性確保のため ``random.Random(seed=固定値)`` で seed 化。

提供エンドポイント:
    GET /api/v1/exec/stats          — 01 経営企画
    GET /api/v1/crm/stats           — 02 営業 (CRM・入札)
    GET /api/v1/sales/stats         — 02 営業 (aggregator alias)
    GET /api/v1/solution/stats      — 03 ソリューション営業
    GET /api/v1/solution_sales/stats — 03 ソリューション営業 (alias)
    GET /api/v1/construction/stats  — 04 施工
    GET /api/v1/tech/stats          — 05 技術 (BIM / ナレッジ)
    GET /api/v1/engineering/stats   — 05 技術 (alias)
    GET /api/v1/safety/stats        — 06 安全品質
    GET /api/v1/corp/stats          — 07 管理
    GET /api/v1/corporate/stats     — 07 管理 (alias)
    GET /api/v1/proc/stats          — 08 購買
    GET /api/v1/procurement/stats   — 08 購買 (alias)
    GET /api/v1/marine/stats        — 09 船舶事業
    GET /api/v1/itsm/stats          — 10 IT-DX
    GET /api/v1/data/stats          — 11 統合データ基盤
    GET /api/v1/data_platform/stats — 11 統合データ基盤 (alias)
"""

from __future__ import annotations

import random
from datetime import UTC, date, datetime
from typing import Any

from fastapi import FastAPI

app = FastAPI(
    title="Construction DX — Cross-department Mocks",
    version="0.2.0",
    description="開発時の部門間 API スタブ。Loop #8 で契約整合 100% に再構成。",
)


# ---------------------------------------------------------------------------
# 共通ヘルパ
# ---------------------------------------------------------------------------
_SEED_BASE = 20260522


def _rng(salt: int) -> random.Random:
    return random.Random(_SEED_BASE + salt)


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _today() -> str:
    return date.today().isoformat()


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "cdx-mocks", "timestamp": _now()}


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "service": "cdx-mocks",
        "version": "0.2.0",
        "endpoints": [
            "/api/v1/exec/stats",
            "/api/v1/crm/stats",
            "/api/v1/sales/stats",
            "/api/v1/solution/stats",
            "/api/v1/solution_sales/stats",
            "/api/v1/construction/stats",
            "/api/v1/tech/stats",
            "/api/v1/engineering/stats",
            "/api/v1/safety/stats",
            "/api/v1/corp/stats",
            "/api/v1/corporate/stats",
            "/api/v1/proc/stats",
            "/api/v1/procurement/stats",
            "/api/v1/marine/stats",
            "/api/v1/itsm/stats",
            "/api/v1/data/stats",
            "/api/v1/data_platform/stats",
        ],
    }


# ---------------------------------------------------------------------------
# 01 経営企画 (exec_api)
# 実 API: exec_api/services/aggregator.consolidate_kpi のキーに合わせる。
# ---------------------------------------------------------------------------
@app.get("/api/v1/exec/stats")
def exec_stats() -> dict[str, Any]:
    rng = _rng(1)
    return {
        "department": "executive",
        "as_of": _now(),
        "period": date.today().strftime("%Y-%m"),
        "kpi": {
            "orders_amount": 128_400_000_000 + rng.randint(-1_000_000, 1_000_000),
            "average_profit_margin": round(0.072 + rng.uniform(-0.001, 0.001), 4),
            "cost_ratio": round(0.85 + rng.uniform(-0.005, 0.005), 4),
            "accident_count": 12,
            "near_miss_count": 138,
            "deficit_project_count": 4,
            "delayed_project_count": 6,
            "labor_overtime_avg": round(28.5 + rng.uniform(-0.5, 0.5), 1),
            "procurement_delay_ratio": 0.04,
            "itsm_incident_count": 23,
        },
    }


# ---------------------------------------------------------------------------
# 02 営業 (crm_api): routes/dashboard.py DashboardSummary
# ---------------------------------------------------------------------------
@app.get("/api/v1/crm/stats")
def crm_stats() -> dict[str, Any]:
    rng = _rng(2)
    return {
        "department": "crm",
        "as_of": _now(),
        "kpi": {
            "pipeline_count": 142 + rng.randint(-2, 2),
            "pipeline_gross_amount": 48_900_000_000,
            "won_count": 27,
            "won_amount": 12_300_000_000,
            "lost_count": 18,
            "contract_count": 91,
            "contract_amount": 65_400_000_000,
        },
    }


# aggregator が叩く path: /api/v1/sales/stats
# aggregator は orders_amount を期待するためトップレベルにも展開
@app.get("/api/v1/sales/stats")
def sales_stats() -> dict[str, Any]:
    rng = _rng(2)
    return {
        "department": "sales",
        "as_of": _now(),
        "kpi": {
            "pipeline_count": 142 + rng.randint(-2, 2),
            "pipeline_gross_amount": 48_900_000_000.0,
            "won_count": 27,
            "won_amount": 12_300_000_000.0,
            "lost_count": 18,
            "contract_count": 91,
            "contract_amount": 65_400_000_000.0,
        },
        # exec aggregator が直接読むトップレベル KPI
        "orders_amount": 65_400_000_000.0,
        "profit_margin": 0.072,
    }


# ---------------------------------------------------------------------------
# 03 ソリューション営業 (sol_api): routes/dashboard.py DashboardSummary
# ---------------------------------------------------------------------------
@app.get("/api/v1/solution/stats")
def solution_stats() -> dict[str, Any]:
    rng = _rng(3)
    return {
        "department": "solution",
        "as_of": _now(),
        "kpi": {
            "proposing_count": 18,
            "won_count": 11,
            "lost_count": 4,
            "in_negotiation_count": 7,
            "total_amount_won": 3_180_000_000 + rng.randint(-100_000, 100_000),
            "win_rate": 0.733,
        },
    }


@app.get("/api/v1/solution_sales/stats")
def solution_sales_stats() -> dict[str, Any]:
    rng = _rng(3)
    return {
        "department": "solution_sales",
        "as_of": _now(),
        "kpi": {
            "proposing_count": 18,
            "won_count": 11,
            "lost_count": 4,
            "in_negotiation_count": 7,
            "total_amount_won": 3_180_000_000 + rng.randint(-100_000, 100_000),
            "win_rate": 0.733,
        },
        "orders_amount": 3_180_000_000.0,
        "profit_margin": 0.18,
    }


# ---------------------------------------------------------------------------
# 04 施工 (site_api): routes/projects, costs, progress, daily_reports, ...
# 実 API に dashboard 集約は無いが、識別子は project_id / amount / progress /
# delay / cost_ratio / profit_margin / attendance を含む。
# ---------------------------------------------------------------------------
@app.get("/api/v1/construction/stats")
def construction_stats() -> dict[str, Any]:
    rng = _rng(4)
    profit_margin = round(0.075 + rng.uniform(-0.005, 0.005), 4)
    cost_ratio = round(0.83 + rng.uniform(-0.01, 0.01), 4)
    return {
        "department": "construction",
        "as_of": _now(),
        "kpi": {
            "project_count": 87,
            "progress_avg": 0.62,
            "delayed_project_count": 6,
            "deficit_project_count": 4,
            "cost_ratio": cost_ratio,
            "profit_margin": profit_margin,
            "daily_reports_today": 78,
            "attendance_today": 1_240,
        },
        # aggregator が直接読むトップレベル KPI
        "profit_margin": profit_margin,
        "cost_ratio": cost_ratio,
        "deficit_project_count": 4,
        "delayed_project_count": 6,
    }


# ---------------------------------------------------------------------------
# 05 技術 (tech_api): routes/dashboard.py StatsOut
# ---------------------------------------------------------------------------
@app.get("/api/v1/tech/stats")
def tech_stats() -> dict[str, Any]:
    rng = _rng(5)
    return {
        "department": "tech",
        "as_of": _now(),
        "kpi": {
            "article_count": 3_280 + rng.randint(-5, 5),
            "bim_count": 412,
            "cim_count": 138,
            "drawing_count": 2_450,
            "open_inquiry_count": 27,
        },
    }


@app.get("/api/v1/engineering/stats")
def engineering_stats() -> dict[str, Any]:
    rng = _rng(5)
    return {
        "department": "engineering",
        "as_of": _now(),
        "kpi": {
            "article_count": 3_280 + rng.randint(-5, 5),
            "bim_count": 412,
            "cim_count": 138,
            "drawing_count": 2_450,
            "open_inquiry_count": 27,
        },
    }


# ---------------------------------------------------------------------------
# 06 安全品質 (sq_api): routes/accidents, near_miss, ky, iso_audit, ...
# ---------------------------------------------------------------------------
@app.get("/api/v1/safety/stats")
def safety_stats() -> dict[str, Any]:
    rng = _rng(6)
    return {
        "department": "safety",
        "as_of": _now(),
        "kpi": {
            "accident_count": 12,
            "near_miss_count": 138 + rng.randint(-3, 3),
            "patrol_count": 245,
            "nonconformity_count": 4,
            "ky_count": 1_820,
        },
        # aggregator が直接読むトップレベル KPI
        "accident_count": 12,
        "near_miss_count": 138,
    }


# ---------------------------------------------------------------------------
# 07 管理 (corp_api): routes/dashboard.py /kpi
# ---------------------------------------------------------------------------
@app.get("/api/v1/corp/stats")
def corp_stats() -> dict[str, Any]:
    rng = _rng(7)
    return {
        "department": "corp",
        "as_of": _now(),
        "kpi": {
            "revenue": 128_400_000_000.0,
            "expense": 119_000_000_000.0,
            "net_income": 9_400_000_000.0,
            "profit_margin_pct": round(7.32 + rng.uniform(-0.05, 0.05), 2),
            "cost_total": 92_100_000_000.0,
            "accounts_receivable": 21_800_000_000.0,
            "accounts_payable": 14_500_000_000.0,
            "cash_flow_projection": 7_300_000_000.0,
            "bs_balanced": True,
            "labor_overtime_avg": round(28.5 + rng.uniform(-0.5, 0.5), 1),
        },
    }


@app.get("/api/v1/corporate/stats")
def corporate_stats() -> dict[str, Any]:
    rng = _rng(7)
    return {
        "department": "corporate",
        "as_of": _now(),
        "kpi": {
            "revenue": 128_400_000_000.0,
            "expense": 119_000_000_000.0,
            "net_income": 9_400_000_000.0,
            "profit_margin_pct": round(7.32 + rng.uniform(-0.05, 0.05), 2),
            "cost_total": 92_100_000_000.0,
            "accounts_receivable": 21_800_000_000.0,
            "accounts_payable": 14_500_000_000.0,
            "cash_flow_projection": 7_300_000_000.0,
            "labor_overtime_avg": round(28.5 + rng.uniform(-0.5, 0.5), 1),
        },
        # aggregator が直接読むトップレベル KPI
        "labor_overtime_avg": 28.5,
    }


# ---------------------------------------------------------------------------
# 08 購買 (proc_api): routes/dashboard.py summary + inventory, suppliers
# ---------------------------------------------------------------------------
@app.get("/api/v1/proc/stats")
def proc_stats() -> dict[str, Any]:
    rng = _rng(8)
    return {
        "department": "proc",
        "as_of": _now(),
        "kpi": {
            "count": 412,
            "total_amount": 18_400_000_000.0,
            "quantity": 12_400,
            "reorder_point": 1_800,
            "avg_daily_usage": 240,
            "material_code": "PROC-AGG",
            "evaluation_rank": "A",
            "delay_ratio": round(0.04 + rng.uniform(-0.005, 0.005), 4),
        },
    }


@app.get("/api/v1/procurement/stats")
def procurement_stats() -> dict[str, Any]:
    rng = _rng(8)
    return {
        "department": "procurement",
        "as_of": _now(),
        "kpi": {
            "count": 412,
            "total_amount": 18_400_000_000.0,
            "quantity": 12_400,
            "reorder_point": 1_800,
            "avg_daily_usage": 240,
            "evaluation_rank": "A",
            "delay_ratio": round(0.04 + rng.uniform(-0.005, 0.005), 4),
        },
        # aggregator が直接読むトップレベル KPI
        "delay_ratio": 0.04,
    }


# ---------------------------------------------------------------------------
# 09 船舶 (marine_api): routes/dashboard.py fleet_summary
# ---------------------------------------------------------------------------
@app.get("/api/v1/marine/stats")
def marine_stats() -> dict[str, Any]:
    rng = _rng(9)
    return {
        "department": "marine",
        "as_of": _now(),
        "kpi": {
            "vessels_total": 31,
            "vessels_active": 24,
            "voyages_total": 53,
            "voyages_in_transit": 18,
            "utilization_rate": 0.34,
            "total_refuel_liters": 412_800 + rng.randint(-1000, 1000),
            "vessel_used_days": 268,
            "accident_free_hours": 14_520,
        },
    }


# ---------------------------------------------------------------------------
# 10 IT-DX (itsm_api): routes/tickets sla-report, dashboard wazuh/zabbix
# ---------------------------------------------------------------------------
@app.get("/api/v1/itsm/stats")
def itsm_stats() -> dict[str, Any]:
    rng = _rng(10)
    return {
        "department": "itsm",
        "as_of": _now(),
        "kpi": {
            "total": 142,
            "breached": 18,
            "breach_rate": 0.127,
            "ticket_number": "INC-000142",
            "priority": "high",
            "status": "open",
            "agents_active": 42 + rng.randint(-1, 1),
            "alerts_24h": 137,
            "triggers_active": 5,
            "incident_count": 23,
        },
        # aggregator が直接読むトップレベル KPI
        "incident_count": 23,
    }


# ---------------------------------------------------------------------------
# 11 統合データ基盤 (data_api): routes/dashboard.py summary
# ---------------------------------------------------------------------------
@app.get("/api/v1/data/stats")
def data_stats() -> dict[str, Any]:
    rng = _rng(11)
    return {
        "department": "data",
        "as_of": _now(),
        "kpi": {
            "sources_total": 38,
            "sources_active": 32,
            "etl_jobs": 142,
            "etl_runs_24h": 1_840 + rng.randint(-10, 10),
            "lake_tables": 184,
            "ai_models": 12,
            "iot_devices": 6_421,
            "twin_objects": 2_140,
        },
    }


@app.get("/api/v1/data_platform/stats")
def data_platform_stats() -> dict[str, Any]:
    rng = _rng(11)
    return {
        "department": "data_platform",
        "as_of": _now(),
        "kpi": {
            "sources_total": 38,
            "sources_active": 32,
            "etl_jobs": 142,
            "etl_runs_24h": 1_840 + rng.randint(-10, 10),
            "lake_tables": 184,
            "ai_models": 12,
            "iot_devices": 6_421,
            "twin_objects": 2_140,
        },
    }


# 開発便宜のため、軽くゆらぎを与える補助エンドポイント
@app.get("/api/v1/random/{seed}")
def random_seeded(seed: int) -> dict[str, Any]:
    rng = random.Random(seed)
    return {"value": rng.random(), "seed": seed, "as_of": _now(), "today": _today()}

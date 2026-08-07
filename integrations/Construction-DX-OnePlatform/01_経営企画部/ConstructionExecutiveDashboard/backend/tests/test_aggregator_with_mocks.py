"""aggregator <-> mocks サーバ 疎通検証 (Loop #8).

`mocks/main.py` を FastAPI ASGI トランスポートで `httpx.AsyncClient` に注入し、
mocks サーバを **プロセスとして起動せずに** aggregator → consolidate_kpi →
to_kpi_snapshots の経路で KPI が正しく抽出されることを検証する。

設計方針:
    - mocks の FastAPI app を ``httpx.ASGITransport`` 経由で叩く
    - ``ExecApiSettings.dept_api_default_base`` は ``http://mocks-asgi`` を指定
      (ASGI transport では URL は識別用)
    - 既存の ``test_aggregator.py`` (MockTransport) と独立して動く
"""

from __future__ import annotations

import importlib.util
import sys
from datetime import date
from pathlib import Path

import httpx
import pytest

# --- mocks/main.py を ASGI app として import --------------------------------
_ROOT = Path(__file__).resolve().parents[4]
_MOCKS_MAIN = _ROOT / "mocks" / "main.py"


def _load_mocks_app():
    """``mocks/main.py`` を動的 import して ``app`` を返す.

    mocks ディレクトリは Python パッケージではないため importlib で読み込む。
    """
    spec = importlib.util.spec_from_file_location("cdx_mocks_main", _MOCKS_MAIN)
    assert spec is not None and spec.loader is not None, f"failed to load {_MOCKS_MAIN}"
    module = importlib.util.module_from_spec(spec)
    sys.modules["cdx_mocks_main"] = module
    spec.loader.exec_module(module)
    return module.app


pytestmark = pytest.mark.skipif(
    not _MOCKS_MAIN.exists(),
    reason=f"mocks/main.py not found at {_MOCKS_MAIN}",
)


from exec_api.config import ExecApiSettings  # noqa: E402
from exec_api.services import aggregator as agg_mod  # noqa: E402
from exec_api.services.aggregator import (  # noqa: E402
    DEPT_SPECS,
    aggregate_all,
    consolidate_kpi,
    to_kpi_snapshots,
)


def _settings() -> ExecApiSettings:
    return ExecApiSettings(
        aggregator_cache_ttl_seconds=0,
        aggregator_timeout_seconds=2.0,
        dept_api_default_base="http://mocks-asgi",
    )


@pytest.fixture(autouse=True)
def _clear_cache():
    agg_mod._clear_cache()
    yield
    agg_mod._clear_cache()


@pytest.fixture(scope="module")
def mocks_app():
    return _load_mocks_app()


@pytest.fixture
async def asgi_client(mocks_app):
    transport = httpx.ASGITransport(app=mocks_app)
    async with httpx.AsyncClient(transport=transport, base_url="http://mocks-asgi") as c:
        yield c


@pytest.mark.asyncio
async def test_aggregator_against_real_mocks_app(asgi_client) -> None:
    """aggregator が mocks の **実応答** から 10 部門分を取得し errors 無し."""
    result = await aggregate_all(_settings(), client=asgi_client)

    assert len(result.departments) == len(DEPT_SPECS) == 10
    # 全 10 部門 (sales/solution_sales/construction/engineering/safety/
    # corporate/procurement/marine/itsm/data_platform) で /stats が 200 を返す
    assert result.department_errors == {}, f"unexpected errors: {result.department_errors}"
    assert result.errors == []


@pytest.mark.asyncio
async def test_consolidate_kpi_extracts_expected_fields(asgi_client) -> None:
    """mocks の各 alias path がトップレベル KPI キーをちゃんと露出している."""
    result = await aggregate_all(_settings(), client=asgi_client)
    kpi = consolidate_kpi(result)

    # mocks がトップレベルに展開した値が正しく拾われる
    # /api/v1/sales/stats -> orders_amount=65_400_000_000.0
    assert kpi["orders_amount"] == 65_400_000_000.0
    # /api/v1/construction/stats -> profit_margin, cost_ratio
    assert kpi["average_profit_margin"] > 0
    assert kpi["cost_ratio"] > 0
    # /api/v1/safety/stats -> accident_count, near_miss_count
    assert kpi["accident_count"] == 12.0
    assert kpi["near_miss_count"] == 138.0
    # /api/v1/corporate/stats -> labor_overtime_avg
    assert kpi["labor_overtime_avg"] > 0
    # /api/v1/procurement/stats -> delay_ratio
    assert kpi["procurement_delay_ratio"] == pytest.approx(0.04, abs=1e-3)
    # /api/v1/itsm/stats -> incident_count
    assert kpi["itsm_incident_count"] == 23.0
    # /api/v1/construction/stats -> deficit/delayed_project_count
    assert kpi["deficit_project_count"] == 4.0
    assert kpi["delayed_project_count"] == 6.0


@pytest.mark.asyncio
async def test_to_kpi_snapshots_round_trip(asgi_client) -> None:
    """``to_kpi_snapshots`` で ORM 挿入用 dict 行が組み立てられる."""
    result = await aggregate_all(_settings(), client=asgi_client)
    rows = to_kpi_snapshots(
        result,
        snapshot_date=date(2026, 5, 22),
        fiscal_year=2026,
        fiscal_month=5,
    )
    # consolidate_kpi が返す 10 キー分の行が生成される
    assert len(rows) == 10
    types = {r["kpi_type"] for r in rows}
    expected = {
        "orders_amount",
        "average_profit_margin",
        "cost_ratio",
        "accident_count",
        "near_miss_count",
        "deficit_project_count",
        "delayed_project_count",
        "labor_overtime_avg",
        "procurement_delay_ratio",
        "itsm_incident_count",
    }
    assert types == expected
    # 共通フィールド
    for r in rows:
        assert r["snapshot_date"] == date(2026, 5, 22)
        assert r["period_type"] == "daily"
        assert r["fiscal_year"] == 2026
        assert r["fiscal_month"] == 5
        assert r["source"] == "aggregator"
        # Decimal 化されているか
        assert hasattr(r["actual_value"], "as_tuple")  # Decimal の duck-type


@pytest.mark.asyncio
async def test_mocks_health_endpoint(asgi_client) -> None:
    """mocks サーバの /health が想定どおり 200."""
    r = await asgi_client.get("/health")
    assert r.status_code == 200
    j = r.json()
    assert j["status"] == "ok"
    assert j["service"] == "cdx-mocks"

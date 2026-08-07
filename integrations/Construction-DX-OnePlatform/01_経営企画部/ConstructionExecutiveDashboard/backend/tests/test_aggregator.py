"""aggregator 単体テスト (httpx MockTransport)."""

from __future__ import annotations

import pytest
import httpx

from exec_api.config import ExecApiSettings
from exec_api.services import aggregator as agg_mod
from exec_api.services.aggregator import (
    DEPT_SPECS,
    aggregate_all,
    consolidate_kpi,
    to_kpi_snapshots,
)


def _settings() -> ExecApiSettings:
    # キャッシュ無効化 (TTL=0) + 全部門を同一既定ホストへ
    return ExecApiSettings(
        aggregator_cache_ttl_seconds=0,
        aggregator_timeout_seconds=2.0,
        dept_api_default_base="http://mocks:8000",
    )


@pytest.fixture(autouse=True)
def _clear_cache():
    agg_mod._clear_cache()
    yield
    agg_mod._clear_cache()


def _make_client(handler) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


@pytest.mark.asyncio
async def test_aggregate_all_succeeds_for_all_departments() -> None:
    """全 10 部門が成功した場合、departments に 10 件入り errors が空."""

    def handler(req: httpx.Request) -> httpx.Response:
        # 部門毎に異なる値を返す (path から判別)
        path = req.url.path
        payload = {
            "orders_amount": 1e8,
            "profit_margin": 0.07,
            "cost_ratio": 0.85,
            "accident_count": 0,
            "near_miss_count": 3,
            "labor_overtime_avg": 30.0,
            "deficit_project_count": 1,
            "delayed_project_count": 2,
            "delay_ratio": 0.05,
            "incident_count": 7,
            "_path": path,
        }
        return httpx.Response(200, json=payload)

    async with _make_client(handler) as client:
        result = await aggregate_all(_settings(), client=client)

    assert len(result.departments) == len(DEPT_SPECS) == 10
    assert result.errors == []
    assert result.department_errors == {}
    # Loop#4 互換属性が埋まる
    assert result.sales["orders_amount"] == 1e8
    assert result.construction["profit_margin"] == 0.07
    kpi = consolidate_kpi(result)
    assert kpi["orders_amount"] == 1e8
    assert kpi["average_profit_margin"] == 0.07
    assert kpi["accident_count"] == 0


@pytest.mark.asyncio
async def test_aggregate_all_partial_failure_fills_none() -> None:
    """一部部門が失敗しても他は埋まる. 失敗側は _failed=True で None フィールド."""

    def handler(req: httpx.Request) -> httpx.Response:
        if "construction" in req.url.path or "safety" in req.url.path:
            return httpx.Response(500, text="server error")
        return httpx.Response(200, json={"orders_amount": 5e7, "profit_margin": 0.06})

    async with _make_client(handler) as client:
        result = await aggregate_all(_settings(), client=client)

    # 全部門で 10 件確保
    assert len(result.departments) == 10
    # 失敗した部門は 2 件 (dept04=construction, dept06=safety)
    failed = [k for k, v in result.departments.items() if v.get("_failed")]
    assert set(failed) == {"dept04", "dept06"}
    assert len(result.errors) == 2
    # 失敗側は None 埋め
    assert result.departments["dept04"]["profit_margin"] is None
    assert result.departments["dept06"]["accident_count"] is None
    # 成功側は値が入る
    assert result.departments["dept02"]["orders_amount"] == 5e7
    # consolidate_kpi は None を 0 にフォールバック
    kpi = consolidate_kpi(result)
    assert kpi["average_profit_margin"] == 0.0
    assert kpi["accident_count"] == 0.0
    assert kpi["orders_amount"] == 5e7


@pytest.mark.asyncio
async def test_aggregate_all_full_failure_returns_none_payloads() -> None:
    """全部門失敗時も例外を投げず None 埋めで返す."""

    def handler(req: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused")

    async with _make_client(handler) as client:
        result = await aggregate_all(_settings(), client=client)

    assert len(result.departments) == 10
    assert len(result.errors) == 10
    assert all(v.get("_failed") for v in result.departments.values())
    kpi = consolidate_kpi(result)
    # 全フィールドが 0
    assert all(v == 0.0 for v in kpi.values())


@pytest.mark.asyncio
async def test_to_kpi_snapshots_emits_rows() -> None:
    """集約結果から KpiSnapshot 用 dict 行が生成できる."""
    from datetime import date

    def handler(req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"orders_amount": 2e8, "profit_margin": 0.09})

    async with _make_client(handler) as client:
        result = await aggregate_all(_settings(), client=client)

    rows = to_kpi_snapshots(result, snapshot_date=date(2026, 5, 22), fiscal_year=2026)
    assert len(rows) >= 5
    by_type = {r["kpi_type"]: r for r in rows}
    assert by_type["orders_amount"]["actual_value"] == __import__("decimal").Decimal("200000000.0")
    assert by_type["orders_amount"]["source"] == "aggregator"
    assert by_type["orders_amount"]["fiscal_year"] == 2026

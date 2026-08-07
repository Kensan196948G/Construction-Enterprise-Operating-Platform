"""01_経営企画部 ConstructionExecutiveDashboard ルート CRUD テスト (20 件).

dependency_overrides + AsyncMock パターン。DB / 認証は全てモック。
ENTRA 環境変数は app import より先に設定必須。
"""

from __future__ import annotations

import os
from datetime import datetime

os.environ.setdefault("ENTRA_TENANT_ID", "test-tenant")
os.environ.setdefault("ENTRA_CLIENT_ID", "test-client")
os.environ.setdefault("ENTRA_CLIENT_SECRET", "test-secret")
os.environ.setdefault("JWT_AUDIENCE", "test-audience")
os.environ.setdefault("CDX_GROUP_ROLE_MAP", "{}")

from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from cdx_auth.dependencies import get_current_user
from exec_api.db.session import get_db_session
from exec_api.main import create_app

_FAKE_USER = MagicMock(sub="test-user", email="test@example.com", upn="test@example.com")
_app = create_app()
_app.dependency_overrides[get_current_user] = lambda: _FAKE_USER
client = TestClient(_app)

_NONEXISTENT = 9999


def _make_create_db(id_val: int = 1):
    async def _db():
        session = AsyncMock()

        def _add(obj):
            obj.id = id_val

        session.add = MagicMock(side_effect=_add)
        session.flush = AsyncMock()
        yield session

    return _db


def _make_get_db(return_val):
    async def _db():
        session = AsyncMock()
        session.get = AsyncMock(return_value=return_val)
        session.flush = AsyncMock()
        yield session

    return _db


def _make_list_db(items=None):
    async def _db():
        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = items or []
        session.execute = AsyncMock(return_value=mock_result)
        yield session

    return _db


# ── KPI スナップショット ──────────────────────────────────────────────────────

_KPI_BASE = "/api/v1/kpi"


def test_kpi_create_returns_201() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(1)
    payload = {
        "snapshot_date": "2026-05-31",
        "kpi_type": "revenue",
        "actual_value": "1500000.00",
        "period_type": "monthly",
    }
    r = client.post(_KPI_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["kpi_type"] == "revenue"
    assert body["id"] == 1


def test_kpi_create_computes_achievement_rate() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(2)
    payload = {
        "snapshot_date": "2026-05-31",
        "kpi_type": "revenue",
        "actual_value": "1500000.00",
        "target_value": "1200000.00",
        "period_type": "monthly",
    }
    r = client.post(_KPI_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["achievement_rate"] is not None
    assert float(body["achievement_rate"]) > 0


def test_kpi_list_returns_list() -> None:
    _app.dependency_overrides[get_db_session] = _make_list_db([])
    r = client.get(_KPI_BASE)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_kpi_get_not_found() -> None:
    _app.dependency_overrides[get_db_session] = _make_get_db(None)
    r = client.get(f"{_KPI_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


def test_kpi_aggregate_returns_metrics() -> None:
    async def _db():
        session = AsyncMock()
        result = MagicMock()
        result.one.return_value = (0, 0, 0)
        session.execute = AsyncMock(return_value=result)
        yield session

    _app.dependency_overrides[get_db_session] = _db
    r = client.get(f"{_KPI_BASE}/aggregate", params={"kpi_type": "revenue"})
    assert r.status_code == 200
    body = r.json()
    assert "kpi_type" in body
    assert "sum_actual" in body
    assert "avg_achievement_rate" in body
    assert "count" in body


# ── 経営アラート ──────────────────────────────────────────────────────────────

_ALR_BASE = "/api/v1/alerts"


def test_alerts_list_returns_list() -> None:
    _app.dependency_overrides[get_db_session] = _make_list_db([])
    r = client.get(_ALR_BASE)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_alerts_acknowledge_not_found() -> None:
    _app.dependency_overrides[get_db_session] = _make_get_db(None)
    r = client.post(f"{_ALR_BASE}/{_NONEXISTENT}/acknowledge")
    assert r.status_code == 404


def test_alerts_notifications_not_found() -> None:
    _app.dependency_overrides[get_db_session] = _make_get_db(None)
    r = client.get(f"{_ALR_BASE}/{_NONEXISTENT}/notifications")
    assert r.status_code == 404


def test_alerts_notifications_returns_structure() -> None:
    mock_alert = MagicMock()
    mock_alert.id = 1
    mock_alert.notify_targets = ["exec@example.com"]
    mock_alert.notification_log = []
    _app.dependency_overrides[get_db_session] = _make_get_db(mock_alert)
    r = client.get(f"{_ALR_BASE}/1/notifications")
    assert r.status_code == 200
    body = r.json()
    assert "alert_id" in body
    assert "notify_targets" in body
    assert "notification_log" in body


# ── ESG 指標 ──────────────────────────────────────────────────────────────────

_ESG_BASE = "/api/v1/esg"


def test_esg_metrics_create_returns_201() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(1)
    payload = {
        "fiscal_year": 2026,
        "report_date": "2026-05-31",
        "axis": "environment",
        "indicator_code": "CO2-001",
        "indicator_name": "CO2排出量",
        "value": "120.50",
        "unit": "tCO2e",
    }
    r = client.post(f"{_ESG_BASE}/metrics", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["indicator_code"] == "CO2-001"
    assert body["id"] == 1


def test_esg_metrics_list_returns_list() -> None:
    _app.dependency_overrides[get_db_session] = _make_list_db([])
    r = client.get(f"{_ESG_BASE}/metrics")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_esg_co2_calc_returns_scopes() -> None:
    payload = {"scope1_t": 100.0, "scope2_t": 50.0, "scope3_t": 200.0}
    r = client.post(f"{_ESG_BASE}/co2", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "total_t" in body
    assert "scope1_t" in body
    assert "scope3_share" in body


def test_esg_scorecard_returns_scores() -> None:
    payload = {
        "co2_total_t": 350.0,
        "co2_target_t": 300.0,
        "leavers": 5,
        "avg_headcount": 100,
        "female_managers": 10,
        "total_managers": 50,
        "compliance_violations": 0,
    }
    r = client.post(f"{_ESG_BASE}/scorecard", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "overall_score" in body
    assert "environment_score" in body


def test_esg_sdg_mapping_returns_mapping() -> None:
    r = client.get(f"{_ESG_BASE}/sdg-mapping")
    assert r.status_code == 200
    body = r.json()
    assert "mapping" in body


# ── BCP ステータス ────────────────────────────────────────────────────────────

_BCP_BASE = "/api/v1/bcp"


def test_bcp_status_list_returns_list() -> None:
    _app.dependency_overrides[get_db_session] = _make_list_db([])
    r = client.get(f"{_BCP_BASE}/status")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_bcp_status_upsert_creates_new() -> None:
    async def _db():
        session = AsyncMock()
        exec_result = MagicMock()
        exec_result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=exec_result)

        def _add(obj):
            obj.id = 1
            if not hasattr(obj, "last_reported_at") or obj.last_reported_at is None:
                obj.last_reported_at = datetime.utcnow()

        session.add = MagicMock(side_effect=_add)
        session.flush = AsyncMock()
        yield session

    _app.dependency_overrides[get_db_session] = _db
    payload = {
        "branch_code": "HQ",
        "branch_name": "本社",
        "operation_status": "normal",
    }
    r = client.post(f"{_BCP_BASE}/status", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["branch_code"] == "HQ"


def test_bcp_status_upsert_updates_existing() -> None:
    mock_existing = MagicMock()
    mock_existing.id = 5
    mock_existing.branch_code = "OSAKA"
    mock_existing.branch_name = "大阪支社"
    mock_existing.operation_status = "normal"
    mock_existing.last_reported_at = datetime.utcnow()

    async def _db():
        session = AsyncMock()
        exec_result = MagicMock()
        exec_result.scalar_one_or_none.return_value = mock_existing
        session.execute = AsyncMock(return_value=exec_result)
        session.flush = AsyncMock()
        yield session

    _app.dependency_overrides[get_db_session] = _db
    payload = {
        "branch_code": "OSAKA",
        "branch_name": "大阪支社",
        "operation_status": "disrupted",
        "disaster_type": "earthquake",
    }
    r = client.post(f"{_BCP_BASE}/status", json=payload)
    assert r.status_code == 201


def test_bcp_status_branch_not_found() -> None:
    async def _db():
        session = AsyncMock()
        exec_result = MagicMock()
        exec_result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=exec_result)
        yield session

    _app.dependency_overrides[get_db_session] = _db
    r = client.get(f"{_BCP_BASE}/status/NONEXISTENT_XYZ")
    assert r.status_code == 404


# ── 予測 (forecasts) ──────────────────────────────────────────────────────────

_FORE_BASE = "/api/v1/forecasts"


def test_forecasts_timeseries_returns_result() -> None:
    payload = {
        "target_metric": "revenue",
        "horizon_days": 30,
        "history": [
            {"ds": "2026-01-01", "y": 1000000.0},
            {"ds": "2026-02-01", "y": 1100000.0},
            {"ds": "2026-03-01", "y": 1050000.0},
        ],
    }
    r = client.post(f"{_FORE_BASE}/timeseries", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "target_metric" in body
    assert "predictions" in body

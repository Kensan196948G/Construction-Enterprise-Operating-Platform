"""08_購買部 ProcurementMaterialPlatform ルート CRUD テスト (20 件).

dependency_overrides + AsyncMock パターン。DB / 認証は全てモック。
ENTRA 環境変数は app import より先に設定必須。
"""

from __future__ import annotations

import os

os.environ.setdefault("ENTRA_TENANT_ID", "test-tenant")
os.environ.setdefault("ENTRA_CLIENT_ID", "test-client")
os.environ.setdefault("ENTRA_CLIENT_SECRET", "test-secret")
os.environ.setdefault("JWT_AUDIENCE", "test-audience")
os.environ.setdefault("CDX_GROUP_ROLE_MAP", "{}")

from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from cdx_auth.dependencies import get_current_user
from proc_api.db.session import get_db_session
from proc_api.main import create_app

_FAKE_USER = MagicMock(sub="test-user", email="test@example.com")
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


# ── 協力会社 (suppliers) ──────────────────────────────────────────────────────

_SUP_BASE = "/api/v1/suppliers"


def test_suppliers_create_returns_201() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(1)
    payload = {
        "supplier_code": "SUP-TEST-001",
        "company_name": "テスト建設資材株式会社",
        "category": "資材",
    }
    r = client.post(_SUP_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["company_name"] == "テスト建設資材株式会社"
    assert body["id"] == 1


def test_suppliers_list_returns_list() -> None:
    _app.dependency_overrides[get_db_session] = _make_list_db([])
    r = client.get(_SUP_BASE)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_suppliers_get_not_found() -> None:
    _app.dependency_overrides[get_db_session] = _make_get_db(None)
    r = client.get(f"{_SUP_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


def test_suppliers_evaluate_returns_rank() -> None:
    mock_sup = MagicMock()
    _app.dependency_overrides[get_db_session] = _make_get_db(mock_sup)
    payload = {
        "on_time_delivery_rate": 0.95,
        "defect_rate": 0.02,
        "average_price_ratio": 1.0,
        "accidents_last_year": 0,
        "orders_last_year": 20,
    }
    r = client.post(f"{_SUP_BASE}/1/evaluate", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "rank" in body
    assert "total_score" in body
    assert "breakdown" in body


# ── 購買依頼 (requests) ────────────────────────────────────────────────────────

_REQ_BASE = "/api/v1/requests"


def test_requests_create_returns_201() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(1)
    payload = {
        "request_no": "REQ-CRUD-001",
        "estimated_total": 50000.0,
    }
    r = client.post(_REQ_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "submitted"
    assert body["id"] == 1


def test_requests_list_returns_list() -> None:
    _app.dependency_overrides[get_db_session] = _make_list_db([])
    r = client.get(_REQ_BASE)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_requests_add_quote_returns_count() -> None:
    mock_pr = MagicMock()
    mock_pr.estimated_total = 0.0  # J-SOX 3社見積閾値未満
    _app.dependency_overrides[get_db_session] = _make_get_db(mock_pr)
    r = client.post(
        f"{_REQ_BASE}/1/quotes",
        json={"vendor_name": "テスト業者A", "quoted_amount": 50000.0},
    )
    assert r.status_code == 201
    body = r.json()
    assert "quote_count" in body
    assert body["quote_count"] >= 1


# ── 発注 (orders) ──────────────────────────────────────────────────────────────

_ORD_BASE = "/api/v1/orders"


def test_orders_create_returns_201() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(1)
    payload = {
        "po_number": "PO-CRUD-001",
        "supplier_id": 1,
        "items": [
            {"material_name": "鉄筋材", "quantity": 10.0, "unit_price": 5000.0},
        ],
    }
    r = client.post(_ORD_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["po_number"] == "PO-CRUD-001"
    assert body["status"] == "draft"
    assert body["id"] == 1


def test_orders_issue_returns_issued() -> None:
    mock_po = MagicMock()
    _app.dependency_overrides[get_db_session] = _make_get_db(mock_po)
    r = client.post(f"{_ORD_BASE}/1/issue")
    assert r.status_code == 200
    body = r.json()
    assert body["order_id"] == 1
    assert body["status"] == "issued"


def test_orders_issue_not_found() -> None:
    _app.dependency_overrides[get_db_session] = _make_get_db(None)
    r = client.post(f"{_ORD_BASE}/{_NONEXISTENT}/issue")
    assert r.status_code == 404


# ── 納品検収 (deliveries) ─────────────────────────────────────────────────────

_DEL_BASE = "/api/v1/deliveries"


def test_deliveries_create_returns_201() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(1)
    payload = {
        "delivery_no": "DLV-CRUD-001",
        "order_id": 1,
        "delivered_qty": 10.0,
        "delivery_date": "2026-06-01",
    }
    r = client.post(_DEL_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "received"
    assert body["id"] == 1


def test_deliveries_inspect_returns_accepted() -> None:
    mock_d = MagicMock()
    _app.dependency_overrides[get_db_session] = _make_get_db(mock_d)
    r = client.post(f"{_DEL_BASE}/1/inspect", params={"accept": True})
    assert r.status_code == 200
    body = r.json()
    assert body["delivery_id"] == 1
    assert body["status"] == "accepted"


def test_deliveries_inspect_not_found() -> None:
    _app.dependency_overrides[get_db_session] = _make_get_db(None)
    r = client.post(f"{_DEL_BASE}/{_NONEXISTENT}/inspect", params={"accept": True})
    assert r.status_code == 404


# ── 在庫 (inventory) ───────────────────────────────────────────────────────────

_INV_BASE = "/api/v1/inventory"


def test_inventory_create_returns_201() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(1)
    payload = {
        "material_code": "MAT-CRUD-001",
        "material_name": "テスト資材",
        "quantity": 100.0,
    }
    r = client.post(_INV_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["material_code"] == "MAT-CRUD-001"
    assert body["id"] == 1


def test_inventory_alerts_returns_structure() -> None:
    _app.dependency_overrides[get_db_session] = _make_list_db([])
    r = client.get(f"{_INV_BASE}/alerts")
    assert r.status_code == 200
    body = r.json()
    assert "alerts" in body
    assert "summary" in body
    assert "ok" in body["summary"]
    assert "warning" in body["summary"]
    assert "danger" in body["summary"]


def test_inventory_list_returns_list() -> None:
    _app.dependency_overrides[get_db_session] = _make_list_db([])
    r = client.get(_INV_BASE)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ── 価格 (prices) ──────────────────────────────────────────────────────────────

_PRC_BASE = "/api/v1/prices"


def test_prices_create_returns_200() -> None:
    _app.dependency_overrides[get_db_session] = _make_create_db(1)
    payload = {
        "material_code": "MAT-PRICE-001",
        "unit_price": 1500.0,
        "effective_date": "2026-06-01",
    }
    r = client.post(_PRC_BASE, json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["material_code"] == "MAT-PRICE-001"
    assert "id" in body


def test_prices_compare_returns_result() -> None:
    payload = [
        {"supplier_id": 1, "supplier_name": "業者A", "unit_price": 1000.0},
        {"supplier_id": 2, "supplier_name": "業者B", "unit_price": 900.0},
    ]
    r = client.post(f"{_PRC_BASE}/compare", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "count" in body
    assert "cheapest" in body


def test_prices_recommend_returns_result() -> None:
    payload = {
        "quotes": [
            {"supplier_id": 1, "supplier_name": "業者A", "unit_price": 1000.0},
            {"supplier_id": 2, "supplier_name": "業者B", "unit_price": 900.0},
        ]
    }
    r = client.post(f"{_PRC_BASE}/recommend", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "count" in body
    assert "recommendations" in body


# ── ダッシュボード (dashboard) ─────────────────────────────────────────────────

_DASH_BASE = "/api/v1/dashboard"


def test_dashboard_summary_returns_structure() -> None:
    async def _db():
        session = AsyncMock()
        count_result = MagicMock()
        count_result.scalar_one = MagicMock(return_value=0)
        sum_result = MagicMock()
        sum_result.scalar_one = MagicMock(return_value=0)
        rank_result = MagicMock()
        rank_result.all = MagicMock(return_value=[])
        inv_result = MagicMock()
        inv_result.scalars.return_value.all.return_value = []
        session.execute = AsyncMock(side_effect=[count_result, sum_result, rank_result, inv_result])
        yield session

    _app.dependency_overrides[get_db_session] = _db
    r = client.get(f"{_DASH_BASE}/summary")
    assert r.status_code == 200
    body = r.json()
    assert "orders" in body
    assert "suppliers" in body
    assert "inventory_alerts" in body

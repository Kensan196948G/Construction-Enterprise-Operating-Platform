"""J-SOX 業務統制: 3社見積必須・月次棚卸テスト (08_購買部)."""
from __future__ import annotations

import os
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

os.environ.setdefault("ENTRA_TENANT_ID", "test-tenant")
os.environ.setdefault("ENTRA_CLIENT_ID", "test-client")
os.environ.setdefault("ENTRA_CLIENT_SECRET", "test-secret")
os.environ.setdefault("JWT_AUDIENCE", "test-audience")
os.environ.setdefault("CDX_GROUP_ROLE_MAP", "{}")

from fastapi.testclient import TestClient  # noqa: E402

from cdx_auth.dependencies import get_current_user  # noqa: E402
from proc_api.db.session import get_db_session  # noqa: E402
from proc_api.main import create_app  # noqa: E402
from proc_api.routes import requests as proc_requests  # noqa: E402

_FAKE_USER = MagicMock(sub="test-user", email="test@example.com")
_app = create_app()
_app.dependency_overrides[get_current_user] = lambda: _FAKE_USER


def _mock_pr(estimated_total: float, request_id: int = 1) -> MagicMock:
    """PurchaseRequest モックを生成する."""
    pr = MagicMock()
    pr.id = request_id
    pr.estimated_total = estimated_total
    pr.current_approval_step = 0
    pr.total_approval_steps = 1
    pr.approval_history = []
    pr.status = "submitted"
    return pr


def _inject_db_with_pr(pr: MagicMock) -> None:
    """session.get が pr を返す DB モックを注入する."""
    async def _mock_db():
        session = AsyncMock()
        session.get = AsyncMock(return_value=pr)
        session.flush = AsyncMock()
        yield session

    _app.dependency_overrides[get_db_session] = _mock_db


# ---- 3社見積ゲートテスト ----

def test_approve_rejects_without_three_quotes() -> None:
    """見積 0件 + 金額閾値以上 → 422."""
    rid = 9001
    proc_requests._vendor_quotes.pop(rid, None)  # clean state
    pr = _mock_pr(estimated_total=2_000_000, request_id=rid)
    _inject_db_with_pr(pr)

    r = TestClient(_app).post(f"/api/v1/requests/{rid}/approve", json={"decision": "approve"})
    assert r.status_code == 422, r.text
    assert "3社見積未達" in r.json()["detail"]


def test_approve_passes_with_three_quotes() -> None:
    """見積 3件 + 金額閾値以上 → 200."""
    rid = 9002
    proc_requests._vendor_quotes[rid] = [
        {"vendor_name": "A社", "quoted_amount": 1_500_000},
        {"vendor_name": "B社", "quoted_amount": 1_600_000},
        {"vendor_name": "C社", "quoted_amount": 1_450_000},
    ]
    pr = _mock_pr(estimated_total=2_000_000, request_id=rid)
    _inject_db_with_pr(pr)

    r = TestClient(_app).post(f"/api/v1/requests/{rid}/approve", json={"decision": "approve"})
    assert r.status_code == 200, r.text


def test_approve_below_threshold_skips_quote_gate() -> None:
    """金額閾値未満 → 見積なしでも承認可能."""
    rid = 9003
    proc_requests._vendor_quotes.pop(rid, None)  # no quotes
    pr = _mock_pr(estimated_total=500_000, request_id=rid)
    _inject_db_with_pr(pr)

    r = TestClient(_app).post(f"/api/v1/requests/{rid}/approve", json={"decision": "approve"})
    assert r.status_code == 200, r.text


# ---- 棚卸テスト ----

def test_stocktake_records_inventory_movement_on_diff() -> None:
    """棚卸で数量差異あり → InventoryMovement が session.add される."""
    mock_inv = MagicMock()
    mock_inv.id = 1
    mock_inv.quantity = Decimal("10")
    mock_inv.material_code = "MAT-001"
    mock_inv.unit = "個"
    mock_inv.last_stocktake_at = None

    added_objects: list = []

    async def _mock_db():
        session = AsyncMock()
        session.get = AsyncMock(return_value=mock_inv)
        session.add = MagicMock(side_effect=lambda obj: added_objects.append(obj))
        session.flush = AsyncMock()
        yield session

    _app.dependency_overrides[get_db_session] = _mock_db

    r = TestClient(_app).post("/api/v1/inventory/1/stocktake", json={"counted_qty": 8.0})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["adjusted_by"] == -2.0
    assert body["new_qty"] == 8.0
    assert len(added_objects) == 1  # InventoryMovement が add された


def test_monthly_report_returns_overdue_items() -> None:
    """last_stocktake_at が None の在庫品目は月次レポートに表示される."""
    old_date = date.today() - timedelta(days=40)
    items = [
        _make_inventory_mock(1, "MAT-A", last_stocktake=None),
        _make_inventory_mock(2, "MAT-B", last_stocktake=old_date),
        _make_inventory_mock(3, "MAT-C", last_stocktake=date.today()),  # 最新 → 対象外
    ]

    async def _mock_db():
        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = items
        session.execute = AsyncMock(return_value=mock_result)
        yield session

    _app.dependency_overrides[get_db_session] = _mock_db

    r = TestClient(_app).get("/api/v1/inventory/monthly-report")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["overdue_count"] == 2
    codes = [i["material_code"] for i in body["items"]]
    assert "MAT-A" in codes
    assert "MAT-B" in codes
    assert "MAT-C" not in codes


def _make_inventory_mock(inv_id: int, code: str, last_stocktake: date | None) -> MagicMock:
    inv = MagicMock()
    inv.id = inv_id
    inv.material_code = code
    inv.material_name = f"{code} 材料"
    inv.warehouse = "本社倉庫"
    inv.quantity = 100.0
    inv.last_stocktake_at = last_stocktake
    return inv

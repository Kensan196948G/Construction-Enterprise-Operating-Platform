"""J-SOX 業務統制: 経費申請 SoD テスト (07_管理本部)."""
from __future__ import annotations

import os

# Auth bypass — must set before importing app
os.environ.setdefault("CORP_DISABLE_AUTH", "1")

from corp_api.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

client = TestClient(app)

_BASE = "/api/v1/payables"
_PAYABLE = {
    "counterparty_name": "テスト仕入先",
    "amount": 500000,
    "scheduled_date": "2026-07-01",
}


def test_sod_same_user_rejected() -> None:
    """申請者と承認者が同一の場合は 422 (SoD 違反)."""
    r = client.post(_BASE, json={**_PAYABLE, "submitted_by": "dev-user"})
    assert r.status_code == 201, r.text
    payable_id = r.json()["payable_id"]

    r2 = client.post(f"{_BASE}/{payable_id}/approve", json={"decision": "approve"})
    assert r2.status_code == 422, r2.text
    detail = r2.json()["detail"]
    assert "SoD" in detail or "職務分離" in detail


def test_sod_different_user_approved() -> None:
    """申請者と承認者が異なる場合は 200 (承認成功)."""
    r = client.post(_BASE, json={**_PAYABLE, "submitted_by": "other-user"})
    assert r.status_code == 201, r.text
    payable_id = r.json()["payable_id"]

    r2 = client.post(f"{_BASE}/{payable_id}/approve", json={"decision": "approve"})
    assert r2.status_code == 200, r2.text
    assert r2.json()["status"] == "approved"


def test_invalid_decision_returns_400() -> None:
    """無効な decision 値は 400."""
    r = client.post(_BASE, json={**_PAYABLE, "submitted_by": "other-user"})
    assert r.status_code == 201, r.text
    payable_id = r.json()["payable_id"]

    r2 = client.post(f"{_BASE}/{payable_id}/approve", json={"decision": "maybe"})
    assert r2.status_code == 400, r2.text

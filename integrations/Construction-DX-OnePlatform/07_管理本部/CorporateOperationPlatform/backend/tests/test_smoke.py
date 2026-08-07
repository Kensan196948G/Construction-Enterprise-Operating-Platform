"""FastAPI smoke tests."""
from __future__ import annotations

import os

# 認証バイパス
os.environ.setdefault("CORP_DISABLE_AUTH", "1")

from corp_api.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

client = TestClient(app)


def test_health_ok() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


def test_journal_create_balanced() -> None:
    # 現金 / 売上 100,000
    payload = {
        "txn_date": "2026-05-22",
        "debit_account_code": "1110",
        "credit_account_code": "4110",
        "amount": 100000,
        "description": "売上計上",
        "voucher_no": "V-TEST-1",
    }
    r = client.post("/api/v1/accounting/journal-entries", json=payload)
    assert r.status_code == 201


def test_invoice_registration_format() -> None:
    # 有効
    r = client.post(
        "/api/v1/invoices",
        json={
            "invoice_number": "INV-001",
            "issuer_name": "建設DX株式会社",
            "issuer_registration_no": "T1234567890123",
            "invoice_date": "2026-05-22",
            "amount_excl_tax": 100000,
            "tax_rate": 0.10,
            "tax_amount": 10000,
            "amount_incl_tax": 110000,
        },
    )
    assert r.status_code == 201

    # 不正な番号は 400
    r2 = client.post(
        "/api/v1/invoices",
        json={
            "invoice_number": "INV-002",
            "issuer_name": "Bad株式会社",
            "issuer_registration_no": "INVALID",
            "invoice_date": "2026-05-22",
            "amount_excl_tax": 1,
            "tax_rate": 0.10,
            "tax_amount": 0,
            "amount_incl_tax": 1,
        },
    )
    assert r2.status_code == 400


def test_evm_endpoint() -> None:
    r = client.post(
        "/api/v1/costs/evm",
        json={"pv": 40, "ev": 35, "ac": 30, "bac": 100},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["cv"] == 5
    assert body["sv"] == -5


def test_dashboard_kpi() -> None:
    r = client.get("/api/v1/dashboard/kpi")
    assert r.status_code == 200
    body = r.json()
    assert "revenue" in body
    assert "accounts_receivable" in body


def test_archive_create_and_verify() -> None:
    import base64

    data = b"hello archive bytes"
    r = client.post(
        "/api/v1/archives",
        json={
            "target_type": "invoice",
            "file_name": "test.pdf",
            "file_b64": base64.b64encode(data).decode(),
            "search_amount": 110000,
            "search_counterparty": "A社",
        },
    )
    assert r.status_code == 201
    archive_id = r.json()["archive_id"]
    rv = client.get(f"/api/v1/archives/{archive_id}/verify")
    assert rv.status_code == 200
    assert rv.json()["integrity_ok"] is True

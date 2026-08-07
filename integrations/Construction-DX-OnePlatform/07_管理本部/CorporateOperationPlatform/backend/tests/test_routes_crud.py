"""07_管理本部 CorporateOperationPlatform ルート CRUD テスト.

MemoryStore バックエンド + CORP_DISABLE_AUTH=1 のため DB モック・認証モック不要。
TestClient(app) を直接使い、各ルートの作成→取得→404 / 業務ロジックを検証する。
"""

from __future__ import annotations

import base64
import os
import uuid

# 認証バイパス: app import より前に設定
os.environ.setdefault("CORP_DISABLE_AUTH", "1")

from fastapi.testclient import TestClient

from corp_api.main import app

client = TestClient(app)

_NONEXISTENT = str(uuid.uuid4())

# ── 勘定科目 / 仕訳 (accounting) ──────────────────────────────────────────────

_ACC_BASE = "/api/v1/accounting"


def test_accounting_account_create_returns_201() -> None:
    payload = {
        "code": "1110",
        "name": "現金預金",
        "category": "asset",
    }
    r = client.post(f"{_ACC_BASE}/accounts", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["code"] == "1110"
    assert body["category"] == "asset"
    assert "account_id" in body


def test_accounting_journal_entry_create_returns_201() -> None:
    """1 行仕訳 (借方/貸方同額) はバランス検証を通過する."""
    payload = {
        "txn_date": "2026-06-01",
        "debit_account_code": "1110",
        "credit_account_code": "4110",
        "amount": 500000,
        "description": "売上計上テスト",
        "voucher_no": f"V-CRUD-{uuid.uuid4().hex[:6]}",
    }
    r = client.post(f"{_ACC_BASE}/journal-entries", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["amount"] == 500000
    assert "entry_id" in body


def test_accounting_trial_balance_returns_rows() -> None:
    r = client.get(f"{_ACC_BASE}/trial-balance")
    assert r.status_code == 200
    body = r.json()
    assert "rows" in body
    assert "total_debit" in body
    assert "total_credit" in body


def test_accounting_financial_statements_returns_structure() -> None:
    r = client.get(f"{_ACC_BASE}/financial-statements")
    assert r.status_code == 200
    body = r.json()
    assert "balance_sheet" in body
    assert "profit_loss" in body
    assert "net_income" in body


# ── 工事原価 (costs) ──────────────────────────────────────────────────────────

_COST_BASE = "/api/v1/costs"
_TEST_PROJECT = f"PROJ-CRUD-{uuid.uuid4().hex[:6]}"


def test_costs_record_create_returns_201() -> None:
    payload = {
        "project_id": _TEST_PROJECT,
        "cost_type": "labor",
        "amount": 120000.0,
        "recorded_at": "2026-06-01",
    }
    r = client.post(f"{_COST_BASE}/records", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["cost_type"] == "labor"
    assert body["project_id"] == _TEST_PROJECT
    assert "cost_id" in body


def test_costs_list_includes_created() -> None:
    payload = {
        "project_id": _TEST_PROJECT,
        "cost_type": "material",
        "amount": 80000.0,
        "recorded_at": "2026-06-01",
    }
    r = client.post(f"{_COST_BASE}/records", json=payload)
    assert r.status_code == 201
    cost_id = r.json()["cost_id"]

    r = client.get(f"{_COST_BASE}/records")
    assert r.status_code == 200
    ids = [c["cost_id"] for c in r.json()]
    assert cost_id in ids


def test_costs_by_project_returns_summary() -> None:
    # Ensure at least one record exists for project
    client.post(
        f"{_COST_BASE}/records",
        json={
            "project_id": _TEST_PROJECT,
            "cost_type": "expense",
            "amount": 30000.0,
            "recorded_at": "2026-06-01",
        },
    )
    r = client.get(f"{_COST_BASE}/by-project/{_TEST_PROJECT}")
    assert r.status_code == 200
    body = r.json()
    assert body["project_id"] == _TEST_PROJECT
    assert "by_cost_type" in body
    assert body["total"] > 0


def test_costs_evm_returns_metrics() -> None:
    r = client.post(f"{_COST_BASE}/evm", json={"pv": 100.0, "ev": 80.0, "ac": 90.0, "bac": 200.0})
    assert r.status_code == 200
    body = r.json()
    assert "cv" in body
    assert "sv" in body
    assert "cpi" in body
    assert "eac" in body


# ── 請求書 / インボイス制度 (invoices) ─────────────────────────────────────────

_INV_BASE = "/api/v1/invoices"
_VALID_REG_NO = "T1234567890123"  # T + 13 digits


def test_invoices_create_valid_returns_201() -> None:
    payload = {
        "invoice_number": f"INV-CRUD-{uuid.uuid4().hex[:4]}",
        "issuer_name": "建設DX株式会社",
        "issuer_registration_no": _VALID_REG_NO,
        "invoice_date": "2026-06-01",
        "amount_excl_tax": 100000.0,
        "tax_rate": 0.10,
        "tax_amount": 10000.0,
        "amount_incl_tax": 110000.0,
    }
    r = client.post(_INV_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["issuer_registration_no"] == _VALID_REG_NO
    assert "invoice_id" in body


def test_invoices_create_invalid_registration_returns_400() -> None:
    payload = {
        "invoice_number": "INV-INVALID",
        "issuer_name": "不正事業者",
        "issuer_registration_no": "INVALID-NO",
        "invoice_date": "2026-06-01",
        "amount_excl_tax": 1.0,
        "tax_rate": 0.10,
        "tax_amount": 0.0,
        "amount_incl_tax": 1.0,
    }
    r = client.post(_INV_BASE, json=payload)
    assert r.status_code == 400


def test_invoices_get_by_id() -> None:
    payload = {
        "invoice_number": f"INV-GET-{uuid.uuid4().hex[:4]}",
        "issuer_name": "テスト発行者",
        "issuer_registration_no": _VALID_REG_NO,
        "invoice_date": "2026-06-01",
        "amount_excl_tax": 50000.0,
        "tax_rate": 0.10,
        "tax_amount": 5000.0,
        "amount_incl_tax": 55000.0,
    }
    r = client.post(_INV_BASE, json=payload)
    assert r.status_code == 201
    inv_id = r.json()["invoice_id"]

    r = client.get(f"{_INV_BASE}/{inv_id}")
    assert r.status_code == 200
    assert r.json()["invoice_id"] == inv_id


def test_invoices_get_not_found() -> None:
    r = client.get(f"{_INV_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


# ── 買掛金 / 支払 (payables) ──────────────────────────────────────────────────

_PAY_BASE = "/api/v1/payables"


def test_payables_create_returns_201() -> None:
    payload = {
        "counterparty_name": "テスト仕入先株式会社",
        "amount": 250000.0,
        "scheduled_date": "2026-07-15",
        "payment_method": "bank_transfer",
    }
    r = client.post(_PAY_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["counterparty_name"] == "テスト仕入先株式会社"
    assert "payable_id" in body


def test_payables_schedule_returns_structure() -> None:
    r = client.get(f"{_PAY_BASE}/schedule")
    assert r.status_code == 200
    body = r.json()
    assert "upcoming" in body
    assert "overdue" in body
    assert "total_amount" in body


# ── 売掛金 (receivables) ───────────────────────────────────────────────────────

_REC_BASE = "/api/v1/receivables"


def test_receivables_create_returns_201() -> None:
    payload = {
        "counterparty_name": "テスト得意先株式会社",
        "amount": 330000.0,
        "scheduled_date": "2026-06-30",
    }
    r = client.post(_REC_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["counterparty_name"] == "テスト得意先株式会社"
    assert "receivable_id" in body


def test_receivables_dunning_list_returns_structure() -> None:
    r = client.get(f"{_REC_BASE}/dunning-list")
    assert r.status_code == 200
    body = r.json()
    assert "overdue" in body
    assert "total_overdue" in body


# ── 契約管理 (contracts) ──────────────────────────────────────────────────────

_CON_BASE = "/api/v1/contracts"


def test_contracts_create_returns_201() -> None:
    payload = {
        "contract_no": f"CTR-CRUD-{uuid.uuid4().hex[:6]}",
        "title": "工事請負契約テスト",
        "contract_type": "construction",
        "counterparty_name": "テスト建設株式会社",
        "start_date": "2026-06-01",
        "end_date": "2027-03-31",
        "amount": 5000000.0,
    }
    r = client.post(_CON_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["contract_type"] == "construction"
    assert "contract_id" in body


def test_contracts_get_by_id() -> None:
    payload = {
        "contract_no": f"CTR-GET-{uuid.uuid4().hex[:6]}",
        "title": "サービス契約テスト",
        "contract_type": "service",
        "counterparty_name": "テストサービス社",
        "start_date": "2026-06-01",
    }
    r = client.post(_CON_BASE, json=payload)
    assert r.status_code == 201
    con_id = r.json()["contract_id"]

    r = client.get(f"{_CON_BASE}/{con_id}")
    assert r.status_code == 200
    assert r.json()["contract_id"] == con_id


def test_contracts_get_not_found() -> None:
    r = client.get(f"{_CON_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


# ── 法務案件 (legal) ──────────────────────────────────────────────────────────

_LEG_BASE = "/api/v1/legal"


def test_legal_create_returns_201() -> None:
    payload = {
        "title": "工事瑕疵クレーム対応テスト",
        "matter_type": "claim",
        "counterparty_name": "テスト元請",
        "status": "open",
    }
    r = client.post(_LEG_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["matter_type"] == "claim"
    assert "matter_id" in body


def test_legal_get_by_id() -> None:
    payload = {
        "title": "労働争議テスト",
        "matter_type": "labor",
    }
    r = client.post(_LEG_BASE, json=payload)
    assert r.status_code == 201
    matter_id = r.json()["matter_id"]

    r = client.get(f"{_LEG_BASE}/{matter_id}")
    assert r.status_code == 200
    assert r.json()["matter_id"] == matter_id


def test_legal_get_not_found() -> None:
    r = client.get(f"{_LEG_BASE}/{_NONEXISTENT}")
    assert r.status_code == 404


# ── 電子帳簿保存法アーカイブ (archives) ──────────────────────────────────────

_ARC_BASE = "/api/v1/archives"
_TEST_CONTENT = base64.b64encode(b"test archive pdf content").decode()


def test_archives_create_returns_201() -> None:
    payload = {
        "target_type": "invoice",
        "file_name": "test_invoice.pdf",
        "file_b64": _TEST_CONTENT,
        "search_date": "2026-06-01T00:00:00",
        "search_amount": 110000,
        "search_counterparty": "テスト取引先",
    }
    r = client.post(_ARC_BASE, json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["target_type"] == "invoice"
    assert body["file_name"] == "test_invoice.pdf"
    assert "archive_id" in body
    assert "sha256" in body


def test_archives_verify_integrity_ok() -> None:
    """アーカイブ作成後に SHA-256 整合性検証が通ること."""
    payload = {
        "target_type": "contract",
        "file_name": "contract.pdf",
        "file_b64": base64.b64encode(b"contract data for integrity test").decode(),
    }
    r = client.post(_ARC_BASE, json=payload)
    assert r.status_code == 201
    archive_id = r.json()["archive_id"]

    r = client.get(f"{_ARC_BASE}/{archive_id}/verify")
    assert r.status_code == 200
    body = r.json()
    assert body["integrity_ok"] is True
    assert body["archive_id"] == archive_id


# ── 経営指標 KPI ダッシュボード (dashboard) ──────────────────────────────────

_DASH_BASE = "/api/v1/dashboard"


def test_dashboard_kpi_returns_metrics() -> None:
    r = client.get(f"{_DASH_BASE}/kpi")
    assert r.status_code == 200
    body = r.json()
    assert "revenue" in body
    assert "net_income" in body
    assert "accounts_receivable" in body
    assert "accounts_payable" in body
    assert "cash_flow_projection" in body

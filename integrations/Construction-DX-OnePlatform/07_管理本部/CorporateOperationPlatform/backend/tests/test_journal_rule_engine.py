"""自動仕訳ルールエンジンの単体テスト."""
from __future__ import annotations

import pytest
from corp_api.services.journal_rule_engine import (
    JournalRuleEngine,
    JournalRuleError,
    build_default_engine,
)


def test_invoice_received_standard_maps_to_provisional_payment() -> None:
    eng = build_default_engine()
    out = eng.apply(
        {
            "event_type": "invoice_received",
            "txn_date": "2026-05-22",
            "amount": 110000,
            "tax_category": "standard",
            "invoice_number": "INV-001",
            "issuer_name": "A社",
            "voucher_no": "V-1",
        }
    )
    assert out["debit_account_code"] == "1230"
    assert out["credit_account_code"] == "2110"
    assert out["amount"] == 110000
    assert "INV-001" in (out["description"] or "")


def test_payroll_payment_rule() -> None:
    eng = build_default_engine()
    out = eng.apply(
        {
            "event_type": "payroll_payment",
            "txn_date": "2026-05-25",
            "amount": 5_000_000,
            "period": "2026-05",
            "voucher_no": "PAY-1",
        }
    )
    assert out["debit_account_code"] == "6110"
    assert out["credit_account_code"] == "1110"


def test_no_matching_rule_raises() -> None:
    eng = JournalRuleEngine()
    with pytest.raises(JournalRuleError):
        eng.apply({"event_type": "unknown", "amount": 1})


def test_custom_rule_registration_and_match_conditions() -> None:
    eng = JournalRuleEngine()
    eng.add_rule(
        {
            "rule_id": "RENT",
            "event_type": "rent_payment",
            "match": {"category": "office"},
            "debit_account_code": "6310",
            "credit_account_code": "1110",
            "description_template": "賃料 {month}",
        }
    )
    # 条件不一致 -> エラー
    with pytest.raises(JournalRuleError):
        eng.apply({"event_type": "rent_payment", "category": "warehouse", "amount": 100})
    # 一致 -> OK
    out = eng.apply(
        {
            "event_type": "rent_payment",
            "category": "office",
            "amount": 200000,
            "month": "2026-05",
            "txn_date": "2026-05-01",
        }
    )
    assert out["debit_account_code"] == "6310"
    assert "2026-05" in out["description"]

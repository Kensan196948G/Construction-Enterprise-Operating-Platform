"""会計エンジンの借貸バランス検証 / 試算表 / B-PL ロジック."""
from __future__ import annotations

import pytest
from corp_api.services.accounting_engine import (
    JournalBalanceError,
    build_financial_statements,
    build_trial_balance,
    validate_entries_balance,
)


def _accounts() -> list[dict]:
    return [
        {"code": "1110", "name": "現金", "category": "asset"},
        {"code": "1140", "name": "売掛金", "category": "asset"},
        {"code": "2110", "name": "買掛金", "category": "liability"},
        {"code": "3110", "name": "資本金", "category": "equity"},
        {"code": "4110", "name": "売上高", "category": "revenue"},
        {"code": "5110", "name": "外注費", "category": "expense"},
    ]


def test_single_entry_is_balanced() -> None:
    """1 仕訳 (現金 / 売上 100,000) はバランス."""
    entries = [
        {
            "voucher_no": "V001",
            "debit_account_code": "1110",
            "credit_account_code": "4110",
            "amount": 100000,
        }
    ]
    validate_entries_balance(entries)  # 例外が出なければ OK


def test_unbalanced_voucher_raises() -> None:
    """同一 voucher_no 内の借方/貸方額が不一致だと例外."""
    entries = [
        {
            "voucher_no": "V002",
            "debit_account_code": "1110",
            "credit_account_code": None,
            "amount": 100,
        },
        {
            "voucher_no": "V002",
            "debit_account_code": None,
            "credit_account_code": "4110",
            "amount": 50,
        },
    ]
    with pytest.raises(JournalBalanceError):
        validate_entries_balance(entries)


def test_trial_balance_sums_debit_and_credit() -> None:
    """試算表は科目ごとに借方/貸方を集計する."""
    entries = [
        {
            "voucher_no": "V010",
            "debit_account_code": "1110",
            "credit_account_code": "4110",
            "amount": 100000,
        },
        {
            "voucher_no": "V011",
            "debit_account_code": "5110",
            "credit_account_code": "1110",
            "amount": 30000,
        },
    ]
    tb = build_trial_balance(entries, _accounts())
    by_code = {r.account_code: r for r in tb}
    assert float(by_code["1110"].debit_total) == 100000
    assert float(by_code["1110"].credit_total) == 30000
    # 資産 (1110) の残高 = 借方 - 貸方
    assert float(by_code["1110"].balance) == 70000
    # 収益 (4110) の残高 = 貸方 - 借方
    assert float(by_code["4110"].balance) == 100000


def test_balance_sheet_balances_after_net_income() -> None:
    """B/S は当期純利益を純資産に加えた上で資産=負債純資産が一致する."""
    entries = [
        # 開業: 資本金 1,000,000 を現金で受領
        {
            "voucher_no": "V100",
            "debit_account_code": "1110",
            "credit_account_code": "3110",
            "amount": 1_000_000,
        },
        # 売上: 現金 / 売上 500,000
        {
            "voucher_no": "V101",
            "debit_account_code": "1110",
            "credit_account_code": "4110",
            "amount": 500_000,
        },
        # 費用: 外注費 200,000 を現金で支払
        {
            "voucher_no": "V102",
            "debit_account_code": "5110",
            "credit_account_code": "1110",
            "amount": 200_000,
        },
    ]
    fs = build_financial_statements(entries, _accounts())
    assert float(fs.total_revenue) == 500_000
    assert float(fs.total_expense) == 200_000
    assert float(fs.net_income) == 300_000
    # 資産 = 1,000,000 + 500,000 - 200,000 = 1,300,000
    assert float(fs.total_assets) == 1_300_000
    # 純資産 (資本金 1,000,000 + 当期純利益 300,000) = 1,300,000 でバランス
    assert fs.bs_balanced is True

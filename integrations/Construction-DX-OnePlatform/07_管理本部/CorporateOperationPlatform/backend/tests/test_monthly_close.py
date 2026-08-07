"""月次決算自動化の単体テスト."""
from __future__ import annotations

from corp_api.services.monthly_close import run_monthly_close

ACCOUNTS = [
    {"code": "1110", "name": "現金", "category": "asset"},
    {"code": "1521", "name": "減価償却累計額", "category": "asset"},
    {"code": "2110", "name": "買掛金", "category": "liability"},
    {"code": "4110", "name": "売上高", "category": "revenue"},
    {"code": "6110", "name": "給与手当", "category": "expense"},
    {"code": "6210", "name": "減価償却費", "category": "expense"},
]


def test_run_monthly_close_generates_period_statements_and_cashflow() -> None:
    entries = [
        # 5月: 現金 100,000 / 売上 100,000
        {
            "txn_date": "2026-05-10",
            "debit_account_code": "1110",
            "credit_account_code": "4110",
            "amount": 100000,
            "voucher_no": "V1",
        },
        # 5月: 給与 50,000 / 現金 50,000
        {
            "txn_date": "2026-05-25",
            "debit_account_code": "6110",
            "credit_account_code": "1110",
            "amount": 50000,
            "voucher_no": "V2",
        },
        # 4月: 期間外
        {
            "txn_date": "2026-04-01",
            "debit_account_code": "1110",
            "credit_account_code": "4110",
            "amount": 999999,
            "voucher_no": "V0",
        },
    ]
    result = run_monthly_close(entries, ACCOUNTS, year=2026, month=5, opening_cash=0)
    fs = result.financial_statements
    # 売上は 5月分のみ
    assert fs["total_revenue"] == 100000
    assert fs["total_expense"] == 50000
    assert fs["net_income"] == 50000
    cf = result.cash_flow
    # 現金: +100000 (営業) -50000 (営業) = +50000
    assert cf["operating"] == 50000
    assert cf["net_increase"] == 50000
    assert cf["closing_cash"] == 50000


def test_monthly_close_with_depreciation_adjustment() -> None:
    entries: list[dict] = []
    fixed_assets = [
        {"name": "工事用車両", "acquisition_cost": 1_200_000, "useful_life_months": 60}
    ]
    result = run_monthly_close(
        entries, ACCOUNTS, year=2026, month=5, fixed_assets=fixed_assets
    )
    assert len(result.adjustment_entries) == 1
    adj = result.adjustment_entries[0]
    assert adj["kind"] == "depreciation"
    assert adj["debit_account_code"] == "6210"
    assert adj["credit_account_code"] == "1521"
    assert adj["amount"] == 20000  # 1,200,000 / 60
    # 減価償却が P/L に反映される
    assert result.financial_statements["total_expense"] == 20000

"""財務諸表 PDF 出力のテスト."""
from __future__ import annotations

import pytest

try:
    from fpdf import FPDF  # noqa: F401

    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

pytestmark = pytest.mark.skipif(not FPDF_AVAILABLE, reason="fpdf2 not installed")

from corp_api.services.financial_pdf import render_financial_statements_pdf  # noqa: E402

CURRENT = {
    "balance_sheet": {
        "asset": [
            {"account_code": "1110", "account_name": "Cash", "category": "asset", "balance": 500000}
        ],
        "liability": [],
        "equity": [],
    },
    "profit_loss": {
        "revenue": [
            {"account_code": "4110", "account_name": "Sales", "category": "revenue", "balance": 100000}
        ],
        "expense": [],
    },
    "total_assets": 500000,
    "total_liabilities_equity": 100000,
    "total_revenue": 100000,
    "total_expense": 0,
    "net_income": 100000,
    "bs_balanced": False,
}


def test_render_pdf_returns_pdf_bytes() -> None:
    out = render_financial_statements_pdf(CURRENT, year=2026)
    assert isinstance(out, (bytes, bytearray))
    assert out[:5] == b"%PDF-"
    # ある程度のサイズ (空ではない)
    assert len(out) > 500


def test_render_pdf_with_comparison_and_cashflow() -> None:
    cf = {
        "operating": 50000,
        "investing": -20000,
        "financing": 0,
        "net_increase": 30000,
        "opening_cash": 100000,
        "closing_cash": 130000,
    }
    prev = dict(CURRENT, net_income=80000, total_assets=400000)
    out = render_financial_statements_pdf(
        CURRENT, previous=prev, cash_flow=cf, year=2026
    )
    assert out[:5] == b"%PDF-"

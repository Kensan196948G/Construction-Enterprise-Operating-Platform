"""価格分析テスト."""
from __future__ import annotations

from datetime import date

from proc_api.services.price_analyzer import (
    PriceQuote,
    compare_quotes,
    summarize_price_history,
)


def test_compare_quotes_basic() -> None:
    quotes = [
        PriceQuote(1, "A社", 1000.0),
        PriceQuote(2, "B社", 900.0),
        PriceQuote(3, "C社", 1100.0),
    ]
    res = compare_quotes(quotes)
    assert res["cheapest"]["supplier_id"] == 2
    assert res["cheapest"]["unit_price"] == 900.0
    assert res["most_expensive"]["supplier_id"] == 3
    assert res["count"] == 3
    assert res["avg_price"] == 1000.0


def test_summarize_price_history_monthly() -> None:
    history = [
        {"effective_date": date(2026, 1, 5), "unit_price": 100.0},
        {"effective_date": date(2026, 1, 20), "unit_price": 110.0},
        {"effective_date": date(2026, 2, 1), "unit_price": 130.0},
    ]
    trend = summarize_price_history(history)
    assert len(trend) == 2
    assert trend[0].period == "2026-01"
    assert trend[0].avg_price == 105.0
    assert trend[0].sample_size == 2
    assert trend[1].period == "2026-02"
    assert trend[1].avg_price == 130.0

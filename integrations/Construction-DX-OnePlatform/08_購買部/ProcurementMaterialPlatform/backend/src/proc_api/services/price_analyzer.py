"""資材価格分析サービス.

機能:
  - compare_quotes: 相見積比較 (最安 / 中央値 / 最高 + ばらつき)
  - summarize_price_history: 月次の単価推移を集計し、平均 / 最小 / 最大 / 件数を返す
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import date
from typing import Iterable


@dataclass(frozen=True)
class PriceQuote:
    """相見積単価情報."""

    supplier_id: int
    supplier_name: str
    unit_price: float
    delivery_lead_days: int = 0


@dataclass(frozen=True)
class PriceTrendPoint:
    """月次トレンド."""

    period: str   # YYYY-MM
    avg_price: float
    min_price: float
    max_price: float
    sample_size: int


def compare_quotes(quotes: Iterable[PriceQuote]) -> dict:
    """相見積を比較し、最安・最高・統計指標を返す."""
    items = list(quotes)
    if not items:
        return {"count": 0}
    sorted_items = sorted(items, key=lambda q: q.unit_price)
    prices = [q.unit_price for q in sorted_items]
    cheapest = sorted_items[0]
    most_exp = sorted_items[-1]
    mean = statistics.mean(prices)
    diff_pct = ((most_exp.unit_price - cheapest.unit_price) / cheapest.unit_price * 100.0
                if cheapest.unit_price else 0.0)
    return {
        "count": len(items),
        "cheapest": {
            "supplier_id": cheapest.supplier_id,
            "supplier_name": cheapest.supplier_name,
            "unit_price": cheapest.unit_price,
        },
        "most_expensive": {
            "supplier_id": most_exp.supplier_id,
            "supplier_name": most_exp.supplier_name,
            "unit_price": most_exp.unit_price,
        },
        "avg_price": round(mean, 2),
        "median_price": round(statistics.median(prices), 2),
        "stdev": round(statistics.pstdev(prices), 2),
        "spread_pct": round(diff_pct, 2),
    }


def summarize_price_history(
    history: Iterable[dict],
) -> list[PriceTrendPoint]:
    """価格履歴を月次集計する.

    history: [{effective_date: date, unit_price: float}, ...]
    """
    buckets: dict[str, list[float]] = {}
    for h in history:
        d = h.get("effective_date")
        if isinstance(d, str):
            d = date.fromisoformat(d)
        if not isinstance(d, date):
            continue
        key = f"{d.year:04d}-{d.month:02d}"
        buckets.setdefault(key, []).append(float(h["unit_price"]))
    points: list[PriceTrendPoint] = []
    for k in sorted(buckets.keys()):
        prices = buckets[k]
        points.append(
            PriceTrendPoint(
                period=k,
                avg_price=round(statistics.mean(prices), 2),
                min_price=round(min(prices), 2),
                max_price=round(max(prices), 2),
                sample_size=len(prices),
            )
        )
    return points

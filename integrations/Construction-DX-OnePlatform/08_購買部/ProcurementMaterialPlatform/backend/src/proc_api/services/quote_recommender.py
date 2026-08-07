"""相見積最適提案サービス.

複数の見積を 4 指標でスコアリングし、戦略毎に推奨業者を返す。

スコア = 価格(40%) + 評価(30%) + 納期(20%) + 安全(10%) (デフォルト戦略 = "balanced")

戦略:
  - "cheapest"  : 価格 70%, 評価 10%, 納期 10%, 安全 10%
  - "quality"   : 価格 15%, 評価 50%, 納期 15%, 安全 20%
  - "delivery"  : 価格 20%, 評価 15%, 納期 55%, 安全 10%
  - "balanced"  : 価格 40%, 評価 30%, 納期 20%, 安全 10%
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Literal

Strategy = Literal["cheapest", "quality", "delivery", "balanced"]


_WEIGHTS: dict[str, dict[str, float]] = {
    "balanced": {"price": 0.40, "rating": 0.30, "delivery": 0.20, "safety": 0.10},
    "cheapest": {"price": 0.70, "rating": 0.10, "delivery": 0.10, "safety": 0.10},
    "quality":  {"price": 0.15, "rating": 0.50, "delivery": 0.15, "safety": 0.20},
    "delivery": {"price": 0.20, "rating": 0.15, "delivery": 0.55, "safety": 0.10},
}


@dataclass(frozen=True)
class QuoteInput:
    """1 見積分の入力."""

    supplier_id: int
    supplier_name: str
    unit_price: float
    delivery_lead_days: int = 7
    supplier_rating: float = 70.0      # 0-100 (協力会社評価ランクスコア)
    safety_score: float = 80.0         # 0-100
    quantity: float = 1.0


@dataclass(frozen=True)
class ScoredQuote:
    """スコア化済み見積."""

    supplier_id: int
    supplier_name: str
    unit_price: float
    delivery_lead_days: int
    price_score: float
    rating_score: float
    delivery_score: float
    safety_score: float
    total_score: float
    total_cost: float


@dataclass(frozen=True)
class Recommendation:
    """戦略別推奨."""

    strategy: str
    weights: dict[str, float]
    top: ScoredQuote
    ranking: list[ScoredQuote]


# ---------- スコアリング ----------


def _normalize_price(prices: list[float]) -> dict[int, float]:
    """価格を 0-100 に正規化 (最安 = 100, 最高 = 0)."""
    if not prices:
        return {}
    lo, hi = min(prices), max(prices)
    span = hi - lo
    out: dict[int, float] = {}
    for idx, p in enumerate(prices):
        if span <= 0:
            out[idx] = 100.0
        else:
            out[idx] = round((hi - p) / span * 100.0, 2)
    return out


def _normalize_delivery(days: list[int]) -> dict[int, float]:
    if not days:
        return {}
    lo, hi = min(days), max(days)
    span = hi - lo
    out: dict[int, float] = {}
    for idx, d in enumerate(days):
        if span <= 0:
            out[idx] = 100.0
        else:
            out[idx] = round((hi - d) / span * 100.0, 2)
    return out


def _score_quotes(quotes: list[QuoteInput], weights: dict[str, float]) -> list[ScoredQuote]:
    price_norm = _normalize_price([q.unit_price for q in quotes])
    delivery_norm = _normalize_delivery([q.delivery_lead_days for q in quotes])

    scored: list[ScoredQuote] = []
    for i, q in enumerate(quotes):
        ps = price_norm.get(i, 0.0)
        ds = delivery_norm.get(i, 0.0)
        rs = max(0.0, min(100.0, q.supplier_rating))
        ss = max(0.0, min(100.0, q.safety_score))
        total = (
            ps * weights["price"]
            + rs * weights["rating"]
            + ds * weights["delivery"]
            + ss * weights["safety"]
        )
        scored.append(
            ScoredQuote(
                supplier_id=q.supplier_id,
                supplier_name=q.supplier_name,
                unit_price=q.unit_price,
                delivery_lead_days=q.delivery_lead_days,
                price_score=ps,
                rating_score=rs,
                delivery_score=ds,
                safety_score=ss,
                total_score=round(total, 2),
                total_cost=round(q.unit_price * q.quantity, 2),
            )
        )
    scored.sort(key=lambda s: s.total_score, reverse=True)
    return scored


def recommend_quotes(
    quotes: Iterable[QuoteInput],
    strategies: Iterable[str] = ("cheapest", "quality", "delivery"),
) -> dict:
    """戦略毎に推奨業者を返す."""
    qs = list(quotes)
    if not qs:
        return {"count": 0, "recommendations": []}
    recs: list[Recommendation] = []
    for strat in strategies:
        weights = _WEIGHTS.get(strat, _WEIGHTS["balanced"])
        scored = _score_quotes(qs, weights)
        recs.append(
            Recommendation(
                strategy=strat,
                weights=weights,
                top=scored[0],
                ranking=scored,
            )
        )
    return {
        "count": len(qs),
        "recommendations": [
            {
                "strategy": r.strategy,
                "weights": r.weights,
                "top": _scored_to_dict(r.top),
                "ranking": [_scored_to_dict(s) for s in r.ranking],
            }
            for r in recs
        ],
    }


def _scored_to_dict(s: ScoredQuote) -> dict:
    return {
        "supplier_id": s.supplier_id,
        "supplier_name": s.supplier_name,
        "unit_price": s.unit_price,
        "delivery_lead_days": s.delivery_lead_days,
        "price_score": s.price_score,
        "rating_score": s.rating_score,
        "delivery_score": s.delivery_score,
        "safety_score": s.safety_score,
        "total_score": s.total_score,
        "total_cost": s.total_cost,
    }

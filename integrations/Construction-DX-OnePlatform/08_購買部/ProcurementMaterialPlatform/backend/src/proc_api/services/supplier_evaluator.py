"""協力会社評価サービス.

評価ロジック:
  5 項目 × 0-100 点 を平均し、5 段階ランクに分類。
    1. on_time_delivery_rate  (納期遵守率: 0-100)
    2. quality_score          (品質スコア: 不良率 → 100 - defect_rate*100)
    3. price_competitiveness  (価格競争力: 市場平均比較で算出 0-100)
    4. safety_record          (安全実績: 事故 0 で 100, 1 件 -20 等)
    5. trade_continuity       (取引継続性: 過去 12 ヶ月の発注回数で正規化)

  平均スコア → ランク (config.rank_thresholds で調整可能)
    >= 90 → S
    >= 80 → A
    >= 65 → B
    >= 50 → C
    その他 → D
"""
from __future__ import annotations

from dataclasses import dataclass

DEFAULT_THRESHOLDS: dict[str, int] = {"S": 90, "A": 80, "B": 65, "C": 50}


@dataclass(frozen=True)
class SupplierMetrics:
    """評価入力の生指標."""

    on_time_delivery_rate: float  # 0.0 - 1.0
    defect_rate: float            # 0.0 - 1.0 (低いほど良い)
    average_price_ratio: float    # 市場平均 / 自社価格 (高いほど安い=良い) 0.5 - 1.5 想定
    accidents_last_year: int      # 件数
    orders_last_year: int         # 件数


@dataclass(frozen=True)
class SupplierEvaluation:
    """評価結果."""

    on_time_score: float
    quality_score: float
    price_score: float
    safety_score: float
    continuity_score: float
    total_score: float
    rank: str


def _clamp(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return max(lower, min(upper, value))


def determine_rank(score: float, thresholds: dict[str, int] | None = None) -> str:
    """総合スコアからランクを決定する."""
    th = thresholds or DEFAULT_THRESHOLDS
    if score >= th["S"]:
        return "S"
    if score >= th["A"]:
        return "A"
    if score >= th["B"]:
        return "B"
    if score >= th["C"]:
        return "C"
    return "D"


def evaluate_supplier(
    metrics: SupplierMetrics, thresholds: dict[str, int] | None = None
) -> SupplierEvaluation:
    """5 項目 × 0-100 点で総合評価."""
    on_time = _clamp(metrics.on_time_delivery_rate * 100)
    quality = _clamp((1.0 - metrics.defect_rate) * 100)
    # 価格: 市場平均比 1.0 で 70 点、1.2 で 100, 0.8 で 40 点を直感的に近似
    price = _clamp(70.0 + (metrics.average_price_ratio - 1.0) * 150.0)
    # 安全: 0 件で 100, 1 件で 80, 2 件で 60, ... 5 件以上で 0
    safety = _clamp(100.0 - metrics.accidents_last_year * 20.0)
    # 継続性: 0 件で 0, 50 件以上で 100 (線形)
    continuity = _clamp(metrics.orders_last_year * 2.0)

    total = (on_time + quality + price + safety + continuity) / 5.0
    rank = determine_rank(total, thresholds)
    return SupplierEvaluation(
        on_time_score=round(on_time, 2),
        quality_score=round(quality, 2),
        price_score=round(price, 2),
        safety_score=round(safety, 2),
        continuity_score=round(continuity, 2),
        total_score=round(total, 2),
        rank=rank,
    )

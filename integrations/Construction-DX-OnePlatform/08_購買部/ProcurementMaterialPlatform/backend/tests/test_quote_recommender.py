"""相見積最適提案テスト."""
from __future__ import annotations

from proc_api.services.quote_recommender import QuoteInput, recommend_quotes


def _sample_quotes() -> list[QuoteInput]:
    return [
        # 安いが評価/納期が悪い
        QuoteInput(1, "格安商事", unit_price=800.0, delivery_lead_days=20,
                   supplier_rating=50.0, safety_score=60.0),
        # 中庸 (バランス型)
        QuoteInput(2, "標準資材", unit_price=1000.0, delivery_lead_days=10,
                   supplier_rating=80.0, safety_score=85.0),
        # 高いが超優良
        QuoteInput(3, "高品質工業", unit_price=1300.0, delivery_lead_days=5,
                   supplier_rating=95.0, safety_score=95.0),
    ]


def test_recommend_cheapest_strategy() -> None:
    res = recommend_quotes(_sample_quotes(), strategies=["cheapest"])
    rec = res["recommendations"][0]
    assert rec["strategy"] == "cheapest"
    # 価格 70% → 1 社が選ばれる
    assert rec["top"]["supplier_id"] == 1


def test_recommend_quality_strategy() -> None:
    res = recommend_quotes(_sample_quotes(), strategies=["quality"])
    rec = res["recommendations"][0]
    assert rec["strategy"] == "quality"
    # quality 重視 (rating 50%) → 3 社が選ばれるはず
    assert rec["top"]["supplier_id"] == 3


def test_recommend_delivery_strategy() -> None:
    res = recommend_quotes(_sample_quotes(), strategies=["delivery"])
    rec = res["recommendations"][0]
    assert rec["strategy"] == "delivery"
    # 納期最短 = 5 日の 3 社が選ばれる
    assert rec["top"]["supplier_id"] == 3
    # ranking は 3 社全部含む
    assert len(rec["ranking"]) == 3

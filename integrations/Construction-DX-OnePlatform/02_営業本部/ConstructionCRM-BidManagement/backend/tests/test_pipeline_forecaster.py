"""pipeline_forecaster 単体テスト."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from crm_api.services.pipeline_forecaster import OpportunityForecastInput, forecast


def test_forecast_aggregates_by_month() -> None:
    ops = [
        OpportunityForecastInput(
            opportunity_id=1,
            win_probability=Decimal("60"),
            expected_amount=Decimal("10000000"),
            expected_close_date=date(2026, 6, 30),
            stage="proposal",
        ),
        OpportunityForecastInput(
            opportunity_id=2,
            win_probability=Decimal("90"),
            expected_amount=Decimal("20000000"),
            expected_close_date=date(2026, 6, 15),
            stage="bid",
        ),
        OpportunityForecastInput(
            opportunity_id=3,
            win_probability=Decimal("0"),  # stage floor 25% 適用
            expected_amount=Decimal("5000000"),
            expected_close_date=date(2026, 7, 10),
            stage="qualified",
        ),
    ]
    r = forecast(ops)
    assert r.total_count == 3
    assert r.total_gross_amount == Decimal("35000000")
    # 加重: 0.6*10M + 0.9*20M + 0.25*5M = 6M + 18M + 1.25M = 25.25M
    assert r.total_weighted_amount == Decimal("25250000.00")
    periods = {b.period for b in r.buckets}
    assert periods == {"2026-06", "2026-07"}


def test_forecast_excludes_lost() -> None:
    ops = [
        OpportunityForecastInput(
            opportunity_id=1,
            win_probability=Decimal("0"),
            expected_amount=Decimal("100"),
            expected_close_date=date(2026, 6, 1),
            stage="lost",
        ),
        OpportunityForecastInput(
            opportunity_id=2,
            win_probability=Decimal("50"),
            expected_amount=Decimal("200"),
            expected_close_date=date(2026, 6, 1),
            stage="proposal",
        ),
    ]
    r = forecast(ops)
    assert r.total_count == 1
    assert r.total_gross_amount == Decimal("200")
    assert r.total_weighted_amount == Decimal("100.00")


def test_forecast_unknown_close_date_bucket() -> None:
    ops = [
        OpportunityForecastInput(
            opportunity_id=1,
            win_probability=Decimal("50"),
            expected_amount=Decimal("1000"),
            expected_close_date=None,
            stage="proposal",
        ),
    ]
    r = forecast(ops)
    assert len(r.buckets) == 1
    assert r.buckets[0].period == "未定"


def test_forecast_small_dataset_uses_weighted_average() -> None:
    """データ点 < 5 では Prophet/sklearn を使わず weighted_average モデル."""
    ops = [
        OpportunityForecastInput(
            opportunity_id=i,
            win_probability=Decimal("50"),
            expected_amount=Decimal("1000000"),
            expected_close_date=date(2026, 6, 1),
            stage="proposal",
        )
        for i in range(1, 4)  # 3件
    ]
    r = forecast(ops)
    assert r.model_used == "weighted_average"
    # 信頼区間は未設定
    assert all(b.lower_bound is None and b.upper_bound is None for b in r.buckets)


def test_forecast_large_dataset_attempts_advanced_model() -> None:
    """データ点 >= 5 では Prophet or sklearn を試行する.

    Prophet/sklearn が無い環境では weighted_average fallback。
    どちらでも model_used が定義されていることを確認。
    """
    ops = [
        OpportunityForecastInput(
            opportunity_id=i,
            win_probability=Decimal("40"),
            expected_amount=Decimal("1000000"),
            expected_close_date=date(2026, m, 1),
            stage="proposal",
        )
        for i, m in enumerate([3, 4, 5, 6, 7, 8], start=1)
    ]
    r = forecast(ops)
    assert r.model_used in ("prophet", "sklearn", "weighted_average")
    # sklearn or prophet なら信頼区間が付くはず
    if r.model_used in ("prophet", "sklearn"):
        assert any(b.lower_bound is not None for b in r.buckets)


def test_forecast_risk_score_calculation() -> None:
    """失注リスクスコアの検算.

    確度 80% / proposal の risk = 0.6 * 0.2 + 0.4 * 0.4 = 0.12 + 0.16 = 0.28
    """
    ops = [
        OpportunityForecastInput(
            opportunity_id=10,
            win_probability=Decimal("80"),
            expected_amount=Decimal("1000"),
            expected_close_date=date(2026, 6, 1),
            stage="proposal",
        )
    ]
    r = forecast(ops)
    assert len(r.risk_scores) == 1
    rs = r.risk_scores[0]
    assert rs.opportunity_id == 10
    assert round(rs.risk_score, 4) == Decimal("0.2800")
    # 全体平均 (lost 除く全件 = 1件)
    assert round(r.average_risk_score, 4) == Decimal("0.2800")

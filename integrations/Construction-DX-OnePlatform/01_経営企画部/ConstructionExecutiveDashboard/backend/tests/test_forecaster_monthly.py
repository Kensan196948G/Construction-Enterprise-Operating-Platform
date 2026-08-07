"""forecast_monthly (Prophet 月次) のテスト.

Prophet が無い環境でも naive-monthly フォールバックで通る形に書く。
"""

from __future__ import annotations

from datetime import date

from exec_api.services.forecaster import (
    TimeseriesPoint,
    forecast_monthly,
)


def _monthly_history(n: int = 12, base: float = 100.0) -> list[TimeseriesPoint]:
    return [TimeseriesPoint(ds=date(2025, m + 1, 1), y=base + m * 2.0) for m in range(n)]


def test_forecast_monthly_returns_12_points_with_95ci() -> None:
    """12ヶ月分の履歴で 12ヶ月先を予測, 95% CI で yhat 区間が成立."""
    points = _monthly_history(12)
    out = forecast_monthly(points, target_metric="profit_margin",
                           horizon_months=12, confidence_interval=0.95)
    assert out.confidence_interval == 0.95
    assert out.horizon_days == 12
    assert out.model_name in ("prophet", "naive-monthly", "naive")
    assert len(out.predictions) == 12
    for p in out.predictions:
        assert p.yhat_lower <= p.yhat <= p.yhat_upper
    # 予測 ds は履歴最終日より後
    assert all(p.ds > points[-1].ds for p in out.predictions)


def test_forecast_monthly_fallback_for_short_history() -> None:
    """履歴 < 5 件で naive-monthly にフォールバック."""
    points = _monthly_history(3, base=50.0)
    out = forecast_monthly(points, target_metric="orders_amount", horizon_months=12)
    # Prophet を呼ばないことを保証 (naive 系)
    assert out.model_name.startswith("naive")
    assert len(out.predictions) == 12
    # 上昇トレンドなので最後の予測値 > 最後の履歴値
    assert out.predictions[-1].yhat >= points[-1].y

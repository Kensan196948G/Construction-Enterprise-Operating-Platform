"""在庫予測テスト."""
from __future__ import annotations

from datetime import date, timedelta

from proc_api.services.inventory_forecaster import forecast_inventory, has_seasonality


def _gen_history(days: int, base: float = 5.0, slope: float = 0.0) -> list[dict]:
    start = date(2026, 1, 1)
    return [
        {"day": start + timedelta(days=i), "quantity": base + slope * i}
        for i in range(days)
    ]


def test_forecast_basic_linear() -> None:
    """十分な履歴で線形予測が出ること."""
    history = _gen_history(60, base=10.0, slope=0.0)
    result = forecast_inventory(history, horizons=(30, 60, 90), use_seasonality=False)
    assert result.method == "linear"
    assert result.sample_size == 60
    assert len(result.points) == 3
    p30 = result.points[0]
    # 平均 10/日 で 30 日 → 約 300 (誤差許容)
    assert 250.0 <= p30.predicted_consumption <= 350.0
    # required_inventory は consumption より大きい (バッファ加算)
    assert p30.required_inventory > p30.predicted_consumption
    # confidence は妥当範囲
    assert 0.0 < p30.confidence <= 1.0


def test_forecast_seasonality_detection() -> None:
    """月毎に大きく変動する履歴で季節性が検出されること."""
    start = date(2025, 1, 1)
    history = []
    for i in range(365):
        d = start + timedelta(days=i)
        # 1-3 月だけ大量消費、それ以外は低消費 → 強い季節性
        qty = 30.0 if d.month <= 3 else 5.0
        history.append({"day": d, "quantity": qty})
    result = forecast_inventory(history, horizons=(30,), use_seasonality=True)
    assert result.seasonality_detected is True
    # has_seasonality 単体でも True
    from proc_api.services.inventory_forecaster import _to_points
    assert has_seasonality(_to_points(history)) is True


def test_forecast_fallback_on_short_history() -> None:
    """履歴 < 3 点 → フォールバック方式."""
    history = [{"day": date(2026, 5, 1), "quantity": 8.0}]
    result = forecast_inventory(history, horizons=(30, 60, 90))
    assert result.method == "fallback"
    assert result.sample_size == 1
    # baseline 8/日 で 30 日 → 240
    assert result.points[0].predicted_consumption == 240.0
    assert result.points[0].confidence < 0.5
    assert result.note is not None

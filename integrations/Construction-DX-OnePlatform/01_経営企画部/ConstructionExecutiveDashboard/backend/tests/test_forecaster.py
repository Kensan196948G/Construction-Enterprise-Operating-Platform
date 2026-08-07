"""forecaster 単体テスト."""

from __future__ import annotations

from datetime import date, timedelta

from exec_api.services.forecaster import (
    ProjectFeatureRow,
    TimeseriesPoint,
    forecast_timeseries,
    predict_deficit_projects,
    predict_workforce_shortage,
)


def test_forecast_timeseries_naive_fallback_with_short_history() -> None:
    """履歴 < 5 件のときは naive 線形外挿にフォールバック."""
    base = date(2026, 1, 1)
    points = [TimeseriesPoint(ds=base + timedelta(days=i), y=10.0 + i) for i in range(3)]
    out = forecast_timeseries(points, target_metric="profit_margin", horizon_days=7,
                              confidence_interval=0.8)
    assert out.model_name in ("naive", "prophet")  # Prophet が無くても OK
    assert len(out.predictions) == 7
    assert all(p.yhat_lower <= p.yhat <= p.yhat_upper for p in out.predictions)


def test_forecast_timeseries_empty_history() -> None:
    """履歴ゼロのとき空の予測を返し summary に注記."""
    out = forecast_timeseries([], target_metric="orders_amount", horizon_days=30)
    assert out.predictions == []
    assert "No historical data" in out.summary


def test_predict_deficit_rule_based_when_no_label() -> None:
    """ラベル無し時はルールベース (原価進捗 - 工期進捗 + ...) で採点される."""
    predict = [
        ProjectFeatureRow(project_id=1, contract_amount=1e8,
                          cost_progress_ratio=0.9, schedule_progress_ratio=0.3,
                          labor_shortage_ratio=0.5, weather_risk_score=0.4),
        ProjectFeatureRow(project_id=2, contract_amount=5e7,
                          cost_progress_ratio=0.2, schedule_progress_ratio=0.5,
                          labor_shortage_ratio=0.0, weather_risk_score=0.0),
    ]
    out = predict_deficit_projects(train=[], predict=predict)
    by_id = {pid: s for pid, s in out}
    # 案件1 は赤字リスク高, 案件2 は順調
    assert by_id[1] > by_id[2]
    assert 0.0 <= by_id[1] <= 1.0
    assert 0.0 <= by_id[2] <= 1.0


def test_predict_workforce_shortage_basic() -> None:
    """需給ギャップ計算."""
    d = date(2026, 6, 1)
    out = predict_workforce_shortage(
        [(d, 100), (d + timedelta(days=30), 120)],
        [(d, 80), (d + timedelta(days=30), 130)],
    )
    assert out[0]["gap"] == 20
    assert abs(out[0]["shortage_ratio"] - 0.2) < 1e-6
    # supply >= demand のときは gap=0
    assert out[1]["gap"] == 0
    assert out[1]["shortage_ratio"] == 0.0

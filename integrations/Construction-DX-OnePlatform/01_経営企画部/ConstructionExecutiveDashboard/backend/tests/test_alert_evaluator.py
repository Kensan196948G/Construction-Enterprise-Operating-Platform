"""alert_evaluator 単体テスト."""

from __future__ import annotations

from exec_api.config import ExecApiSettings
from exec_api.services.alert_evaluator import evaluate


def _settings() -> ExecApiSettings:
    return ExecApiSettings(
        alert_profit_margin_min=0.05,
        alert_deficit_project_max=3,
        alert_accident_max=2,
        alert_overtime_hours_max=45.0,
    )


def test_evaluate_profit_below_threshold_critical_when_negative() -> None:
    """利益率が負のとき critical, 閾値未満 (正) なら warning."""
    s = _settings()
    alerts = evaluate({"average_profit_margin": -0.02}, settings=s)
    profit_alerts = [a for a in alerts if a.kpi_type == "average_profit_margin"]
    assert len(profit_alerts) == 1
    assert profit_alerts[0].level == "critical"

    alerts2 = evaluate({"average_profit_margin": 0.03}, settings=s)
    profit_alerts2 = [a for a in alerts2 if a.kpi_type == "average_profit_margin"]
    assert profit_alerts2[0].level == "warning"


def test_evaluate_accidents_over_threshold_critical() -> None:
    """事故件数が閾値超過で critical."""
    s = _settings()
    alerts = evaluate({"average_profit_margin": 0.1, "accident_count": 5}, settings=s)
    safety = [a for a in alerts if a.category == "safety"]
    assert len(safety) == 1
    assert safety[0].level == "critical"
    assert safety[0].actual_value == 5.0


def test_evaluate_no_alerts_when_all_healthy() -> None:
    """全 KPI が健全なら空リスト."""
    s = _settings()
    alerts = evaluate(
        {
            "average_profit_margin": 0.10,
            "deficit_project_count": 0,
            "accident_count": 0,
            "labor_overtime_avg": 20.0,
        },
        settings=s,
    )
    assert alerts == []

"""欠品アラート強化テスト."""
from __future__ import annotations

from datetime import date, timedelta

from proc_api.services.stockout_alert import (
    ScheduleLink,
    evaluate_stockout_alerts,
)


def _gen_history(days: int, daily: float = 5.0) -> list[dict]:
    start = date(2026, 1, 1)
    return [{"day": start + timedelta(days=i), "quantity": daily} for i in range(days)]


def test_stockout_critical_path_escalates_severity() -> None:
    """クリティカルパス工程は severity が 1 段階上がる."""
    today = date(2026, 5, 1)
    materials = [{
        "material_id": 1,
        "material_code": "STEEL-001",
        "current_qty": 10.0,                 # 不足必至
        "history": _gen_history(60, daily=5.0),
    }]
    schedule = [
        ScheduleLink(
            project_code="P-100",
            process_name="鉄骨建方",
            required_qty=200.0,               # 大量必要
            required_by=today + timedelta(days=5),
            critical_path=True,
        )
    ]
    report = evaluate_stockout_alerts(materials, schedule, today=today)
    assert len(report.alerts) == 1
    alert = report.alerts[0]
    # critical_path で 1 段階上 → high / critical
    assert alert.severity in {"high", "critical"}
    assert alert.predicted_shortage > 0
    # notify_at は 1 日前
    assert alert.notify_at == today + timedelta(days=4)


def test_stockout_no_alert_when_sufficient_stock() -> None:
    """在庫十分 + 期限まで余裕 → アラート発生せず."""
    today = date(2026, 5, 1)
    materials = [{
        "material_id": 2,
        "material_code": "BOLT-100",
        "current_qty": 10000.0,
        "history": _gen_history(60, daily=1.0),
    }]
    schedule = [
        ScheduleLink(
            project_code="P-200",
            process_name="仮設",
            required_qty=50.0,
            required_by=today + timedelta(days=30),
            critical_path=False,
        )
    ]
    report = evaluate_stockout_alerts(materials, schedule, today=today)
    # severity=low かつ shortage=0 なら除外される
    assert report.alerts == []

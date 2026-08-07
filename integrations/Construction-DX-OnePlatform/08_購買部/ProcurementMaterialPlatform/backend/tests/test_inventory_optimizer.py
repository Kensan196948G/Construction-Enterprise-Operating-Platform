"""在庫最適化."""
from __future__ import annotations

from proc_api.services.inventory_optimizer import (
    optimize_reorder_point,
    scan_stock_alerts,
)


def test_reorder_point_basic() -> None:
    # 平均 10 個/日, リードタイム 5 日, バッファ 7 日
    advice = optimize_reorder_point(avg_daily_usage=10.0, lead_time_days=5, buffer_days=7)
    assert advice is not None
    assert advice.safety_stock == 70.0           # 10 * 7
    assert advice.reorder_point == 120.0         # 10*5 + 70
    assert advice.recommended_order_qty == 300.0  # 10 * 30


def test_alerts_classification() -> None:
    invs = [
        # 危険: 5/2.0 = 2.5 日 < 7 日
        {"material_code": "M-001", "warehouse": "W1", "quantity": 5, "reorder_point": 20, "avg_daily_usage": 2.0},
        # WARNING: 30/2.0 = 15 日 > 7 日 だが reorder_point 50 未満
        {"material_code": "M-002", "warehouse": "W1", "quantity": 30, "reorder_point": 50, "avg_daily_usage": 2.0},
        # OK
        {"material_code": "M-003", "warehouse": "W1", "quantity": 200, "reorder_point": 50, "avg_daily_usage": 2.0},
    ]
    alerts = scan_stock_alerts(invs, danger_days=7)
    levels = {a.material_code: a.level for a in alerts}
    assert levels == {"M-001": "DANGER", "M-002": "WARNING", "M-003": "OK"}

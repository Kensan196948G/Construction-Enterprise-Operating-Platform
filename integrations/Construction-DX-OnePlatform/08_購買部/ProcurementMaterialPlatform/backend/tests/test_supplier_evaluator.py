"""協力会社評価ロジック."""
from __future__ import annotations

from proc_api.services.supplier_evaluator import (
    SupplierMetrics,
    determine_rank,
    evaluate_supplier,
)


def test_top_supplier_gets_rank_s() -> None:
    metrics = SupplierMetrics(
        on_time_delivery_rate=1.0,
        defect_rate=0.0,
        average_price_ratio=1.2,   # 市場平均より 20% 安い → 100 点
        accidents_last_year=0,
        orders_last_year=60,        # >50 → 100 点
    )
    ev = evaluate_supplier(metrics)
    assert ev.total_score >= 95
    assert ev.rank == "S"
    assert ev.safety_score == 100.0
    assert ev.on_time_score == 100.0


def test_average_supplier_gets_rank_b_or_c() -> None:
    metrics = SupplierMetrics(
        on_time_delivery_rate=0.85,   # 85
        defect_rate=0.05,              # 95
        average_price_ratio=1.0,       # 70
        accidents_last_year=1,         # 80
        orders_last_year=10,           # 20
    )
    ev = evaluate_supplier(metrics)
    # avg = (85 + 95 + 70 + 80 + 20)/5 = 70 → B
    assert ev.total_score == 70.0
    assert ev.rank == "B"


def test_poor_supplier_gets_rank_d() -> None:
    metrics = SupplierMetrics(
        on_time_delivery_rate=0.4,
        defect_rate=0.5,
        average_price_ratio=0.8,
        accidents_last_year=5,   # 0 点
        orders_last_year=0,
    )
    ev = evaluate_supplier(metrics)
    assert ev.rank == "D"
    assert ev.safety_score == 0.0


def test_determine_rank_boundaries() -> None:
    assert determine_rank(90.0) == "S"
    assert determine_rank(89.99) == "A"
    assert determine_rank(80.0) == "A"
    assert determine_rank(65.0) == "B"
    assert determine_rank(50.0) == "C"
    assert determine_rank(49.99) == "D"

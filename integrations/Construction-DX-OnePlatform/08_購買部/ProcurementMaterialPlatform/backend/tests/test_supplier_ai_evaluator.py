"""協力会社 AI 評価テスト."""
from __future__ import annotations

import os

from proc_api.services.supplier_ai_evaluator import (
    HistoricalRecord,
    evaluate_supplier_with_ai,
)
from proc_api.services.supplier_evaluator import SupplierMetrics


def test_ai_evaluation_falls_back_without_azure_key() -> None:
    """AZURE_OPENAI_API_KEY 未設定 → rule_based テンプレ要約."""
    # 念のため未設定にする
    os.environ.pop("AZURE_OPENAI_API_KEY", None)
    metrics = SupplierMetrics(
        on_time_delivery_rate=0.95,
        defect_rate=0.02,
        average_price_ratio=1.0,
        accidents_last_year=0,
        orders_last_year=30,
    )
    history = [
        HistoricalRecord("2025-Q1", 0.92, 0.03, 0, 10),
        HistoricalRecord("2025-Q2", 0.94, 0.02, 0, 12),
        HistoricalRecord("2025-Q3", 0.96, 0.02, 0, 14),
        HistoricalRecord("2025-Q4", 0.97, 0.01, 0, 16),
    ]
    result = evaluate_supplier_with_ai(
        supplier_id=1,
        supplier_name="優良工業株式会社",
        current_metrics=metrics,
        history=history,
    )
    assert result.powered_by == "rule_based"
    assert result.risk_level in {"low", "medium", "high"}
    # 4 期で納期改善 → trend = improving
    assert result.trend == "improving"
    assert "優良工業株式会社" in result.summary
    assert result.base_rank in {"S", "A", "B", "C", "D"}


def test_ai_risk_high_when_accidents() -> None:
    """事故が多い履歴は risk_level が high になる."""
    metrics = SupplierMetrics(
        on_time_delivery_rate=0.70,
        defect_rate=0.10,
        average_price_ratio=1.0,
        accidents_last_year=3,
        orders_last_year=10,
    )
    history = [
        HistoricalRecord("2025-Q1", 0.70, 0.10, 2, 8),
        HistoricalRecord("2025-Q2", 0.65, 0.12, 1, 6),
        HistoricalRecord("2025-Q3", 0.60, 0.15, 3, 5),
    ]
    result = evaluate_supplier_with_ai(
        supplier_id=2,
        supplier_name="問題ある業者",
        current_metrics=metrics,
        history=history,
    )
    assert result.risk_level == "high"
    # 納期低下傾向
    assert result.trend in {"declining", "stable"}
    assert result.factors["accident_rate"] > 0

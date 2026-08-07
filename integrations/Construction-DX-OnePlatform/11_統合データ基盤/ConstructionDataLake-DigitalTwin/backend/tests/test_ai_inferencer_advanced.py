"""Higher-level AI helpers (kpi summary, alert classifier, risk model)."""
from __future__ import annotations

from data_api.services.ai_inferencer import (
    classify_alert,
    predict_risk,
    summarize_kpi,
)


def test_summarize_kpi_falls_back_to_deterministic_summary_without_openai() -> None:
    snapshot = {"orders": 120, "delivered": 95, "incidents": 2}
    result = summarize_kpi(snapshot)
    assert result["mock"] is True
    assert "summary" in result
    # numeric values must be reflected in the deterministic summary
    assert "orders" in result["summary"]


def test_classify_alert_picks_incident_via_keyword_heuristic() -> None:
    result = classify_alert("クレーンから資材が落下し、軽傷の事故が発生しました")
    assert result["label"] == "incident"
    assert result["mock"] is True
    assert 0 < result["confidence"] <= 1


def test_predict_risk_returns_bounded_stub_when_no_artifact() -> None:
    features = {"hours_overtime": 30, "near_miss": 4, "open_tickets": 2}
    result = predict_risk(features)
    assert result["mock"] is True
    assert 0.0 <= result["score"] <= 1.0
    assert result["method"] == "stub"

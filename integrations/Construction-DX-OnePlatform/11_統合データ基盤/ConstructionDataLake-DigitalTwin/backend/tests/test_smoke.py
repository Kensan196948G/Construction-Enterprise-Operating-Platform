"""Smoke tests: app importable, key services callable."""
from __future__ import annotations


def test_app_factory_importable() -> None:
    from data_api.main import create_app

    app = create_app()
    assert app.title.startswith("Construction DX")
    # Health endpoint registered
    paths = {route.path for route in app.routes if hasattr(route, "path")}
    assert "/health" in paths


def test_iot_parse_basic_message() -> None:
    from data_api.services.iot_ingester import parse_mqtt_message

    rec = parse_mqtt_message(
        "cdx/iot/00000000-0000-0000-0000-000000000001/temperature",
        b'{"value": 23.5, "unit": "C"}',
    )
    assert rec.metric_kind == "temperature"
    assert rec.payload["value"] == 23.5


def test_ai_inferencer_mock_when_no_backend() -> None:
    from data_api.services.ai_inferencer import dispatch

    out = dispatch("classification", inputs={"x1": 1.0, "x2": 2.0}, artifact_uri=None)
    assert out.get("mock") is True
    assert "elapsed_ms" in out


def test_forecast_returns_horizon_points() -> None:
    from data_api.services.ai_inferencer import infer_forecast

    out = infer_forecast([10, 12, 11, 13, 12], horizon=5)
    assert len(out["forecast"]) == 5

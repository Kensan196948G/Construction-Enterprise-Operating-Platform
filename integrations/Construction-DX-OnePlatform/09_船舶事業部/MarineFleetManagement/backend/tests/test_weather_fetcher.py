"""海象取得サービス テスト (httpx モック)."""
from __future__ import annotations

import httpx
import pytest

from marine_api.services.weather_fetcher import (
    DEFAULT_STATIONS,
    fetch_marine_forecast,
)


@pytest.mark.asyncio
async def test_fetch_returns_parsed_data_on_200() -> None:
    """200 レスポンス → 風/波/視程が拾える."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=[
                {
                    "wind": {"speed_mps": 7.5, "direction_deg": 90},
                    "wave": {"height_m": 1.8},
                    "visibility_km": 8.0,
                }
            ],
        )

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        f = await fetch_marine_forecast(
            "130000", area_name="東京湾", base_url="http://mock/", client=client
        )
    assert f.area_code == "130000"
    assert f.source == "JMA"
    assert f.wind_speed_mps == pytest.approx(7.5)
    assert f.wave_height_m == pytest.approx(1.8)
    assert f.visibility_km == pytest.approx(8.0)


@pytest.mark.asyncio
async def test_fetch_falls_back_on_500() -> None:
    """500 エラー時はフォールバック (source=STUB) を返す."""

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="boom")

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        f = await fetch_marine_forecast(
            "270000", area_name="大阪湾", base_url="http://mock/", client=client
        )
    assert f.source == "STUB"
    assert f.wind_speed_mps is not None
    assert f.wave_height_m is not None


def test_default_stations_has_five() -> None:
    """主要観測点が 5 ヶ所定義されている."""
    assert len(DEFAULT_STATIONS) == 5
    names = {n for _, n in DEFAULT_STATIONS}
    assert "東京湾" in names
    assert "大阪湾" in names

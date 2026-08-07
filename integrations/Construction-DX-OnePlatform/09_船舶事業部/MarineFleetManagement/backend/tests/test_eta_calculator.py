"""ETA 計算テスト."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from marine_api.services.eta_calculator import calculate_eta, haversine_nm


def test_haversine_known_distance_tokyo_yokohama() -> None:
    """東京 (35.6762, 139.6503) → 横浜 (35.4437, 139.6380) 約 26 km ≈ 14 NM."""
    nm = haversine_nm(35.6762, 139.6503, 35.4437, 139.6380)
    assert 13.0 < nm < 16.0


def test_eta_normal_conditions() -> None:
    """通常の海象では公称速度のまま計算される."""
    departed = datetime(2026, 5, 22, 0, 0, 0, tzinfo=timezone.utc)
    r = calculate_eta(35.0, 139.0, 35.5, 139.5, speed_knots=10.0, departed_at=departed)
    assert r.effective_speed_knots == 10.0
    assert r.travel_hours > 0
    assert r.eta_utc > departed


def test_eta_slow_speed_takes_longer() -> None:
    """速度が半分なら所要時間が約 2 倍."""
    r10 = calculate_eta(35.0, 139.0, 35.5, 139.5, speed_knots=10.0)
    r5 = calculate_eta(35.0, 139.0, 35.5, 139.5, speed_knots=5.0)
    assert r5.travel_hours == pytest.approx(r10.travel_hours * 2, rel=0.01)


def test_eta_rough_weather_slows_down() -> None:
    """波高 4m (荒天) では係数 1.25 で減速."""
    calm = calculate_eta(35.0, 139.0, 35.5, 139.5, speed_knots=10.0, wave_height_m=0.5)
    rough = calculate_eta(35.0, 139.0, 35.5, 139.5, speed_knots=10.0, wave_height_m=4.0)
    assert rough.effective_speed_knots == pytest.approx(10.0 / 1.25, rel=0.001)
    assert rough.travel_hours > calm.travel_hours


def test_eta_invalid_speed() -> None:
    with pytest.raises(ValueError):
        calculate_eta(35.0, 139.0, 36.0, 140.0, speed_knots=0)

"""燃費計算テスト."""
from __future__ import annotations

import pytest

from marine_api.services.fuel_efficiency import (
    CO2_EMISSION_FACTOR_HEAVY_OIL,
    calculate_efficiency,
)


def test_basic_efficiency() -> None:
    """1000 L を 10h 100 NM 消費 = 100 L/h, 10 L/NM."""
    eff = calculate_efficiency(1000.0, 10.0, 100.0)
    assert eff.liters_per_hour == 100.0
    assert eff.liters_per_nautical_mile == 10.0
    # CO2: 1000 * 3.06 = 3060 kg
    assert eff.co2_kg == pytest.approx(1000.0 * CO2_EMISSION_FACTOR_HEAVY_OIL)


def test_no_distance_returns_none() -> None:
    eff = calculate_efficiency(500.0, 5.0, None)
    assert eff.liters_per_nautical_mile is None
    assert eff.liters_per_hour == 100.0


def test_diesel_uses_different_co2_factor() -> None:
    eff_oil = calculate_efficiency(100.0, 1.0, 10.0, fuel_type="A重油")
    eff_diesel = calculate_efficiency(100.0, 1.0, 10.0, fuel_type="軽油")
    # 軽油の方が排出係数小さい
    assert eff_diesel.co2_kg < eff_oil.co2_kg


def test_invalid_hours() -> None:
    with pytest.raises(ValueError):
        calculate_efficiency(100.0, 0.0, 10.0)

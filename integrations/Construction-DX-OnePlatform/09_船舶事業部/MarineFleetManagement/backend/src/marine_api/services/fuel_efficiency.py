"""燃費計算サービス.

入力:
    - 燃料消費量 (L)
    - 航行時間 (h)
    - 航行距離 (NM)
    - 工事/作業時間 (h)

出力:
    - L/h (時間あたり消費)
    - L/NM (距離あたり消費)
    - CO2 排出量 (kg, A 重油換算: 3.06 kg-CO2/L)
"""
from __future__ import annotations

from dataclasses import dataclass

# IEA / 環境省 排出係数 (A 重油)
CO2_EMISSION_FACTOR_HEAVY_OIL = 3.06  # kg-CO2 / L
CO2_EMISSION_FACTOR_DIESEL = 2.62     # kg-CO2 / L (軽油)


@dataclass(frozen=True)
class FuelEfficiency:
    liters_per_hour: float
    liters_per_nautical_mile: float | None
    co2_kg: float


def calculate_efficiency(
    liters_consumed: float,
    hours: float,
    distance_nm: float | None = None,
    fuel_type: str = "A重油",
) -> FuelEfficiency:
    """燃費 (L/h, L/NM) と CO2 排出量を計算する."""
    if liters_consumed < 0:
        raise ValueError("liters_consumed must be non-negative")
    if hours <= 0:
        raise ValueError("hours must be positive")
    if distance_nm is not None and distance_nm < 0:
        raise ValueError("distance_nm must be non-negative")

    lph = liters_consumed / hours
    lpnm = (liters_consumed / distance_nm) if distance_nm and distance_nm > 0 else None

    factor = CO2_EMISSION_FACTOR_DIESEL if fuel_type == "軽油" else CO2_EMISSION_FACTOR_HEAVY_OIL
    co2 = liters_consumed * factor

    return FuelEfficiency(
        liters_per_hour=round(lph, 3),
        liters_per_nautical_mile=round(lpnm, 3) if lpnm is not None else None,
        co2_kg=round(co2, 2),
    )

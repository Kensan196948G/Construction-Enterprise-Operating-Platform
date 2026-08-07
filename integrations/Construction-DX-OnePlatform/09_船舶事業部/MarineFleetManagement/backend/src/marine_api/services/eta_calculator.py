"""ETA (到着予定時刻) 計算サービス.

現在位置 (lat, lon) + 速度 (knots) + 目的地 (lat, lon) から
大圏距離 (Haversine) を NM で求め、ETA を算出する。
海象 (波高) が高い場合は補正係数で減速する。
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

EARTH_RADIUS_NM = 3440.065  # NM (nautical mile)


@dataclass(frozen=True)
class ETAResult:
    distance_nm: float
    effective_speed_knots: float
    eta_utc: datetime
    travel_hours: float


def haversine_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """2 地点間の大圏距離を NM で返す."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_NM * c


def _weather_factor(wave_height_m: float | None) -> float:
    """波高による速度補正係数 (1.0 = 通常, >1.0 = 減速)."""
    if wave_height_m is None:
        return 1.0
    if wave_height_m < 1.5:
        return 1.0
    if wave_height_m < 3.0:
        return 1.10
    if wave_height_m < 4.5:
        return 1.25
    return 1.50  # 大時化


def calculate_eta(
    current_lat: float,
    current_lon: float,
    dest_lat: float,
    dest_lon: float,
    speed_knots: float,
    departed_at: datetime | None = None,
    wave_height_m: float | None = None,
) -> ETAResult:
    """ETA を計算する.

    Args:
        speed_knots: 公称速度 (例: 巡航速度).
        wave_height_m: 海象補正に使う波高.
        departed_at: 計算基準時刻 (None なら UTC now).
    """
    if speed_knots <= 0:
        raise ValueError("speed_knots must be positive")

    distance = haversine_nm(current_lat, current_lon, dest_lat, dest_lon)
    factor = _weather_factor(wave_height_m)
    effective = speed_knots / factor
    hours = distance / effective if effective > 0 else float("inf")
    base = departed_at or datetime.now(timezone.utc)
    eta = base + timedelta(hours=hours)
    return ETAResult(
        distance_nm=round(distance, 3),
        effective_speed_knots=round(effective, 3),
        eta_utc=eta,
        travel_hours=round(hours, 3),
    )

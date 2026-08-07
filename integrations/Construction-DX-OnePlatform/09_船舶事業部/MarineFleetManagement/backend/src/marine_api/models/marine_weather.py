"""海象データモデル (Timescale hypertable 想定)."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from cdx_db.base import Base
from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class MarineWeather(Base):
    """海象データ (`t_marine_weather`).

    気象庁海上予報 / 民間 API から取得する観測・予報を時系列で保存。
    """

    __tablename__ = "t_marine_weather"

    time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), primary_key=True, nullable=False
    )
    station_code: Mapped[str] = mapped_column(
        String(30), primary_key=True, nullable=False, comment="観測点コード / 予報エリア"
    )
    station_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location: Mapped[str | None] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=True
    )
    wind_speed_mps: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    wind_direction_deg: Mapped[Decimal | None] = mapped_column(Numeric(5, 1), nullable=True)
    wave_height_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    wave_period_s: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    tide_level_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    visibility_km: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    source: Mapped[str] = mapped_column(
        String(20), nullable=False, default="JMA",
        comment="JMA / VENDOR_X / MANUAL",
    )

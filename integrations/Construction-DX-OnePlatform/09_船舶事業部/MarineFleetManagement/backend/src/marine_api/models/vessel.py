"""船舶マスタモデル."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from geoalchemy2 import Geometry
from sqlalchemy import Date, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class Vessel(CommonBase):
    """船舶マスタ (`t_marine_vessel`).

    AIS 連携用に IMO 番号 / MMSI を保持する。
    みらい建設の海上工事ファミリー (起重機船・浚渫船・台船・曳船・作業船) を分類する。
    """

    __tablename__ = "t_marine_vessel"

    vessel_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    vessel_name: Mapped[str] = mapped_column(String(100), nullable=False)
    vessel_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="作業船",
        comment="作業船 / 曳船 / 起重機船 / 浚渫船 / 台船",
    )
    imo_number: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    mmsi: Mapped[str | None] = mapped_column(String(9), nullable=True, index=True)
    # 諸元
    gross_tonnage: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    length_overall_m: Mapped[Decimal | None] = mapped_column(Numeric(7, 2), nullable=True)
    draft_m: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    main_engine_kw: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    build_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    home_port: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # 状態
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active",
        comment="active / in_dock / decommissioned",
    )
    current_location: Mapped[str | None] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=True
    )
    last_known_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

"""船位履歴モデル (Timescale hypertable 想定)."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from cdx_db.base import Base
from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class VesselPosition(Base):
    """船位履歴 (`t_marine_vessel_position`).

    TimescaleDB の hypertable として `time` をパーティションキーに使う前提。
    通常テーブルとは異なり、surrogate id ではなく (time, vessel_id) を主キーとする。
    """

    __tablename__ = "t_marine_vessel_position"

    time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), primary_key=True, nullable=False
    )
    vessel_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_marine_vessel.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    geom: Mapped[str | None] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326), nullable=True,
        comment="WGS84 経緯度 POINT",
    )
    speed_knots: Mapped[Decimal | None] = mapped_column(Numeric(5, 1), nullable=True)
    heading_deg: Mapped[Decimal | None] = mapped_column(Numeric(5, 1), nullable=True)
    source: Mapped[str] = mapped_column(
        String(10), nullable=False, default="AIS",
        comment="AIS / GPS / NMEA / MANUAL",
    )

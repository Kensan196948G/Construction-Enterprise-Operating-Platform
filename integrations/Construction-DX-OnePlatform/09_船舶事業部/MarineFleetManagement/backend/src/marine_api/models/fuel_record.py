"""燃料記録モデル."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class FuelRecord(CommonBase):
    """燃料記録 (`t_marine_fuel_record`).

    給油・残量・燃費 (L/h) を管理する。
    """

    __tablename__ = "t_marine_fuel_record"

    vessel_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_marine_vessel.id", ondelete="CASCADE"), nullable=False
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fuel_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="A重油",
        comment="A重油 / 軽油 / LNG など",
    )
    refuel_liters: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0"), comment="給油量 (L)"
    )
    unit_price: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 2), nullable=True, comment="単価 (円/L)"
    )
    remaining_liters: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True, comment="給油後残量 (L)"
    )
    consumption_liters_per_hour: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 3), nullable=True, comment="燃費 (L/h)"
    )
    engine_hours: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True, comment="積算機関時間 (h)"
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

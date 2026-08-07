"""寄港記録モデル."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class PortCall(CommonBase):
    """寄港記録 (`t_marine_port_call`).

    入港 / 出港日時、停泊目的、入出港諸経費を管理する。
    """

    __tablename__ = "t_marine_port_call"

    vessel_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_marine_vessel.id", ondelete="RESTRICT"), nullable=False
    )
    voyage_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("t_marine_voyage.id", ondelete="SET NULL"), nullable=True
    )
    port_name: Mapped[str] = mapped_column(String(100), nullable=False)
    port_unlocode: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="UN/LOCODE (例: JPYOK 横浜)"
    )
    arrived_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    departed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    purpose: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="積荷 / 揚荷 / 給油 / 待機 / 入渠",
    )
    cost_jpy: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 0), nullable=True, comment="入出港諸経費 (円)"
    )
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

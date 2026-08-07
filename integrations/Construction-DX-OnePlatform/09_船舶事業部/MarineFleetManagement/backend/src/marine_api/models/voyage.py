"""運航計画モデル."""
from __future__ import annotations

from datetime import datetime

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class Voyage(CommonBase):
    """運航計画 (`t_marine_voyage`).

    工事案件と紐付けて、出発地→到着地の計画と実績を管理する。
    """

    __tablename__ = "t_marine_voyage"

    voyage_no: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    vessel_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_marine_vessel.id", ondelete="RESTRICT"), nullable=False
    )
    project_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    departure_port: Mapped[str] = mapped_column(String(100), nullable=False)
    arrival_port: Mapped[str] = mapped_column(String(100), nullable=False)
    planned_departure_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    planned_arrival_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_departure_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    actual_arrival_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="planned",
        comment="planned / departed / in_transit / arrived / canceled",
    )
    purpose: Mapped[str | None] = mapped_column(String(200), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

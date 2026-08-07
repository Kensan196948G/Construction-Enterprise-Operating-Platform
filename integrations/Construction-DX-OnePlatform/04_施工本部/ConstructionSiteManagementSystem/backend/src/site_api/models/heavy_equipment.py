"""重機管理モデル."""
from __future__ import annotations

from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class Equipment(CommonBase):
    """重機 (`t_equipment`)."""

    __tablename__ = "t_equipment"

    equipment_name: Mapped[str] = mapped_column(String(100), nullable=False)
    equipment_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    project_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("t_construction_project.id", ondelete="SET NULL"), nullable=True
    )
    gps_device_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    current_location_wkt: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    operating_hours: Mapped[Decimal | None] = mapped_column(Numeric(10, 1), nullable=True)

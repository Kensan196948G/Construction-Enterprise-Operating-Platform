"""納品検収モデル."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class Delivery(CommonBase):
    """納品 / 検収 (`t_proc_delivery`)."""

    __tablename__ = "t_proc_delivery"

    delivery_no: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_proc_purchase_order.id", ondelete="CASCADE"), nullable=False
    )
    order_item_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_proc_purchase_order_item.id", ondelete="SET NULL"),
        nullable=True,
    )
    delivered_qty: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    defective_qty: Mapped[Decimal] = mapped_column(
        Numeric(15, 4), nullable=False, default=Decimal("0")
    )
    delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    inspected_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    inspector_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    inspector_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="received",
        comment="received / inspected / accepted / rejected",
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

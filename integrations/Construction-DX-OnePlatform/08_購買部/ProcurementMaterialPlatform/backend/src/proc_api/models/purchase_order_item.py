"""発注明細モデル."""
from __future__ import annotations

from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class PurchaseOrderItem(CommonBase):
    """発注明細 (`t_proc_purchase_order_item`)."""

    __tablename__ = "t_proc_purchase_order_item"

    order_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_proc_purchase_order.id", ondelete="CASCADE"), nullable=False
    )
    line_no: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)
    material_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    material_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="個")
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)

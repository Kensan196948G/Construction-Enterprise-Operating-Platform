"""発注書モデル."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class PurchaseOrder(CommonBase):
    """発注書 (`t_proc_purchase_order`).

    協力会社への発注。明細は ``PurchaseOrderItem`` (`t_proc_purchase_order_item`) に分離。
    """

    __tablename__ = "t_proc_purchase_order"

    po_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    request_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("t_proc_purchase_request.id", ondelete="SET NULL"), nullable=True
    )
    supplier_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("t_proc_supplier.id", ondelete="RESTRICT"), nullable=False
    )
    project_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0")
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0")
    )
    delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft",
        comment="draft / issued / in_delivery / delivered / completed / canceled",
    )
    issued_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

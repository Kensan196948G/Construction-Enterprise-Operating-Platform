"""見積明細モデル."""

from __future__ import annotations

from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class QuotationItem(CommonBase):
    """見積明細 (`t_crm_quotation_item`)."""

    __tablename__ = "t_crm_quotation_item"

    quotation_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("t_crm_quotation.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    line_no: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 3), nullable=False, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)

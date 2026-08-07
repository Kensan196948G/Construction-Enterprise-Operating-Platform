"""資材価格履歴モデル."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class PriceHistory(CommonBase):
    """資材価格履歴 (`t_proc_price_history`).

    source: quotation (見積) / contract (契約) / market (相場) / actual (実発注)
    """

    __tablename__ = "t_proc_price_history"

    material_code: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    material_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    supplier_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("t_proc_supplier.id", ondelete="SET NULL"), nullable=True
    )
    unit_price: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="個")
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="actual")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="JPY")

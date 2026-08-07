"""在庫モデル."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column


class Inventory(CommonBase):
    """在庫 (`t_proc_inventory`).

    material_code + warehouse + lot_no を論理キーとする現在在庫スナップショット。
    """

    __tablename__ = "t_proc_inventory"

    material_code: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    material_name: Mapped[str] = mapped_column(String(200), nullable=False)
    warehouse: Mapped[str] = mapped_column(String(50), nullable=False, default="本社倉庫")
    lot_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False, default=Decimal("0"))
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="個")
    reorder_point: Mapped[Decimal | None] = mapped_column(Numeric(15, 4), nullable=True)
    safety_stock: Mapped[Decimal | None] = mapped_column(Numeric(15, 4), nullable=True)
    avg_daily_usage: Mapped[Decimal | None] = mapped_column(Numeric(15, 4), nullable=True)
    last_received_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_stocktake_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    branch_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

"""在庫移動モデル."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class InventoryMovement(CommonBase):
    """在庫移動履歴 (`t_proc_inventory_movement`).

    movement_type:
        in:       入庫 (発注納品 / その他)
        out:      出庫 (現場引渡 / 払い出し)
        transfer: 倉庫間移動
        scrap:    廃棄
    """

    __tablename__ = "t_proc_inventory_movement"

    inventory_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("t_proc_inventory.id", ondelete="SET NULL"), nullable=True
    )
    material_code: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    movement_type: Mapped[str] = mapped_column(String(10), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="個")
    project_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    from_warehouse: Mapped[str | None] = mapped_column(String(50), nullable=True)
    to_warehouse: Mapped[str | None] = mapped_column(String(50), nullable=True)
    movement_date: Mapped[date] = mapped_column(Date, nullable=False)
    operator_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    reference_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

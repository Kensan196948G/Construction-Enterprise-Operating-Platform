"""購買依頼モデル."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from cdx_db.base import CommonBase
from sqlalchemy import BigInteger, Date, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class PurchaseRequest(CommonBase):
    """購買依頼 (`t_proc_purchase_request`).

    現場 / 工事番号からの資材発注依頼。承認WFを経て発注 (PurchaseOrder) に変換される。
    """

    __tablename__ = "t_proc_purchase_request"

    request_no: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    project_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    requester_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    requester_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # 明細 (簡易: JSONB)  [{material_name, qty, unit, est_unit_price}]
    items: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    estimated_total: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0")
    )
    desired_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="draft",
        comment="draft / submitted / approving / approved / rejected / converted",
    )
    current_approval_step: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    total_approval_steps: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    approval_history: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

"""資材マスタ ``t_material``."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from ..base import CommonBase


class Material(CommonBase):
    """資材マスタ。``supplier_id`` は将来導入される仕入先マスタへの参照。

    仕入先マスタは別モジュール (購買部) で定義されるため、ここでは
    外部キー制約を張らず BIGINT のみで保持する。
    """

    __tablename__ = "t_material"

    material_code: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True, index=True, doc="資材コード"
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, doc="資材名")
    category: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True, doc="カテゴリ"
    )
    unit: Mapped[str] = mapped_column(
        String(16), nullable=False, default="個", doc="単位"
    )
    unit_price: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2), nullable=True, doc="単価 (円)"
    )
    supplier_id: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        doc="仕入先 ID (将来の t_supplier への論理参照)",
    )
    latest_price_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, doc="最新単価の取得日時"
    )

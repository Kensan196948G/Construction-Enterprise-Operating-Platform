"""部門マスタ ``t_department``."""

from __future__ import annotations

from datetime import date

from sqlalchemy import BigInteger, Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..base import CommonBase


class Department(CommonBase):
    """部門マスタ。階層構造 (``parent_id`` で自己参照) を持つ。"""

    __tablename__ = "t_department"

    dept_code: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True, index=True, doc="部門コード"
    )
    dept_name: Mapped[str] = mapped_column(String(128), nullable=False, doc="部門名")
    parent_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_department.id", ondelete="RESTRICT"),
        nullable=True,
        doc="親部門 ID",
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, doc="表示順"
    )
    valid_from: Mapped[date | None] = mapped_column(
        Date, nullable=True, doc="有効開始日"
    )
    valid_to: Mapped[date | None] = mapped_column(
        Date, nullable=True, doc="有効終了日"
    )

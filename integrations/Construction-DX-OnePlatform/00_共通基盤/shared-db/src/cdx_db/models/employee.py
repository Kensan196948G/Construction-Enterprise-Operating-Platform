"""従業員マスタ ``t_employee``."""

from __future__ import annotations

from datetime import date

from sqlalchemy import BigInteger, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from ..base import CommonBase


class Employee(CommonBase):
    """従業員マスタ。Entra ID の OID を保持する。"""

    __tablename__ = "t_employee"

    employee_code: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True, index=True, doc="従業員番号"
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False, doc="氏名")
    name_kana: Mapped[str | None] = mapped_column(
        String(128), nullable=True, doc="氏名カナ"
    )
    email: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True, doc="メールアドレス"
    )
    entra_oid: Mapped[str | None] = mapped_column(
        String(64), nullable=True, unique=True, index=True, doc="Entra ID OID"
    )
    dept_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_department.id", ondelete="RESTRICT"),
        nullable=True,
        doc="所属部門 ID",
    )
    branch_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("t_branch.id", ondelete="RESTRICT"),
        nullable=True,
        doc="所属支店 ID",
    )
    position: Mapped[str | None] = mapped_column(
        String(64), nullable=True, doc="役職"
    )
    hire_date: Mapped[date | None] = mapped_column(
        Date, nullable=True, doc="入社日"
    )
    valid_to: Mapped[date | None] = mapped_column(
        Date, nullable=True, doc="退職日 / 有効終了日"
    )

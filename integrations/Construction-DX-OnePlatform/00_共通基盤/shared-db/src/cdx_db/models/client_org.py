"""発注者マスタ ``t_client_org``."""

from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from ..base import CommonBase


class ClientOrg(CommonBase):
    """発注者 (官公庁/民間) マスタ。"""

    __tablename__ = "t_client_org"

    client_code: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True, index=True, doc="発注者コード"
    )
    client_name: Mapped[str] = mapped_column(
        String(255), nullable=False, doc="発注者名"
    )
    client_type: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="private",
        doc="public (官公庁) / private (民間)",
    )
    address: Mapped[str | None] = mapped_column(String(255), nullable=True, doc="住所")
    contact_name: Mapped[str | None] = mapped_column(
        String(128), nullable=True, doc="担当者名"
    )
    contact_email: Mapped[str | None] = mapped_column(
        String(255), nullable=True, doc="担当者メール"
    )
    contact_phone: Mapped[str | None] = mapped_column(
        String(32), nullable=True, doc="担当者電話"
    )

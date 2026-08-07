"""SQLAlchemy 共通基底クラスとミックスイン。

全テーブルに以下を付与する:
- ``id``: BIGINT 自動採番主キー
- ``created_at`` / ``updated_at``: タイムスタンプ (UTC)
- ``deleted_at``: 軟削除フラグ
- ``created_by`` / ``updated_by``: 操作者の employee_code または entra_oid
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """全モデルの基底。"""


class TimestampMixin:
    """作成/更新/軟削除タイムスタンプ。"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="作成日時 (UTC)",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
        doc="更新日時 (UTC)",
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="軟削除日時 (NULL = 有効レコード)",
    )


class AuditMixin:
    """操作者の監査カラム。"""

    created_by: Mapped[str | None] = mapped_column(
        String(128), nullable=True, doc="作成者の employee_code / entra_oid"
    )
    updated_by: Mapped[str | None] = mapped_column(
        String(128), nullable=True, doc="更新者の employee_code / entra_oid"
    )


class PKMixin:
    """BIGINT 自動採番の主キー ``id``。"""

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True, doc="サロゲートキー"
    )


class CommonBase(Base, PKMixin, TimestampMixin, AuditMixin):
    """共通カラムをすべて備えた抽象基底クラス。"""

    __abstract__ = True

"""オフライン同期ログ."""
from __future__ import annotations

from datetime import datetime

from cdx_db.base import CommonBase
from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column


class SyncLog(CommonBase):
    """同期処理ログ (`t_sync_log`)."""

    __tablename__ = "t_sync_log"

    device_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    operation: Mapped[str] = mapped_column(String(20), nullable=False, doc="create/update/delete")
    status: Mapped[str] = mapped_column(String(20), nullable=False, doc="synced/conflict/error")
    client_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    server_timestamp: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    conflict_detail: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

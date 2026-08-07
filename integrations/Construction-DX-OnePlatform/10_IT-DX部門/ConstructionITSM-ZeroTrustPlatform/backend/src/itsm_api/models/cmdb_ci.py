"""CMDB Configuration Item."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, String
from sqlalchemy.dialects.postgresql import INET, JSONB, MACADDR, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from itsm_api.db.session import Base


class CmdbCi(Base):
    __tablename__ = "t_cmdb_item"

    ci_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ci_type: Mapped[str] = mapped_column(String(30), index=True)  # server/pc/network/software/printer
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    serial_number: Mapped[str | None] = mapped_column(String(50))
    manufacturer: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100))
    os: Mapped[str | None] = mapped_column(String(100))
    ip_address: Mapped[str | None] = mapped_column(INET)
    mac_address: Mapped[str | None] = mapped_column(MACADDR)
    location: Mapped[str | None] = mapped_column(String(200))
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    lifecycle_status: Mapped[str] = mapped_column(String(20), default="active")  # active/maintenance/retired
    purchase_date: Mapped[date | None] = mapped_column(Date)
    warranty_end: Mapped[date | None] = mapped_column(Date)
    entra_device_id: Mapped[str | None] = mapped_column(String(200))
    attributes: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

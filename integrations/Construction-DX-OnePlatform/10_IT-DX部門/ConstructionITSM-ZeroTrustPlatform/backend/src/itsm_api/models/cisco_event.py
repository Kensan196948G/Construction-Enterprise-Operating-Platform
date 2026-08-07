"""Cisco SNMP Trap event records (Timescale hypertable)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String, Text
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from itsm_api.db.session import Base


class CiscoEvent(Base):
    __tablename__ = "t_cisco_event"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True, index=True)
    device_ip: Mapped[str | None] = mapped_column(INET)
    device_name: Mapped[str | None] = mapped_column(String(100))
    trap_oid: Mapped[str | None] = mapped_column(String(120))
    severity: Mapped[str | None] = mapped_column(String(20))
    interface: Mapped[str | None] = mapped_column(String(80))
    message: Mapped[str | None] = mapped_column(Text)
    varbinds: Mapped[dict | None] = mapped_column(JSONB)

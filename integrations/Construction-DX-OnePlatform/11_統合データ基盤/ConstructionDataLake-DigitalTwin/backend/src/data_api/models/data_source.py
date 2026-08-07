"""Data source definition (1 row per source system to ingest)."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from data_api.db.session import Base


class SourceType(str, enum.Enum):
    DATABASE = "database"
    API = "api"
    FILE = "file"
    IOT = "iot"


class DataSource(Base):
    __tablename__ = "t_data_source"

    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id: Mapped[str] = mapped_column(String(10), index=True)  # 01..10 prefix
    system_name: Mapped[str] = mapped_column(String(120), nullable=False)
    source_type: Mapped[str] = mapped_column(String(20), nullable=False)
    connection_info: Mapped[dict | None] = mapped_column(JSONB)  # url/host/auth_ref (no secret material)
    schedule_cron: Mapped[str | None] = mapped_column(String(60))  # "0 2 * * *" 等
    description: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    last_ingested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

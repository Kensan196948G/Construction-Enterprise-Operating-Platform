"""Data Lake table catalog registration."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from data_api.db.session import Base


class LakeZone(str, enum.Enum):
    RAW = "raw"
    CURATED = "curated"
    SERVING = "serving"


class DataLakeTable(Base):
    __tablename__ = "t_data_lake_table"

    table_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    zone: Mapped[str] = mapped_column(String(20), nullable=False, index=True, default=LakeZone.CURATED.value)
    schema_def: Mapped[dict | None] = mapped_column(JSONB)  # column name -> sql type
    row_count: Mapped[int | None] = mapped_column(BigInteger)
    partition_keys: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    description: Mapped[str | None] = mapped_column(String(500))
    source_systems: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    last_updated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

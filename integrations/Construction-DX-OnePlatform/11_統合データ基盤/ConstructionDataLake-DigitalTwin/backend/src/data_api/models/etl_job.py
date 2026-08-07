"""ETL job definition."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from data_api.db.session import Base


class EtlJobStatus(str, enum.Enum):
    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    DISABLED = "disabled"


class EtlJob(Base):
    __tablename__ = "t_etl_job"

    job_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("t_data_source.source_id"), index=True
    )
    airflow_dag_id: Mapped[str | None] = mapped_column(String(120))
    transform_steps: Mapped[list[dict] | None] = mapped_column(JSONB)  # ordered transform pipeline
    output_table: Mapped[str] = mapped_column(String(200), nullable=False)
    schedule_cron: Mapped[str | None] = mapped_column(String(60))
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default=EtlJobStatus.IDLE.value, server_default="idle")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

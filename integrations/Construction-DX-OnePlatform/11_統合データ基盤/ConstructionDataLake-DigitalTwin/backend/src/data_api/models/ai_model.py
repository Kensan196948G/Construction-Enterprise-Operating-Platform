"""AI model registry (MLflow-lite catalog)."""
from __future__ import annotations

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from data_api.db.session import Base


class AiModelType(str, enum.Enum):
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    FORECAST = "forecast"
    RAG = "rag"
    ANOMALY = "anomaly"


class AiModelDeployStatus(str, enum.Enum):
    EXPERIMENT = "experiment"
    STAGING = "staging"
    PRODUCTION = "production"
    RETIRED = "retired"


class AiModel(Base):
    __tablename__ = "t_ai_model"

    model_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    version: Mapped[str] = mapped_column(String(40), nullable=False, default="v1")
    model_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    framework: Mapped[str | None] = mapped_column(String(60))  # sklearn / langchain / azure-openai / prophet
    trained_at: Mapped[date | None] = mapped_column(Date)
    metrics: Mapped[dict | None] = mapped_column(JSONB)  # {accuracy: .., f1: .., rmse: ..}
    accuracy: Mapped[float | None] = mapped_column(Float)
    artifact_uri: Mapped[str | None] = mapped_column(String(500))
    deploy_status: Mapped[str] = mapped_column(
        String(20), default=AiModelDeployStatus.EXPERIMENT.value, server_default="experiment"
    )
    description: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

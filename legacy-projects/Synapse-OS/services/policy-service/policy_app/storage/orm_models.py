"""SQLAlchemy ORM models for policy-service."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class PolicyDecisionRecord(Base):
    __tablename__ = "policy_decisions"

    policy_decision_id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    decided_at: Mapped[datetime] = mapped_column(DateTime)
    payload: Mapped[str] = mapped_column(Text)  # full JSON of PolicyDecisionResult

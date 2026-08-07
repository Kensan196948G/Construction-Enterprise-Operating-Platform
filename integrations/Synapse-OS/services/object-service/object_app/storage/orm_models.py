"""SQLAlchemy ORM models for object-service."""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base

if TYPE_CHECKING:
    from ..schemas.issue import Issue


class IssueRecord(Base):
    __tablename__ = "issues"

    object_id: Mapped[str] = mapped_column(String, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String, index=True)
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(50))
    priority: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)
    payload: Mapped[str] = mapped_column(Text)  # full JSON of Issue model

    @classmethod
    def from_issue(cls, issue: "Issue") -> "IssueRecord":  # type: ignore[name-defined]
        return cls(
            object_id=issue.object_id,
            tenant_id=issue.tenant_id,
            title=issue.title,
            status=issue.status.value if hasattr(issue.status, "value") else issue.status,
            priority=issue.priority.value if hasattr(issue.priority, "value") else issue.priority,
            created_at=issue.created_at,
            updated_at=issue.updated_at,
            payload=issue.model_dump_json(),
        )

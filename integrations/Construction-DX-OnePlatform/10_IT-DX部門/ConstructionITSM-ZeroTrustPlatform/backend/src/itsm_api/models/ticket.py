"""ITSM Ticket model (incident/problem/change/request unified)."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from itsm_api.db.session import Base


class TicketType(str, enum.Enum):
    INCIDENT = "incident"
    PROBLEM = "problem"
    CHANGE = "change"
    REQUEST = "request"


class Priority(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"
    CANCELLED = "cancelled"


# State machine: allowed transitions
TICKET_TRANSITIONS: dict[TicketStatus, set[TicketStatus]] = {
    TicketStatus.OPEN: {TicketStatus.ASSIGNED, TicketStatus.CANCELLED},
    TicketStatus.ASSIGNED: {TicketStatus.IN_PROGRESS, TicketStatus.PENDING, TicketStatus.CANCELLED},
    TicketStatus.IN_PROGRESS: {TicketStatus.PENDING, TicketStatus.RESOLVED, TicketStatus.CANCELLED},
    TicketStatus.PENDING: {TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED},
    TicketStatus.RESOLVED: {TicketStatus.CLOSED, TicketStatus.IN_PROGRESS},
    TicketStatus.CLOSED: set(),
    TicketStatus.CANCELLED: set(),
}


def can_transition(current: TicketStatus, target: TicketStatus) -> bool:
    """Return True if a status transition is allowed."""
    return target in TICKET_TRANSITIONS.get(current, set())


class Ticket(Base):
    __tablename__ = "t_itsm_ticket"

    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    ticket_type: Mapped[TicketType] = mapped_column(SAEnum(TicketType, native_enum=False), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[Priority] = mapped_column(SAEnum(Priority, native_enum=False), default=Priority.MEDIUM)
    status: Mapped[TicketStatus] = mapped_column(
        SAEnum(TicketStatus, native_enum=False), default=TicketStatus.OPEN, index=True
    )
    category: Mapped[str | None] = mapped_column(String(50))
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    reporter_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    sla_target: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolution: Mapped[str | None] = mapped_column(Text)
    ai_classified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

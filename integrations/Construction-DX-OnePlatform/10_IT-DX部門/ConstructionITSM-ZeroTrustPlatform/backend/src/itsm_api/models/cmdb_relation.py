"""CMDB CI-CI relations."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from itsm_api.db.session import Base


class RelationType(str, enum.Enum):
    DEPENDS_ON = "depends_on"
    CONTAINS = "contains"
    RUNS_ON = "runs_on"
    CONNECTS_TO = "connects_to"


class CmdbRelation(Base):
    __tablename__ = "t_cmdb_relation"

    relation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_ci_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("t_cmdb_item.ci_id"), nullable=False, index=True
    )
    target_ci_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("t_cmdb_item.ci_id"), nullable=False, index=True
    )
    relation_type: Mapped[RelationType] = mapped_column(
        SAEnum(RelationType, native_enum=False), nullable=False
    )
    description: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

"""Knowledge base articles for RAG over AI HelpDesk."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, Float, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from itsm_api.db.session import Base

try:  # pgvector is optional at the Python level; DB column exists either way
    from pgvector.sqlalchemy import Vector  # type: ignore

    _EMBEDDING_TYPE = Vector(1536)
except Exception:  # noqa: BLE001
    _EMBEDDING_TYPE = ARRAY(Float)


class KnowledgeArticle(Base):
    __tablename__ = "t_knowledge_article"

    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(80), index=True)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    # Embedding vector (pgvector when available; ARRAY(Float) fallback)
    embedding: Mapped[list[float] | None] = mapped_column(_EMBEDDING_TYPE)
    source_ticket_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    author_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

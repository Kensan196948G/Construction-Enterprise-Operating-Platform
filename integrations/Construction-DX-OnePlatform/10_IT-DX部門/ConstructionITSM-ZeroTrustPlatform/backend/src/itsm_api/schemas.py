"""Pydantic schemas (API I/O)."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from itsm_api.models.cmdb_relation import RelationType
from itsm_api.models.ticket import Priority, TicketStatus, TicketType


# --- Tickets ---
class TicketBase(BaseModel):
    ticket_type: TicketType
    title: str
    description: str | None = None
    priority: Priority = Priority.MEDIUM
    category: str | None = None
    assignee_id: uuid.UUID | None = None
    reporter_id: uuid.UUID | None = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: Priority | None = None
    category: str | None = None


class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    resolution: str | None = None


class TicketAssign(BaseModel):
    assignee_id: uuid.UUID


class TicketRead(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: uuid.UUID
    ticket_number: str
    status: TicketStatus
    sla_target: datetime | None = None
    resolved_at: datetime | None = None
    resolution: str | None = None
    created_at: datetime
    updated_at: datetime


# --- CMDB ---
class CiBase(BaseModel):
    ci_type: str
    name: str
    serial_number: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    os: str | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    location: str | None = None
    lifecycle_status: str = "active"
    attributes: dict | None = None


class CiCreate(CiBase):
    pass


class CiRead(CiBase):
    model_config = ConfigDict(from_attributes=True)
    ci_id: uuid.UUID


class RelationCreate(BaseModel):
    source_ci_id: uuid.UUID
    target_ci_id: uuid.UUID
    relation_type: RelationType
    description: str | None = None


class RelationRead(RelationCreate):
    model_config = ConfigDict(from_attributes=True)
    relation_id: uuid.UUID


class TopologyNode(BaseModel):
    id: str
    label: str
    type: str
    status: str


class TopologyEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str


class TopologyGraph(BaseModel):
    nodes: list[TopologyNode]
    edges: list[TopologyEdge]


# --- Knowledge ---
class KnowledgeBase(BaseModel):
    title: str
    category: str | None = None
    tags: list[str] | None = None
    content: str
    summary: str | None = None


class KnowledgeCreate(KnowledgeBase):
    pass


class KnowledgeRead(KnowledgeBase):
    model_config = ConfigDict(from_attributes=True)
    article_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# --- AI HelpDesk ---
class HelpdeskQuery(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = 3


class HelpdeskSource(BaseModel):
    article_id: str
    title: str
    score: float
    snippet: str


class HelpdeskAnswer(BaseModel):
    answer: str
    sources: list[HelpdeskSource]


# --- SLA ---
class SlaReport(BaseModel):
    total: int
    breached: int
    breach_rate: float
    by_priority: dict[str, dict[str, int]]

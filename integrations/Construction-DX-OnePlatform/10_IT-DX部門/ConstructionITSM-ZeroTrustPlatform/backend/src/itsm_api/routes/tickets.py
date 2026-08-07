"""Ticket CRUD + state-machine + SLA assignment."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from itsm_api.db.session import get_db
from itsm_api.deps import get_current_user
from itsm_api.models.ticket import Priority, Ticket, TicketStatus, can_transition
from itsm_api.schemas import (
    TicketAssign,
    TicketCreate,
    TicketRead,
    TicketStatusUpdate,
    TicketUpdate,
)
from itsm_api.services.sla_evaluator import compute_sla_target, is_breached

router = APIRouter(prefix="/api/v1/tickets", tags=["tickets"])


def _new_ticket_number(db: Session) -> str:
    count = db.execute(select(Ticket)).scalars().all()
    return f"INC-{len(count)+1:06d}"


@router.get("", response_model=list[TicketRead])
def list_tickets(
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    priority: Priority | None = None,
    assignee_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[Ticket]:
    stmt = select(Ticket)
    if status_filter:
        stmt = stmt.where(Ticket.status == status_filter)
    if priority:
        stmt = stmt.where(Ticket.priority == priority)
    if assignee_id:
        stmt = stmt.where(Ticket.assignee_id == assignee_id)
    return list(db.execute(stmt).scalars().all())


@router.post("", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Ticket:
    now = datetime.now(UTC)
    t = Ticket(
        ticket_number=_new_ticket_number(db),
        ticket_type=payload.ticket_type,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        category=payload.category,
        assignee_id=payload.assignee_id,
        reporter_id=payload.reporter_id,
        sla_target=compute_sla_target(now, payload.priority),
        status=TicketStatus.ASSIGNED if payload.assignee_id else TicketStatus.OPEN,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.get("/sla-report")
def sla_report(
    db: Session = Depends(get_db), user=Depends(get_current_user)
) -> dict:
    tickets = db.execute(select(Ticket)).scalars().all()
    total = len(tickets)
    breached = sum(1 for t in tickets if is_breached(t.sla_target))
    by_prio: dict[str, dict[str, int]] = {}
    for t in tickets:
        slot = by_prio.setdefault(t.priority.value, {"total": 0, "breached": 0})
        slot["total"] += 1
        if is_breached(t.sla_target):
            slot["breached"] += 1
    return {
        "total": total,
        "breached": breached,
        "breach_rate": (breached / total) if total else 0.0,
        "by_priority": by_prio,
    }


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)) -> Ticket:
    t = db.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    return t


@router.patch("/{ticket_id}", response_model=TicketRead)
def update_ticket(
    ticket_id: uuid.UUID,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Ticket:
    t = db.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(t, field, value)
    if payload.priority and t.created_at:
        t.sla_target = compute_sla_target(t.created_at, payload.priority)
    db.commit()
    db.refresh(t)
    return t


@router.post("/{ticket_id}/assign", response_model=TicketRead)
def assign_ticket(
    ticket_id: uuid.UUID,
    payload: TicketAssign,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Ticket:
    t = db.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    t.assignee_id = payload.assignee_id
    if t.status == TicketStatus.OPEN:
        t.status = TicketStatus.ASSIGNED
    db.commit()
    db.refresh(t)
    return t


@router.post("/{ticket_id}/status", response_model=TicketRead)
def change_status(
    ticket_id: uuid.UUID,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Ticket:
    t = db.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    if not can_transition(t.status, payload.status):
        raise HTTPException(
            status_code=409,
            detail=f"invalid transition: {t.status.value} -> {payload.status.value}",
        )
    t.status = payload.status
    if payload.resolution:
        t.resolution = payload.resolution
    if payload.status == TicketStatus.RESOLVED:
        t.resolved_at = datetime.now(UTC)
    db.commit()
    db.refresh(t)
    return t


@router.post("/{ticket_id}/resolve", response_model=TicketRead)
def resolve_ticket(
    ticket_id: uuid.UUID,
    payload: TicketStatusUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> Ticket:
    payload.status = TicketStatus.RESOLVED
    return change_status(ticket_id, payload, db, user)


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(
    ticket_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)
) -> None:
    t = db.get(Ticket, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="ticket not found")
    db.delete(t)
    db.commit()

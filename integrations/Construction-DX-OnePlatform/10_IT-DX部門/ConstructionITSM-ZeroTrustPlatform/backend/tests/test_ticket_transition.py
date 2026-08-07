"""Unit tests for ticket state-machine transitions."""
from itsm_api.models.ticket import TicketStatus, can_transition


def test_open_can_assign_or_cancel() -> None:
    assert can_transition(TicketStatus.OPEN, TicketStatus.ASSIGNED)
    assert can_transition(TicketStatus.OPEN, TicketStatus.CANCELLED)
    assert not can_transition(TicketStatus.OPEN, TicketStatus.RESOLVED)


def test_resolved_can_close_or_reopen_in_progress() -> None:
    assert can_transition(TicketStatus.RESOLVED, TicketStatus.CLOSED)
    assert can_transition(TicketStatus.RESOLVED, TicketStatus.IN_PROGRESS)
    assert not can_transition(TicketStatus.RESOLVED, TicketStatus.OPEN)


def test_closed_is_terminal() -> None:
    for s in TicketStatus:
        assert not can_transition(TicketStatus.CLOSED, s)


def test_in_progress_to_pending_and_resolved() -> None:
    assert can_transition(TicketStatus.IN_PROGRESS, TicketStatus.PENDING)
    assert can_transition(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED)
    assert not can_transition(TicketStatus.IN_PROGRESS, TicketStatus.ASSIGNED)

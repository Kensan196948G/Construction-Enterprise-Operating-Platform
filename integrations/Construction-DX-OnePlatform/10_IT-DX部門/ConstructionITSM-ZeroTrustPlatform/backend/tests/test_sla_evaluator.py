"""SLA business-hour math tests."""
from datetime import UTC, datetime

from itsm_api.models.ticket import Priority
from itsm_api.services.sla_evaluator import (
    add_business_minutes,
    compute_sla_target,
    is_breached,
)


def test_simple_within_day() -> None:
    # Monday 10:00 + 60 min -> 11:00
    start = datetime(2026, 5, 18, 10, 0, tzinfo=UTC)  # Mon
    out = add_business_minutes(start, 60)
    assert out.hour == 11 and out.minute == 0


def test_skip_weekend() -> None:
    # Friday 17:00 + 120 min (only 60 min before 18:00) -> Mon 10:00
    start = datetime(2026, 5, 22, 17, 0, tzinfo=UTC)  # Fri
    out = add_business_minutes(start, 120)
    assert out.weekday() == 0  # Monday
    assert out.hour == 10


def test_starts_outside_window() -> None:
    # Wed 07:00 + 60min should roll to 09:00 -> 10:00
    start = datetime(2026, 5, 20, 7, 0, tzinfo=UTC)
    out = add_business_minutes(start, 60)
    assert out.hour == 10


def test_compute_sla_target_critical() -> None:
    start = datetime(2026, 5, 18, 9, 0, tzinfo=UTC)  # Mon
    target = compute_sla_target(start, Priority.CRITICAL)
    # 240 min = 4h -> 13:00 same day
    assert target.hour == 13


def test_is_breached() -> None:
    past = datetime(2020, 1, 1, tzinfo=UTC)
    future = datetime(2099, 1, 1, tzinfo=UTC)
    assert is_breached(past)
    assert not is_breached(future)

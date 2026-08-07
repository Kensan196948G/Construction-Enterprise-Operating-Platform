"""SLA evaluation with simplified business-hour awareness.

Business hours: Monday-Friday, 09:00-18:00 (local).
Adds `business_minutes` minutes onto a starting datetime, skipping
non-business periods. Used to compute SLA target deadlines.
"""
from __future__ import annotations

from datetime import datetime, time, timedelta

from itsm_api.config import get_settings
from itsm_api.models.ticket import Priority

# Default response/resolution minutes per priority (used as fallback if no SLA contract)
DEFAULT_RESPONSE_MIN: dict[Priority, int] = {
    Priority.CRITICAL: 15,
    Priority.HIGH: 60,
    Priority.MEDIUM: 240,
    Priority.LOW: 480,
}
DEFAULT_RESOLUTION_MIN: dict[Priority, int] = {
    Priority.CRITICAL: 240,        # 4h
    Priority.HIGH: 8 * 60,         # 8h
    Priority.MEDIUM: 3 * 9 * 60,   # 3 business days
    Priority.LOW: 5 * 9 * 60,      # 5 business days
}


def _is_business_day(dt: datetime) -> bool:
    return dt.weekday() < 5  # Mon-Fri


def _business_window(dt: datetime) -> tuple[datetime, datetime]:
    """Return business window (start, end) for the given date."""
    settings = get_settings()
    start = datetime.combine(dt.date(), time(hour=settings.business_hour_start), tzinfo=dt.tzinfo)
    end = datetime.combine(dt.date(), time(hour=settings.business_hour_end), tzinfo=dt.tzinfo)
    return start, end


def add_business_minutes(start: datetime, minutes: int) -> datetime:
    """Add business minutes to `start`, skipping nights/weekends.

    Algorithm: iterate day by day, taking from current day's business window
    until `minutes` is exhausted. Robust to starts outside the window.
    """
    remaining = minutes
    cursor = start
    while remaining > 0:
        if not _is_business_day(cursor):
            # Jump to next day 09:00
            next_day = (cursor + timedelta(days=1)).replace(
                hour=get_settings().business_hour_start, minute=0, second=0, microsecond=0
            )
            cursor = next_day
            continue
        win_start, win_end = _business_window(cursor)
        if cursor < win_start:
            cursor = win_start
        if cursor >= win_end:
            # roll to next day
            cursor = (cursor + timedelta(days=1)).replace(
                hour=get_settings().business_hour_start, minute=0, second=0, microsecond=0
            )
            continue
        available = int((win_end - cursor).total_seconds() // 60)
        if remaining <= available:
            return cursor + timedelta(minutes=remaining)
        remaining -= available
        cursor = win_end  # exhaust day; loop will advance
    return cursor


def compute_sla_target(
    created_at: datetime,
    priority: Priority,
    resolution_minutes: int | None = None,
) -> datetime:
    minutes = resolution_minutes or DEFAULT_RESOLUTION_MIN[priority]
    return add_business_minutes(created_at, minutes)


def is_breached(sla_target: datetime | None, now: datetime | None = None) -> bool:
    if sla_target is None:
        return False
    return (now or datetime.now(sla_target.tzinfo)) > sla_target

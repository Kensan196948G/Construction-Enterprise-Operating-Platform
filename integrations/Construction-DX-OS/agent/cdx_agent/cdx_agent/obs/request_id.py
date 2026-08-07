"""Request-id generation and propagation for cdx-agent.

Unlike the server, the agent is an *originator* of request-ids — every
drain() call is a logical "unit of work" that may emit multiple HTTP
POSTs, all correlated by the same id. The id is attached to outgoing
requests via ``X-Request-Id`` so cdx-server's middleware echoes it,
making a single drain traceable across both sides of the wire.

We still use ``contextvars.ContextVar`` for parity with the server.
The agent is synchronous today, but plumbing the id through contextvars
keeps the migration to async (Phase 2 likely) a no-op for loggers.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar

# Default is None (not "-") so we can distinguish "nothing was bound" from
# a legitimate caller-supplied value of "-" (some proxies use it as a
# placeholder). Formatters display None as "-" for readability.
REQUEST_ID: ContextVar[str | None] = ContextVar("cdx_agent_request_id", default=None)
HEADER_NAME = "X-Request-Id"


def current_request_id() -> str | None:
    return REQUEST_ID.get()


def display_request_id() -> str:
    """For log / CLI display: maps None → "-"; otherwise the bound value."""
    rid = REQUEST_ID.get()
    return rid if rid is not None else "-"


def new_request_id() -> str:
    return uuid.uuid4().hex


@contextmanager
def request_scope(request_id: str | None = None) -> Iterator[str]:
    """Bind a request-id for the duration of a ``with`` block.

    If ``request_id`` is None, a fresh UUID4 hex is generated.  Yields the
    bound id so the caller can attach it to outgoing headers.
    """
    rid = request_id if request_id is not None else new_request_id()
    token = REQUEST_ID.set(rid)
    try:
        yield rid
    finally:
        REQUEST_ID.reset(token)

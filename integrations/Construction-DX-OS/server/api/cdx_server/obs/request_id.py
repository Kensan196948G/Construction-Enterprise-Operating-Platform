"""Request-id ContextVar + ASGI middleware.

Uses ``contextvars.ContextVar`` (not thread-locals) so the correlation
id survives async handoffs inside FastAPI / Starlette. Every request
gets a UUID4 unless the caller supplies ``X-Request-Id`` — in which case
we echo it back, enabling end-to-end tracing across the cdx-agent ↔
cdx-server boundary once the agent starts attaching ids in Phase 2.
"""

from __future__ import annotations

import uuid
from collections.abc import Awaitable, Callable
from contextvars import ContextVar

REQUEST_ID: ContextVar[str] = ContextVar("cdx_request_id", default="-")
HEADER_NAME = "x-request-id"
MAX_INBOUND_LENGTH = 128  # reject absurd values defensively


def current_request_id() -> str:
    return REQUEST_ID.get()


def _extract_inbound(scope: dict) -> str | None:
    for name, value in scope.get("headers", []) or []:
        if name == HEADER_NAME.encode():
            decoded = value.decode("latin-1", errors="replace").strip()
            if 1 <= len(decoded) <= MAX_INBOUND_LENGTH and decoded.isprintable():
                return decoded
    return None


class RequestIDMiddleware:
    """ASGI middleware that assigns / propagates ``X-Request-Id``."""

    def __init__(self, app: Callable[..., Awaitable]):
        self.app = app

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        rid = _extract_inbound(scope) or uuid.uuid4().hex
        token = REQUEST_ID.set(rid)

        async def send_with_rid(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers") or [])
                headers.append((HEADER_NAME.encode(), rid.encode()))
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_with_rid)
        finally:
            REQUEST_ID.reset(token)

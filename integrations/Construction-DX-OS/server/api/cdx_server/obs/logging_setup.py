"""JSON log formatter + one-line setup helper.

The formatter emits a single JSON object per record with predictable keys
so downstream log pipelines (journald → fluent-bit → ClickHouse) can index
without parsing free-form text. Request-id is picked up from the
``cdx_server.obs.request_id.REQUEST_ID`` ContextVar so any handler called
inside a request inherits the correlation id automatically.

Sensitive keys are redacted before emission so an accidental
``logger.debug(..., extra={"shared_secret": ...})`` cannot leak verbatim.

Coexistence with cdx-agent's configure_logging: when both packages are
imported together (contract tests), each side's handler is distinguished
by a unique marker attribute (``_cdx_json`` vs ``_cdx_agent``). Installation
preserves foreign-marker handlers so neither side evicts the other.

Usage::

    from cdx_server.obs.logging_setup import configure_logging
    configure_logging()

Called from ``cdx_server.app.create_app`` at startup.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime

from cdx_server.obs.request_id import REQUEST_ID

_RESERVED = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "message",
    "module",
    "msecs",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "thread",
    "threadName",
    "taskName",
}

_SENSITIVE_KEYS = frozenset(
    {
        "shared_secret",
        "secret",
        "password",
        "passwd",
        "token",
        "api_key",
        "apikey",
        "authorization",
        "registration_token",
    }
)
_REDACTED = "[REDACTED]"


def _sanitise(key: str, value: object) -> object:
    if key.lower() in _SENSITIVE_KEYS:
        return _REDACTED
    return value


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "ts": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": REQUEST_ID.get(),
            "service": "cdx-server",
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)

        for key, value in record.__dict__.items():
            if key in _RESERVED or key.startswith("_"):
                continue
            safe_value = _sanitise(key, value)
            try:
                json.dumps(safe_value)
                payload[key] = safe_value
            except (TypeError, ValueError):
                payload[key] = repr(safe_value) if safe_value is _REDACTED else repr(value)

        return json.dumps(payload, ensure_ascii=False, sort_keys=True)


# Markers used by peer packages (cdx-agent) so we don't evict each other's
# handlers when both are installed in the same venv.
_PEER_MARKERS = ("_cdx_json", "_cdx_agent")


def configure_logging(level: int = logging.INFO, stream=None) -> None:
    """Configure the root logger with the JSON formatter.

    Idempotent: if our handler is already installed we return early.
    Foreign handlers (e.g. cdx-agent's handler in a contract-test venv)
    are preserved.
    """
    root = logging.getLogger()
    for handler in root.handlers:
        if getattr(handler, "_cdx_json", False):
            return

    handler = logging.StreamHandler(stream or sys.stderr)
    handler.setFormatter(JsonFormatter())
    handler._cdx_json = True  # type: ignore[attr-defined]

    # Keep peer handlers; drop handlers that are neither ours nor a peer's.
    preserved = [
        h for h in root.handlers if any(getattr(h, marker, False) for marker in _PEER_MARKERS)
    ]
    root.handlers = [*preserved, handler]
    root.setLevel(level)

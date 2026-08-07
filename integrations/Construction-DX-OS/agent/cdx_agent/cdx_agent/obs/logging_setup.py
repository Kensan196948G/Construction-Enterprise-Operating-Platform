"""Logging configuration for cdx-agent.

Two output modes, selected by the ``CDX_LOG_FORMAT`` environment variable:

- ``plain`` (default): classic ``time level name: message`` text. Works
  naturally with systemd journald, which structures the message itself.
- ``json``: one JSON object per record with ts/level/logger/msg/request_id/
  device_id, for pipelines that parse JSON upstream (Fluent Bit, Vector).

We keep the keys identical to :mod:`cdx_server.obs.logging_setup` so a
unified log pipeline can index both sides of the wire by the same schema.

Sensitive keys are redacted before emission so an accidental
``logger.debug(..., extra={"shared_secret": ...})`` cannot leak verbatim.

Coexistence with cdx-server's configure_logging: when both packages are
imported together (contract tests), each side's handler is distinguished by
a unique marker attribute (``_cdx_agent`` vs ``_cdx_json``). Installation
preserves foreign-marker handlers so neither side evicts the other.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import warnings
from datetime import UTC, datetime

from cdx_agent.obs.request_id import REQUEST_ID

_RESERVED = {
    "args", "asctime", "created", "exc_info", "exc_text", "filename",
    "funcName", "levelname", "levelno", "lineno", "message", "module",
    "msecs", "msg", "name", "pathname", "process", "processName",
    "relativeCreated", "stack_info", "thread", "threadName", "taskName",
}

# Keys whose values must never be rendered verbatim in logs.
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
        rid = REQUEST_ID.get()
        payload: dict[str, object] = {
            "ts": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "request_id": rid if rid is not None else "-",
            "service": "cdx-agent",
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


class PlainRequestIDFormatter(logging.Formatter):
    """Classic one-line formatter, augmented with the bound request-id."""

    default_fmt = "%(asctime)s %(levelname)-5s [%(request_id)s] %(name)s: %(message)s"

    def __init__(self) -> None:
        super().__init__(fmt=self.default_fmt)

    def format(self, record: logging.LogRecord) -> str:
        rid = REQUEST_ID.get()
        record.request_id = rid if rid is not None else "-"
        return super().format(record)


def _build_formatter(mode: str) -> logging.Formatter:
    if mode.lower() == "json":
        return JsonFormatter()
    return PlainRequestIDFormatter()


def _resolve_level(level_name: str | None) -> int:
    """Resolve a log-level name to its numeric value, warning on typos."""
    if not level_name:
        return logging.INFO
    candidate = level_name.strip().upper()
    value = getattr(logging, candidate, None)
    if isinstance(value, int):
        return value
    warnings.warn(
        f"Unknown CDX_LOG_LEVEL={level_name!r}; falling back to INFO",
        stacklevel=2,
    )
    return logging.INFO


# Markers used by peer packages (cdx-server) so we don't evict each other's
# handlers when both are installed in the same venv (contract tests).
_PEER_MARKERS = ("_cdx_agent", "_cdx_json")


def configure_logging(level: int | None = None, stream=None, mode: str | None = None) -> None:
    """Configure the root logger for the agent.

    Idempotent: installing our handler twice is a no-op, so CLI subcommands
    can call this without stacking handlers. Foreign handlers (e.g. the
    cdx-server JSON handler in a contract-test venv) are preserved.
    """
    effective_level = level if level is not None else _resolve_level(os.environ.get("CDX_LOG_LEVEL"))
    effective_mode = mode or os.environ.get("CDX_LOG_FORMAT", "plain")

    root = logging.getLogger()
    for handler in root.handlers:
        if getattr(handler, "_cdx_agent", False):
            # Swap the formatter if the mode changed between configure calls.
            handler.setFormatter(_build_formatter(effective_mode))
            root.setLevel(effective_level)
            return

    handler = logging.StreamHandler(stream or sys.stderr)
    handler.setFormatter(_build_formatter(effective_mode))
    handler._cdx_agent = True  # type: ignore[attr-defined]

    # Keep peer handlers (e.g. cdx-server's JSON handler marked _cdx_json),
    # drop any stray handlers that are neither ours nor a peer's.
    preserved = [
        h for h in root.handlers
        if any(getattr(h, marker, False) for marker in _PEER_MARKERS)
    ]
    root.handlers = [*preserved, handler]
    root.setLevel(effective_level)

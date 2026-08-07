"""Tests for cdx_agent.obs.logging_setup."""

from __future__ import annotations

import io
import json
import logging

from cdx_agent.obs.logging_setup import JsonFormatter, PlainRequestIDFormatter, configure_logging
from cdx_agent.obs.request_id import request_scope


def _make_record(msg: str = "hello") -> logging.LogRecord:
    return logging.LogRecord(
        name="cdx_agent.test", level=logging.INFO, pathname=__file__, lineno=1,
        msg=msg, args=(), exc_info=None,
    )


def test_json_formatter_core_keys():
    data = json.loads(JsonFormatter().format(_make_record("hi")))
    assert data["service"] == "cdx-agent"
    assert data["level"] == "INFO"
    assert data["logger"] == "cdx_agent.test"
    assert data["msg"] == "hi"
    assert data["request_id"] == "-"


def test_json_formatter_picks_up_request_id():
    with request_scope("trace-xyz"):
        data = json.loads(JsonFormatter().format(_make_record()))
    assert data["request_id"] == "trace-xyz"


def test_json_formatter_extras():
    rec = _make_record()
    rec.device_id = "dev-1"
    rec.sent = 3
    data = json.loads(JsonFormatter().format(rec))
    assert data["device_id"] == "dev-1"
    assert data["sent"] == 3


def test_plain_formatter_includes_request_id():
    with request_scope("trace-pqr"):
        line = PlainRequestIDFormatter().format(_make_record("hi"))
    assert "[trace-pqr]" in line
    assert "hi" in line


def test_configure_logging_is_idempotent():
    stream = io.StringIO()
    configure_logging(stream=stream, mode="json")
    configure_logging(stream=stream, mode="json")  # second call must not stack
    root = logging.getLogger()
    handlers = [h for h in root.handlers if getattr(h, "_cdx_agent", False)]
    assert len(handlers) == 1


def test_configure_logging_respects_mode_switch():
    stream = io.StringIO()
    configure_logging(stream=stream, mode="plain")
    configure_logging(stream=stream, mode="json")  # swap formatter in-place
    root = logging.getLogger()
    handler = next(h for h in root.handlers if getattr(h, "_cdx_agent", False))
    assert isinstance(handler.formatter, JsonFormatter)

"""Tests for cdx_server.obs.logging_setup.JsonFormatter."""

from __future__ import annotations

import json
import logging

from cdx_server.obs.logging_setup import JsonFormatter
from cdx_server.obs.request_id import REQUEST_ID


def _make_record(msg: str = "hello", level: int = logging.INFO) -> logging.LogRecord:
    return logging.LogRecord(
        name="cdx.test",
        level=level,
        pathname=__file__,
        lineno=1,
        msg=msg,
        args=(),
        exc_info=None,
    )


def test_formatter_emits_valid_json_with_core_keys():
    out = JsonFormatter().format(_make_record("hi"))
    data = json.loads(out)
    assert data["level"] == "INFO"
    assert data["logger"] == "cdx.test"
    assert data["msg"] == "hi"
    assert data["request_id"] == "-"  # default when no middleware ran


def test_formatter_picks_up_request_id_from_contextvar():
    token = REQUEST_ID.set("trace-xyz")
    try:
        out = JsonFormatter().format(_make_record())
    finally:
        REQUEST_ID.reset(token)
    assert json.loads(out)["request_id"] == "trace-xyz"


def test_formatter_serialises_extra_fields():
    record = _make_record()
    record.device_id = "dev-42"  # emulates logger.info(..., extra={"device_id": ...})
    record.bucket = 60
    data = json.loads(JsonFormatter().format(record))
    assert data["device_id"] == "dev-42"
    assert data["bucket"] == 60


def test_formatter_falls_back_to_repr_for_unserialisable_extras():
    record = _make_record()
    record.weird = object()  # not json-serialisable
    data = json.loads(JsonFormatter().format(record))
    # Non-serialisable extras are captured via repr, never crash the formatter.
    assert "object object" in str(data.get("weird", ""))

"""Tests for sensitive-key redaction in cdx-server's JSON formatter."""

from __future__ import annotations

import json
import logging

from cdx_server.obs.logging_setup import JsonFormatter


def _record(**extras) -> logging.LogRecord:
    rec = logging.LogRecord(
        name="cdx_server.test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="hi",
        args=(),
        exc_info=None,
    )
    for k, v in extras.items():
        setattr(rec, k, v)
    return rec


def test_shared_secret_is_redacted():
    data = json.loads(JsonFormatter().format(_record(shared_secret="super-secret")))
    assert data["shared_secret"] == "[REDACTED]"
    assert "super-secret" not in json.dumps(data)


def test_bearer_token_is_redacted():
    data = json.loads(JsonFormatter().format(_record(authorization="Bearer xyz")))
    assert data["authorization"] == "[REDACTED]"


def test_non_sensitive_extras_pass_through():
    data = json.loads(JsonFormatter().format(_record(device_id="dev-1")))
    assert data["device_id"] == "dev-1"


def test_service_tag_is_cdx_server():
    """Schema parity check: agent emits service=cdx-agent; server = cdx-server."""
    data = json.loads(JsonFormatter().format(_record()))
    assert data["service"] == "cdx-server"

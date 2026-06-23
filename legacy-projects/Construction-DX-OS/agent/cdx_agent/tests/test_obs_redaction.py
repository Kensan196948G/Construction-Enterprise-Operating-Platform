"""Tests for sensitive-key redaction in the JSON formatter."""

from __future__ import annotations

import json
import logging
import warnings

from cdx_agent.obs.logging_setup import JsonFormatter, _resolve_level


def _record(**extras) -> logging.LogRecord:
    rec = logging.LogRecord(
        name="cdx_agent.test",
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


def test_shared_secret_key_is_redacted():
    data = json.loads(JsonFormatter().format(_record(shared_secret="super-secret")))
    assert data["shared_secret"] == "[REDACTED]"
    assert "super-secret" not in json.dumps(data)


def test_authorization_header_is_redacted():
    data = json.loads(JsonFormatter().format(_record(authorization="Bearer xyz")))
    assert data["authorization"] == "[REDACTED]"


def test_registration_token_is_redacted():
    data = json.loads(JsonFormatter().format(_record(registration_token="abc")))
    assert data["registration_token"] == "[REDACTED]"


def test_redaction_is_case_insensitive():
    data = json.loads(JsonFormatter().format(_record(API_KEY="xyz")))
    assert data["API_KEY"] == "[REDACTED]"


def test_non_sensitive_keys_pass_through():
    data = json.loads(JsonFormatter().format(_record(device_id="dev-1", count=3)))
    assert data["device_id"] == "dev-1"
    assert data["count"] == 3


def test_resolve_level_accepts_standard_names():
    assert _resolve_level("DEBUG") == logging.DEBUG
    assert _resolve_level("WARNING") == logging.WARNING


def test_resolve_level_is_case_insensitive():
    assert _resolve_level("debug") == logging.DEBUG


def test_resolve_level_warns_on_typo():
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        result = _resolve_level("DEBG")
    assert result == logging.INFO
    assert any("Unknown CDX_LOG_LEVEL" in str(w.message) for w in caught)


def test_resolve_level_none_returns_info():
    assert _resolve_level(None) == logging.INFO

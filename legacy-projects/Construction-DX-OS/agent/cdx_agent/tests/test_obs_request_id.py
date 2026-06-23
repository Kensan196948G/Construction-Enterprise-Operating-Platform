"""Tests for cdx_agent.obs.request_id."""

from __future__ import annotations

import re

from cdx_agent.obs.request_id import (
    REQUEST_ID,
    current_request_id,
    display_request_id,
    new_request_id,
    request_scope,
)

HEX_RE = re.compile(r"^[0-9a-f]{32}$")


def test_default_is_none():
    # outside any request_scope, the ContextVar is None so we can distinguish
    # "nothing bound" from a caller who explicitly passes the literal "-".
    assert current_request_id() is None


def test_new_request_id_is_uuid4_hex():
    rid = new_request_id()
    assert HEX_RE.match(rid)
    assert rid != new_request_id()


def test_scope_binds_and_resets():
    before = REQUEST_ID.get()
    with request_scope("trace-abc") as rid:
        assert rid == "trace-abc"
        assert REQUEST_ID.get() == "trace-abc"
    assert REQUEST_ID.get() == before


def test_scope_auto_generates_when_none():
    with request_scope() as rid:
        assert HEX_RE.match(rid)
        assert REQUEST_ID.get() == rid


def test_nested_scopes_stack_and_restore():
    with request_scope("outer"):
        assert REQUEST_ID.get() == "outer"
        with request_scope("inner"):
            assert REQUEST_ID.get() == "inner"
        assert REQUEST_ID.get() == "outer"
    assert REQUEST_ID.get() is None


def test_display_request_id_outside_scope_returns_dash():
    assert display_request_id() == "-"


def test_display_request_id_inside_scope_returns_bound_id():
    with request_scope("display-test"):
        assert display_request_id() == "display-test"


def test_literal_dash_is_preserved_not_dropped():
    """A caller-supplied '-' is a legitimate value (some proxies use it as a
    placeholder). The scope must preserve it, not collapse to absent."""
    with request_scope("-") as rid:
        assert rid == "-"
        assert REQUEST_ID.get() == "-"

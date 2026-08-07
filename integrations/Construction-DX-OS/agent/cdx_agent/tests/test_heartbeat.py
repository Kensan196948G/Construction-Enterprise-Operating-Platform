"""Tests for cdx_agent.heartbeat."""

from __future__ import annotations

from cdx_agent import __version__
from cdx_agent.heartbeat import Heartbeat, build


def test_build_returns_heartbeat_with_given_device_id():
    hb = build("dev-x")
    assert isinstance(hb, Heartbeat)
    assert hb.device_id == "dev-x"
    assert hb.kind == "heartbeat"


def test_build_embeds_agent_version():
    hb = build("dev-x")
    assert hb.agent_version == __version__


def test_build_accepts_fixed_now():
    hb = build("dev-x", now=0.0)
    # epoch formatted in local tz → non-empty string
    assert hb.sent_at
    assert "1970" in hb.sent_at


def test_heartbeat_is_json_serialisable():
    import json

    hb = build("dev-x", now=0.0)
    payload = json.loads(json.dumps(hb.to_dict()))
    assert payload["kind"] == "heartbeat"
    assert payload["device_id"] == "dev-x"

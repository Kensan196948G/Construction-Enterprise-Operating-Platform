"""Tests that configure_logging preserves peer-package handlers.

Contract tests install both cdx_agent and cdx_server in the same venv.
Each side's configure_logging() would previously reset root.handlers to
``[self]`` — silently evicting the peer. This test reproduces the scenario
and asserts both markers coexist after both configure_logging() calls.
"""

from __future__ import annotations

import io
import logging

from cdx_agent.obs.logging_setup import configure_logging as agent_configure


def test_agent_setup_preserves_foreign_marker_handlers():
    # Simulate cdx-server having already installed its handler.
    fake_server_handler = logging.StreamHandler(io.StringIO())
    fake_server_handler._cdx_json = True  # type: ignore[attr-defined]

    root = logging.getLogger()
    original = list(root.handlers)
    try:
        root.handlers = [fake_server_handler]

        agent_configure(stream=io.StringIO(), mode="plain")

        markers = {
            "agent": sum(1 for h in root.handlers if getattr(h, "_cdx_agent", False)),
            "server": sum(1 for h in root.handlers if getattr(h, "_cdx_json", False)),
        }
        assert markers == {"agent": 1, "server": 1}, (
            f"expected both handlers to survive, got {markers}"
        )
    finally:
        root.handlers = original


def test_idempotent_agent_setup_does_not_duplicate():
    agent_configure(stream=io.StringIO(), mode="plain")
    count_before = sum(
        1 for h in logging.getLogger().handlers if getattr(h, "_cdx_agent", False)
    )
    agent_configure(stream=io.StringIO(), mode="plain")
    count_after = sum(
        1 for h in logging.getLogger().handlers if getattr(h, "_cdx_agent", False)
    )
    assert count_before == count_after == 1

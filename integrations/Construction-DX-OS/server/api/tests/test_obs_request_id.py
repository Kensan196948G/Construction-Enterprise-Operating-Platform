"""Tests for cdx_server.obs.request_id.RequestIDMiddleware."""

from __future__ import annotations

import re

UUID_HEX = re.compile(r"^[0-9a-f]{32}$")


def test_response_carries_generated_request_id(client):
    response = client.get("/health")
    rid = response.headers.get("x-request-id")
    assert rid is not None
    assert UUID_HEX.match(rid), f"expected 32-char hex uuid, got {rid!r}"


def test_inbound_request_id_is_echoed(client):
    response = client.get("/health", headers={"X-Request-Id": "trace-abc-123"})
    assert response.headers["x-request-id"] == "trace-abc-123"


def test_long_inbound_request_id_is_rejected_and_replaced(client):
    rogue = "X" * 500
    response = client.get("/health", headers={"X-Request-Id": rogue})
    # Too long → middleware replaces with a fresh UUID.
    assert response.headers["x-request-id"] != rogue
    assert UUID_HEX.match(response.headers["x-request-id"])


def test_each_request_gets_a_different_id(client):
    a = client.get("/health").headers["x-request-id"]
    b = client.get("/health").headers["x-request-id"]
    assert a != b

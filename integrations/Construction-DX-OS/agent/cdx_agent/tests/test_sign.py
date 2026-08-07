"""Tests for cdx_agent.sign."""

from __future__ import annotations

from cdx_agent.sign import (
    DEFAULT_BUCKET_SECONDS,
    HEARTBEAT_BUCKET_SECONDS,
    INVENTORY_BUCKET_SECONDS,
    body_digest,
    bucket_for,
    canonical_string,
    sign,
    verify,
)


def test_body_digest_is_stable_hex_sha256():
    digest = body_digest(b"{}")
    assert len(digest) == 64
    assert digest == body_digest(b"{}")


def test_body_digest_is_sensitive_to_content():
    assert body_digest(b"a") != body_digest(b"b")


def test_canonical_string_uses_expected_format():
    canonical = canonical_string(
        device_id="dev-1",
        payload_type="heartbeat",
        timestamp_bucket=60,
        body_bytes=b"{}",
    )
    lines = canonical.split("\n")
    assert lines[0] == "dev-1"
    assert lines[1] == "heartbeat"
    assert lines[2] == "60"
    assert lines[3] == body_digest(b"{}")


def test_sign_and_verify_round_trip():
    canonical = canonical_string(
        device_id="dev-1",
        payload_type="heartbeat",
        timestamp_bucket=60,
        body_bytes=b"hello",
    )
    signature = sign("s3cret", canonical)
    assert verify("s3cret", canonical, signature)


def test_verify_rejects_wrong_secret():
    canonical = "a\nb\n0\n00"
    signature = sign("s3cret", canonical)
    assert not verify("other", canonical, signature)


def test_verify_rejects_tampered_canonical():
    signature = sign("s3cret", "a\nb\n0\n00")
    assert not verify("s3cret", "a\nb\n1\n00", signature)


def test_bucket_for_heartbeat_is_one_minute():
    assert bucket_for("heartbeat", 61.4) == 60
    assert bucket_for("heartbeat", 119.9) == 60
    assert bucket_for("heartbeat", 120.0) == 120
    assert HEARTBEAT_BUCKET_SECONDS == 60


def test_bucket_for_inventory_is_one_hour():
    assert bucket_for("inventory", 3599.999) == 0
    assert bucket_for("inventory", 3600.0) == 3600
    assert INVENTORY_BUCKET_SECONDS == 3600


def test_bucket_for_unknown_payload_type_defaults_to_five_minutes():
    assert DEFAULT_BUCKET_SECONDS == 300
    # 301 seconds falls into the bucket starting at 300
    assert bucket_for("update-status", 301) == 300

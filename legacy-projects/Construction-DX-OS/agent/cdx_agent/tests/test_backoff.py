"""Tests for cdx_agent.backoff."""

from __future__ import annotations

import random

import pytest

from cdx_agent.backoff import BackoffPolicy, delay_for


def test_attempt_zero_returns_zero():
    assert delay_for(0, BackoffPolicy()) == 0.0


def test_negative_attempt_returns_zero():
    assert delay_for(-1, BackoffPolicy()) == 0.0


def test_first_retry_within_base_window():
    policy = BackoffPolicy(base_seconds=1.0, cap_seconds=60.0)
    rng = random.Random(0)
    delay = delay_for(1, policy, rng)
    assert 0.0 <= delay <= 1.0


def test_third_retry_within_4x_base_window():
    """attempt=3 → base * 2^(3-1) = 4 * base, jittered."""
    policy = BackoffPolicy(base_seconds=1.0, cap_seconds=60.0, multiplier=2.0)
    rng = random.Random(42)
    delay = delay_for(3, policy, rng)
    assert 0.0 <= delay <= 4.0


def test_capped_at_cap_seconds():
    """Even with attempt=20, the upper bound never exceeds cap."""
    policy = BackoffPolicy(base_seconds=1.0, cap_seconds=10.0)
    rng = random.Random(42)
    samples = [delay_for(20, policy, rng) for _ in range(100)]
    assert all(s <= 10.0 for s in samples)


def test_full_jitter_distributes_uniformly():
    """100 samples should cover a meaningful fraction of the window."""
    policy = BackoffPolicy(base_seconds=4.0, cap_seconds=60.0)
    rng = random.Random(7)
    samples = [delay_for(1, policy, rng) for _ in range(100)]
    assert min(samples) < 0.5  # some near zero
    assert max(samples) > 3.0  # some near upper bound


def test_invalid_base_raises():
    with pytest.raises(ValueError):
        BackoffPolicy(base_seconds=0.0)


def test_invalid_cap_raises():
    with pytest.raises(ValueError):
        BackoffPolicy(base_seconds=2.0, cap_seconds=1.0)


def test_invalid_multiplier_raises():
    with pytest.raises(ValueError):
        BackoffPolicy(multiplier=0.5)


def test_invalid_max_retries_raises():
    with pytest.raises(ValueError):
        BackoffPolicy(max_retries=-1)

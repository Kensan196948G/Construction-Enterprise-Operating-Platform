"""Exponential backoff with full jitter for cdx-agent retry timing.

Algorithm: AWS-style "full jitter".  The Nth retry sleeps a uniform random
duration between 0 and ``base * (multiplier ** (attempt - 1))``, capped at
``cap_seconds``.

Why full jitter?  When a fleet of devices loses connectivity at the same
moment (e.g. a site-wide WiFi outage), unjittered exponential backoff has
every device retry on the same instants, producing a thundering herd at
the API.  Full jitter spreads the load uniformly across the backoff window.

References:
    https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
"""

from __future__ import annotations

import random
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BackoffPolicy:
    base_seconds: float = 1.0
    cap_seconds: float = 60.0
    multiplier: float = 2.0
    max_retries: int = 3

    def __post_init__(self) -> None:
        if self.base_seconds <= 0:
            raise ValueError("base_seconds must be > 0")
        if self.cap_seconds < self.base_seconds:
            raise ValueError("cap_seconds must be >= base_seconds")
        if self.multiplier < 1:
            raise ValueError("multiplier must be >= 1")
        if self.max_retries < 0:
            raise ValueError("max_retries must be >= 0")


def delay_for(attempt: int, policy: BackoffPolicy, rng: random.Random | None = None) -> float:
    """Return the delay (seconds) before the ``attempt``-th retry (1-indexed).

    ``attempt`` of 1 is the first retry after the first failure. An attempt
    less than 1 returns 0 (no delay) so callers can always invoke it without
    a guard.
    """
    if attempt < 1:
        return 0.0
    if rng is None:
        rng = random
    raw = policy.base_seconds * (policy.multiplier ** (attempt - 1))
    capped = min(raw, policy.cap_seconds)
    return rng.uniform(0.0, capped)

"""Shared FastAPI dependency placeholders for cdx-server.

Each function here is a sentinel that raises RuntimeError when called without
``app.dependency_overrides`` being set by ``create_app``.  This enforces that
callers can never accidentally receive a None or stale dependency.

All routers import from here instead of defining their own local copies, so
``create_app`` only needs two override entries (plus ``admin._get_storage``)
rather than one per router.
"""

from __future__ import annotations

from cdx_server.rate_limit import RateLimiter
from cdx_server.storage_protocol import Storage


def get_storage() -> Storage:  # overridden in create_app / tests
    raise RuntimeError("Storage dependency must be overridden at app wiring time")


def get_rate_limiter() -> RateLimiter:  # overridden in create_app / tests
    raise RuntimeError("RateLimiter dependency must be overridden at app wiring time")

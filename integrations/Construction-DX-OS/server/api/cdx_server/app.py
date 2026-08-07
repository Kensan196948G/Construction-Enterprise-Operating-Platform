"""FastAPI app factory for cdx-server.

Wires routers, dependency overrides, and the storage backend.
Also installs the observability layer (JSON logging, request-id middleware,
Prometheus /metrics endpoint) and the per-device rate limiter.

A factory function ``create_app`` is exposed so tests can build isolated
app instances with their own fresh storage backend and rate-limiter.

Storage backend selection
-------------------------
When ``DATABASE_URL`` is set in the environment, ``PostgresStorage`` is used
automatically.  Otherwise ``InMemoryStorage`` (Phase 1 default) is used.
Pass an explicit ``storage`` argument to ``create_app`` to override this.
"""

from __future__ import annotations

import logging
import os
import time
import warnings
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from cdx_server import __version__
from cdx_server.dependencies import get_rate_limiter as _dep_rate_limiter
from cdx_server.dependencies import get_storage as _dep_storage
from cdx_server.obs.csp_nonce import CSPNonceMiddleware
from cdx_server.obs.logging_setup import configure_logging
from cdx_server.obs.metrics import metrics_endpoint
from cdx_server.obs.request_id import RequestIDMiddleware
from cdx_server.obs.security_headers import SecurityHeadersMiddleware
from cdx_server.rate_limit import (
    InMemoryRateLimiter,
    NullRateLimiter,
    RateLimiter,
    RateLimitPolicy,
)
from cdx_server.routers import (
    admin,
    dashboard,
    devices,
    health,
    heartbeat,
    inventory,
    iso_builder_admin,
    iso_builds,
    policy,
    pxe_events,
    pxe_rollback,
    registration_tokens,
    serial_scan,
)
from cdx_server.storage import InMemoryStorage
from cdx_server.storage_protocol import Storage

logger = logging.getLogger(__name__)

# Phase 1 defaults. bucket=60s for heartbeat means 1 legitimate hb/min/device;
# 10/min gives headroom for retries and clock skew before we 429.
# bucket=3600s for inventory means 1/h/device; 3/h absorbs startup retries.
_DEFAULT_HEARTBEAT_PER_MIN = 10
_DEFAULT_INVENTORY_PER_HOUR = 3


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        value = int(raw)
    except ValueError:
        warnings.warn(
            f"{name}={raw!r} is not a valid integer; using default {default}",
            stacklevel=2,
        )
        return default
    if value <= 0:
        warnings.warn(
            f"{name}={value} must be positive; using default {default}",
            stacklevel=2,
        )
        return default
    return value


def _build_default_rate_limiter() -> RateLimiter:
    if os.environ.get("CDX_RATE_LIMIT_ENABLED", "true").lower() == "false":
        return NullRateLimiter()

    hb_per_min = _env_int("CDX_RATE_LIMIT_HEARTBEAT_PER_MIN", _DEFAULT_HEARTBEAT_PER_MIN)
    inv_per_hour = _env_int("CDX_RATE_LIMIT_INVENTORY_PER_HOUR", _DEFAULT_INVENTORY_PER_HOUR)

    policies = {
        "heartbeat": RateLimitPolicy(
            capacity=hb_per_min,
            refill_per_second=hb_per_min / 60.0,
        ),
        "inventory": RateLimitPolicy(
            capacity=inv_per_hour,
            refill_per_second=inv_per_hour / 3600.0,
        ),
    }

    redis_url = os.environ.get("REDIS_URL", "").strip()
    if redis_url:
        try:
            import redis as redis_lib

            from cdx_server.rate_limit_redis import RedisRateLimiter
        except ImportError as exc:
            warnings.warn(
                f"REDIS_URL is set but redis/RedisRateLimiter not available: {exc}. "
                "Falling back to InMemoryRateLimiter.",
                stacklevel=2,
            )
            return InMemoryRateLimiter(policies)
        logger.info("rate-limiter: using RedisRateLimiter (REDIS_URL is set)")
        client = redis_lib.Redis.from_url(redis_url, decode_responses=False)
        return RedisRateLimiter(client, policies)

    logger.info("rate-limiter: using InMemoryRateLimiter (REDIS_URL not set)")
    return InMemoryRateLimiter(policies)


def _build_default_storage() -> Storage:
    """Select storage backend based on environment.

    If ``DATABASE_URL`` is set, return a ``PostgresStorage`` backed by that
    database (tables are created if absent).  Otherwise return the Phase 1
    ``InMemoryStorage``.

    Phase 9 (Issue #4): PostgresStorage now uses AsyncSession internally.
    The sync ``create_tables`` / ``seed_defaults`` bootstrap still uses a
    sync engine; the request-handling path is fully async.
    """
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if database_url:
        try:
            from cdx_server.storage_pg import PostgresStorage
        except ImportError as exc:
            warnings.warn(
                f"DATABASE_URL is set but PostgresStorage not available: {exc}. "
                "Falling back to InMemoryStorage.",
                stacklevel=2,
            )
            return InMemoryStorage()
        logger.info("storage: using PostgresStorage (DATABASE_URL is set)")
        pg = PostgresStorage(database_url)
        return pg
    logger.info("storage: using InMemoryStorage (DATABASE_URL not set)")
    return InMemoryStorage()


def _warn_missing_secrets() -> None:
    """Log warnings for security-critical env vars that are unset at startup."""
    critical = [
        ("CDX_REGISTRATION_TOKEN", "device registration is DISABLED — new devices cannot enroll"),
        ("CDX_BOOTSTRAP_SECRET", "PXE bootstrap token issuance is DISABLED"),
    ]
    for var, msg in critical:
        if not os.environ.get(var, "").strip():
            logger.warning("startup: %s not set — %s", var, msg)

    if not os.environ.get("CDX_ADMIN_PASSWORD", "").strip():
        logger.info(
            "startup: CDX_ADMIN_PASSWORD not set — admin UI uses default open-access mode (dev only)"
        )


def create_app(
    storage: Storage | None = None,
    rate_limiter: RateLimiter | None = None,
) -> FastAPI:
    configure_logging()
    _warn_missing_secrets()
    storage = storage or _build_default_storage()
    rate_limiter = rate_limiter or _build_default_rate_limiter()

    app = FastAPI(
        title="cdx-server",
        version=__version__,
        description="Construction DX OS central platform API (Phase 1).",
    )

    app.state.storage = storage
    app.state.rate_limiter = rate_limiter
    app.state.started_at = time.monotonic()

    # Middleware order (outermost = last added): CSPNonce → Security → RequestID
    # CSPNonceMiddleware must run before SecurityHeadersMiddleware so the nonce
    # is available in scope["state"] when the CSP header is built.
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(CSPNonceMiddleware)

    app.include_router(health.router)
    app.include_router(dashboard.router)
    app.include_router(devices.router)
    app.include_router(registration_tokens.router)
    app.include_router(pxe_events.router)
    app.include_router(pxe_rollback.router)
    app.include_router(heartbeat.router)
    app.include_router(inventory.router)
    app.include_router(policy.router)
    app.include_router(iso_builds.router)
    # ISO Builder WebUI must come BEFORE admin.router so /admin/iso-builder/*
    # is matched here rather than falling through to admin's /admin/devices/{id}.
    app.include_router(iso_builder_admin.router)
    app.include_router(serial_scan.router)
    app.include_router(admin.router)

    # Admin SPA (Issue 0039): serves the Anthropic Design Canvas bundle.
    # Mounted before /metrics so static asset paths take precedence.
    _spa_dir = Path(__file__).parent.parent / "static" / "admin-spa"
    if _spa_dir.is_dir():
        app.mount(
            "/admin-spa",
            StaticFiles(directory=str(_spa_dir), html=True),
            name="admin-spa",
        )

    # Prometheus metrics at /metrics — plain Starlette handler so FastAPI
    # does not treat it as a typed JSON response.
    app.add_route("/metrics", metrics_endpoint, methods=["GET"], include_in_schema=False)

    def _provide_storage() -> Storage:
        return storage  # type: ignore[return-value]

    def _provide_rate_limiter() -> RateLimiter:
        return rate_limiter

    # Single shared dependency sentinels (devices/health/heartbeat/inventory/policy).
    app.dependency_overrides[_dep_storage] = _provide_storage
    app.dependency_overrides[_dep_rate_limiter] = _provide_rate_limiter
    # admin uses request.app.state directly; keep its own override for test isolation.
    app.dependency_overrides[admin._get_storage] = _provide_storage

    return app


# Module-level app for ``uvicorn cdx_server.app:app``.
app = create_app()

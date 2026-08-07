"""Policy client for cdx-agent.

Fetches the device's operational policy from the central platform via
``GET /api/v1/policy``. The request is authenticated with the standard
HMAC-signed identity headers; the body is empty, so the canonical string
uses SHA-256 of an empty byte string.

Usage::

    client = PolicyClient(
        base_url=config.api_endpoint,
        device_id=config.device_id,
        shared_secret=config.shared_secret,
    )
    result = client.fetch()
    if result.ok:
        print(result.policy.heartbeat_interval_seconds)

The result is a :class:`PolicyResult` — a small value object that holds
either the fetched policy or an error status so callers can decide whether
to apply defaults or raise.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Protocol

import httpx

from cdx_agent import sign as sign_mod
from cdx_agent.obs.request_id import HEADER_NAME as REQUEST_ID_HEADER
from cdx_agent.obs.request_id import REQUEST_ID

logger = logging.getLogger(__name__)

# Payload type constant used in HMAC canonical string and server routing.
POLICY_PAYLOAD_TYPE = "policy"

# Sensible conservative defaults used when the server is unreachable or
# returns an unknown profile. These mirror _DEFAULT_POLICIES on the server.
DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 60
DEFAULT_INVENTORY_INTERVAL_SECONDS = 3600


@dataclass(frozen=True, slots=True)
class PolicyData:
    """Operational policy pushed down from the central platform."""

    profile: str
    update_ring: str
    heartbeat_interval_seconds: int
    inventory_interval_seconds: int
    policy_version: int


@dataclass(frozen=True, slots=True)
class PolicyResult:
    """Outcome of a policy fetch attempt."""

    ok: bool
    status_code: int
    policy: PolicyData | None

    @classmethod
    def success(cls, policy: PolicyData, status_code: int = 200) -> PolicyResult:
        return cls(ok=True, status_code=status_code, policy=policy)

    @classmethod
    def failure(cls, status_code: int) -> PolicyResult:
        return cls(ok=False, status_code=status_code, policy=None)


class _HasGet(Protocol):
    def get(
        self,
        url: str,
        *,
        headers: dict[str, str],
    ) -> httpx.Response: ...


class PolicyClient:
    """Fetch the device's operational policy from the central platform.

    Injects a ``session`` for test isolation (``httpx.Client`` or mock).
    ``clock`` is injectable for deterministic timestamp buckets in tests.
    """

    def __init__(
        self,
        *,
        base_url: str,
        device_id: str,
        shared_secret: str,
        session: _HasGet | None = None,
        clock: Callable[[], float] | None = None,
        timeout_seconds: float = 10.0,
    ) -> None:
        if not device_id:
            raise ValueError("device_id is required")
        if not shared_secret:
            raise ValueError("shared_secret is required")
        self._base_url = base_url.rstrip("/")
        self._device_id = device_id
        self._secret = shared_secret
        self._session: _HasGet = session or httpx.Client(timeout=timeout_seconds)
        self._clock = clock or time.time

    def _build_headers(self) -> dict[str, str]:
        """Build the signed identity headers for an empty-body GET request."""
        bucket = sign_mod.bucket_for(POLICY_PAYLOAD_TYPE, self._clock())
        canonical = sign_mod.canonical_string(
            device_id=self._device_id,
            payload_type=POLICY_PAYLOAD_TYPE,
            timestamp_bucket=bucket,
            body_bytes=b"",  # GET has no body
        )
        signature = sign_mod.sign(self._secret, canonical)
        headers: dict[str, str] = {
            "X-CDX-Device-Id": self._device_id,
            "X-CDX-Payload-Type": POLICY_PAYLOAD_TYPE,
            "X-CDX-Timestamp-Bucket": str(bucket),
            "X-CDX-Signature": signature,
        }
        rid = REQUEST_ID.get()
        if rid is not None:
            headers[REQUEST_ID_HEADER] = rid
        return headers

    def fetch(self) -> PolicyResult:
        """Fetch the current policy from the server.

        Returns a :class:`PolicyResult`. Transport errors (connection refused,
        timeout) are caught and logged; callers receive
        ``PolicyResult.failure(status_code=0)`` so they can fall back to defaults
        without crashing the agent.
        """
        url = f"{self._base_url}/policy"
        headers = self._build_headers()
        try:
            response = self._session.get(url, headers=headers)
        except (httpx.TransportError, httpx.TimeoutException) as exc:
            logger.warning("policy fetch failed (transport error): %s", exc)
            return PolicyResult.failure(status_code=0)

        if not (200 <= response.status_code < 300):
            logger.warning(
                "policy fetch failed: status=%d url=%s",
                response.status_code,
                url,
            )
            return PolicyResult.failure(status_code=response.status_code)

        try:
            body = response.json()
            policy = PolicyData(
                profile=body["profile"],
                update_ring=body["update_ring"],
                heartbeat_interval_seconds=int(body["heartbeat_interval_seconds"]),
                inventory_interval_seconds=int(body["inventory_interval_seconds"]),
                policy_version=int(body["policy_version"]),
            )
        except (KeyError, ValueError, TypeError) as exc:
            logger.warning("policy fetch failed (parse error): %s", exc)
            return PolicyResult.failure(status_code=response.status_code)

        logger.info(
            "policy fetched: profile=%s ring=%s hb_interval=%ds inv_interval=%ds version=%d",
            policy.profile,
            policy.update_ring,
            policy.heartbeat_interval_seconds,
            policy.inventory_interval_seconds,
            policy.policy_version,
        )
        return PolicyResult.success(policy, status_code=response.status_code)

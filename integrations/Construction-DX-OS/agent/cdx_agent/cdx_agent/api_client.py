"""Signed HTTPS client for cdx-agent ↔ central-platform.

Each outbound request carries four identity headers and an HMAC signature in
``X-CDX-Signature``. The signature is computed by :mod:`cdx_agent.sign`.

A ``session`` can be injected so tests can swap in ``httpx.Client`` backed by
``httpx.MockTransport``. A ``clock`` callable is also injectable for
deterministic timestamp buckets.

Retries: when ``backoff`` is provided the client retries transient failures
(network errors, 5xx responses) with full-jitter exponential backoff.  4xx
responses are returned immediately — they are signaled programmer/auth bugs,
not transient network noise.

``Retry-After``: when a retry-able response carries a ``Retry-After`` header
in delta-seconds form (RFC 7231 §7.1.3), the agent honors the hint in place
of the computed backoff delay. Values are clamped to ``BackoffPolicy.cap_seconds``
to keep a misbehaving server from hanging the agent indefinitely. HTTP-date
form is intentionally not supported; the cdx-server only emits delta-seconds
and adding clock-skew parsing would be premature.
"""

from __future__ import annotations

import json
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import NamedTuple, Protocol

import httpx

from cdx_agent import sign as sign_mod
from cdx_agent.backoff import BackoffPolicy, delay_for
from cdx_agent.obs.request_id import HEADER_NAME as REQUEST_ID_HEADER
from cdx_agent.obs.request_id import REQUEST_ID

DEFAULT_TIMEOUT_SECONDS = 10.0


class _PreparedRequest(NamedTuple):
    """Return value of ``ApiClient._build_request``.

    Using a NamedTuple instead of a bare tuple makes call-sites read clearly
    and prevents accidental argument transposition.
    """

    body_bytes: bytes
    headers: dict[str, str]
    bucket: int


class _HasPost(Protocol):
    def post(
        self,
        url: str,
        *,
        content: bytes,
        headers: dict[str, str],
    ) -> httpx.Response: ...


@dataclass(frozen=True, slots=True)
class SendResult:
    ok: bool
    status_code: int
    url: str
    payload_type: str
    attempts: int = 1


class ApiClient:
    """Send signed payloads to the central platform.

    The client handles transient retry; queueing/ordering is owned by
    :class:`cdx_agent.sync.SyncOrchestrator` so concerns stay decoupled.
    """

    def __init__(
        self,
        *,
        base_url: str,
        device_id: str,
        shared_secret: str,
        session: _HasPost | None = None,
        clock: Callable[[], float] | None = None,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        backoff: BackoffPolicy | None = None,
        sleep: Callable[[float], None] | None = None,
    ):
        if not device_id:
            raise ValueError("device_id is required")
        if not shared_secret:
            raise ValueError("shared_secret is required")
        self.base_url = base_url.rstrip("/")
        self.device_id = device_id
        self._secret = shared_secret
        self._session: _HasPost = session or httpx.Client(timeout=timeout_seconds)
        self._clock = clock or time.time
        self._timeout = timeout_seconds
        self._backoff = backoff
        self._sleep = sleep or time.sleep

    def _build_request(
        self, payload_type: str, body: dict[str, object]
    ) -> _PreparedRequest:
        body_bytes = json.dumps(body, sort_keys=True, ensure_ascii=False).encode("utf-8")
        bucket = sign_mod.bucket_for(payload_type, self._clock())
        canonical = sign_mod.canonical_string(
            device_id=self.device_id,
            payload_type=payload_type,
            timestamp_bucket=bucket,
            body_bytes=body_bytes,
        )
        signature = sign_mod.sign(self._secret, canonical)
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "X-CDX-Device-Id": self.device_id,
            "X-CDX-Payload-Type": payload_type,
            "X-CDX-Timestamp-Bucket": str(bucket),
            "X-CDX-Signature": signature,
        }
        # None sentinel = no id bound; propagate only when a real value is set.
        # An empty-string id is still forwarded (it's a caller choice).
        rid = REQUEST_ID.get()
        if rid is not None:
            headers[REQUEST_ID_HEADER] = rid
        return _PreparedRequest(body_bytes=body_bytes, headers=headers, bucket=bucket)

    def _is_transient_status(self, status_code: int) -> bool:
        # 5xx are server-side transient. 408 / 429 are also retry-able.
        return status_code >= 500 or status_code in (408, 429)

    @staticmethod
    def _parse_retry_after(value: str | None, *, cap_seconds: float) -> float | None:
        """Return the ``Retry-After`` hint (seconds) or ``None`` if unusable.

        Only the delta-seconds form is accepted. Negative values are coerced
        to ``0.0`` (server saying "retry now"). Values larger than ``cap_seconds``
        are clamped to the cap.
        """
        if value is None:
            return None
        try:
            seconds = int(value.strip())
        except (AttributeError, ValueError):
            return None
        if seconds <= 0:
            return 0.0
        return min(float(seconds), cap_seconds)

    def send(self, payload_type: str, body: dict[str, object], path: str) -> SendResult:
        url = f"{self.base_url}{path}"
        req = self._build_request(payload_type, body)

        max_retries = self._backoff.max_retries if self._backoff else 0
        last_status: int | None = None
        last_exc: Exception | None = None

        for attempt_idx in range(max_retries + 1):
            try:
                # Timeout is set on ``self._session`` at construction time.
                response = self._session.post(url, content=req.body_bytes, headers=req.headers)
            except (httpx.TransportError, httpx.TimeoutException) as exc:
                last_exc = exc
                if attempt_idx >= max_retries:
                    raise
                self._sleep(delay_for(attempt_idx + 1, self._backoff))  # type: ignore[arg-type]
                continue

            if self._is_transient_status(response.status_code) and attempt_idx < max_retries:
                last_status = response.status_code
                # Server-advertised Retry-After overrides computed backoff when
                # present and parseable; this lets a rate-limited server pace
                # the fleet deterministically instead of leaving every device
                # to guess via jitter.
                hint = self._parse_retry_after(
                    response.headers.get("Retry-After"),
                    cap_seconds=self._backoff.cap_seconds,  # type: ignore[union-attr]
                )
                if hint is not None:
                    delay = hint
                else:
                    delay = delay_for(attempt_idx + 1, self._backoff)  # type: ignore[arg-type]
                self._sleep(delay)
                continue

            return SendResult(
                ok=200 <= response.status_code < 300,
                status_code=response.status_code,
                url=url,
                payload_type=payload_type,
                attempts=attempt_idx + 1,
            )

        # Loop exit path: all retries exhausted with transient failures.
        # If we have a status from the last try, surface it; otherwise re-raise.
        if last_status is not None:
            return SendResult(
                ok=False,
                status_code=last_status,
                url=url,
                payload_type=payload_type,
                attempts=max_retries + 1,
            )
        # Should be unreachable: any path without status raised above.
        raise RuntimeError("api_client: exhausted retries without status or exception") from last_exc

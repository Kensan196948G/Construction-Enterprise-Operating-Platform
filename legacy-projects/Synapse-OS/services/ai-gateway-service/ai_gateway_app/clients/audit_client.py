"""Audit Service Client (BL-006).

ai-gateway-service は Audit Event を生成しない。AIInvoked / AIBlocked / AIMasked を
``AuditEventIngress`` 互換 dict にまとめて audit-service に送信するだけ。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class AuditClient(Protocol):
    def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
        ...


@dataclass
class HttpAuditClient:
    base_url: str
    timeout_seconds: float = 5.0

    def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.post("/audit-events", json=ingress)
            r.raise_for_status()
            return r.json()


@dataclass
class StubAuditClient:
    events: list[dict[str, Any]] = field(default_factory=list)

    def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
        seq = len(self.events) + 1
        stored = {
            **ingress,
            "audit_event_id": f"aud_test_20260502_{seq:04d}",
            "hash_ref": f"sha256:stub-{seq:04d}",
        }
        self.events.append(stored)
        return stored

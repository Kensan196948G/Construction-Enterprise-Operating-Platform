"""Audit Service Client (BL-008).

federation-service は Audit Event を生成しない。
FederationShared / FederationBlocked / FederationReviewRequired を
``AuditEventIngress`` 互換 dict にまとめて audit-service に送信するだけ。

Shared Audit (FEDERATION_MODEL.md "audit_boundary"):
    - SHARED      : source / target 両 tenant_id で同一 correlation_id を 2 回 append
    - SOURCE_ONLY : source tenant_id のみ append (target に拒否される BLOCKED 経路)

両方の経路で同じ ``federation_event_id`` を correlation_id として使うことで、
Audit Timeline 上で source 側からも target 側からも引けるようにする
(= Acceptance 4 #5 "Shared Audit に記録" を満たす)。
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

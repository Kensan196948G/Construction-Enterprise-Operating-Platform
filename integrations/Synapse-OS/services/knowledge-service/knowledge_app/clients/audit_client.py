"""Audit Service Client (BL-011).

knowledge-service は Audit Event を生成しない。
KnowledgeIngested / LegalHoldApplied / KnowledgeDeleted を AuditEventIngress 互換 dict
にまとめて audit-service に送信するだけ (ADR-003 Audit-by-Design)。

correlation_id は KnowledgeItem.object_id を使い、後段で Lineage を辿る際に
Audit Timeline 上で同じ Knowledge を引けるようにする。
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

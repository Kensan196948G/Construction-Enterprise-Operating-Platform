"""Audit Service Client (BL-003).

workflow-service は Audit Event を **生成しない**。
発生事実 (ApprovalDecided / 承認迂回 deny) を ``AuditEventIngress`` 互換 dict に
まとめて audit-service に送信する役割のみ持つ。

correlation_id には Issue ID を入れることで、IssueCreated と ApprovalDecided が
同じ軸で Timeline 検索できるようにする (Sprint 1 末 Acceptance 1)。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class AuditClient(Protocol):
    """Audit Service への送信抽象."""

    def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
        """Audit Event を追記し、永続化された AuditEvent dict を返す."""
        ...


@dataclass
class HttpAuditClient:
    """本番経路: HTTP で audit-service を呼ぶ."""

    base_url: str
    timeout_seconds: float = 5.0

    def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.post("/audit-events", json=ingress)
            r.raise_for_status()
            return r.json()


@dataclass
class StubAuditClient:
    """Test 用 stub: 受信した event を順序付きで保持する.

    Acceptance 1 統合 test では、IssueCreated -> ApprovalDecided を
    同じ correlation_id で並べられるかをここで確認する。
    """

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

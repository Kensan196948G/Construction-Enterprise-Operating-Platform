"""Audit Service Client (BL-002).

object-service は Audit Event を **生成しない**。
発生事実 (IssueCreated 等) を ``AuditEventIngress`` 互換 dict にまとめて
audit-service に送信する役割のみ持つ。

Audit Event の id / hash_ref はサーバ採番なので、ここでは渡さない。
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

    integration test では「IssueCreated が積まれているか」「Approval 後に
    ApprovalDecided が同じ correlation_id で続くか」を ``events`` で確認する。
    """

    events: list[dict[str, Any]] = field(default_factory=list)

    def append(self, ingress: dict[str, Any]) -> dict[str, Any]:
        # サーバ採番される id / hash_ref は test では擬似的に付与する
        seq = len(self.events) + 1
        stored = {
            **ingress,
            "audit_event_id": f"aud_test_20260502_{seq:04d}",
            "hash_ref": f"sha256:stub-{seq:04d}",
        }
        self.events.append(stored)
        return stored

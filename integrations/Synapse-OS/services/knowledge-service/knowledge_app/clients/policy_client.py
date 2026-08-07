"""Policy Service Client (BL-011).

knowledge-service は DLP / mask / quarantine の最終判断を **持たない**
(SERVICE_RESPONSIBILITY_MODEL.md: Knowledge は Graph/Lineage/Retention のみ)。

ai-gateway-service / federation-service と同形の Protocol/Stub/Http 三点 set。
Knowledge Ingest 時に classification + transformation_type を Policy 入力に渡し、
将来の Policy Engine が `quarantine` / `mask_required` を返した場合に
KnowledgeStatus を ACTIVE → QUARANTINED に格下げするための拡張点を残す。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class PolicyClient(Protocol):
    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        ...


@dataclass
class HttpPolicyClient:
    base_url: str
    timeout_seconds: float = 5.0

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.post("/policy-decisions", json=payload)
            r.raise_for_status()
            return r.json()


@dataclass
class StubPolicyClient:
    """Test 用 stub: scripted があればそれを順番に返し、無ければ allow を返す.

    Knowledge Ingest の baseline は allow (= INTERNAL/PUBLIC で問題なし) が現実的なので、
    federation-service と異なり default を allow にする。
    """

    scripted: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(payload)
        if not self.scripted:
            return {
                "policy_decision_id": "pde_tena_20260502_0001",
                "decided_at": "2026-05-02T00:00:00+00:00",
                "final_decision": "allow",
                "requires_audit": True,
                "reasons": ["stub default: allow"],
                "applied_rules": [],
                "input_snapshot": payload,
            }
        return self.scripted.pop(0)

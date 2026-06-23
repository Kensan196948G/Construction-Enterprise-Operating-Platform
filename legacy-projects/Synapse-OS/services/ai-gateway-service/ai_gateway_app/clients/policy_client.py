"""Policy Service Client (BL-006).

ai-gateway-service は Policy 評価ロジックを **持たず**、policy-service に委譲する。
object-service の policy_client と同じ Protocol/Stub/Http 三点 set。
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
    """Test 用 stub: 設定された決定を順番に返す.

    呼ばれた input は ``calls`` に蓄積される。
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
                "reasons": ["stub default allow"],
                "applied_rules": [],
                "input_snapshot": payload,
            }
        return self.scripted.pop(0)

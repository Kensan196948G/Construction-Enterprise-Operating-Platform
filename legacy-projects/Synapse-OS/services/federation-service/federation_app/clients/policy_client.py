"""Policy Service Client (BL-008).

federation-service は Policy 評価ロジックを **持たず**、policy-service に委譲する
(SERVICE_RESPONSIBILITY_MODEL: Federation は Trust 評価/共有経路を持つが、
最終 Policy 判断は Policy Service に委譲する)。

ai-gateway-service / object-service と同形の Protocol/Stub/Http 三点 set。
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
                "final_decision": "federation_review_required",
                "requires_audit": True,
                "reasons": ["stub default: federation_review_required"],
                "applied_rules": [],
                "input_snapshot": payload,
            }
        return self.scripted.pop(0)

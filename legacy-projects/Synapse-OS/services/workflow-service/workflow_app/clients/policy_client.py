"""Policy Service Client (BL-003).

workflow-service は Policy 評価ロジックを **持たず**、policy-service に委譲する。
Approval は ``approval.decide`` action で Policy 評価される。Policy が deny を返した場合、
ADR-005 の「Approval は Audit 必須」と Auditability 原則を満たすため、
workflow_app は Approval Object を生成せず、Audit のみ残す経路に切り替える。

依存方向の原則:
    workflow_app -- (Protocol API) --> Policy Service
    workflow_app は policy_app を import しない。境界は HTTP / 模擬 client のみ。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class PolicyClient(Protocol):
    """Policy Service への問い合わせ抽象."""

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Policy Decision を取得する.

        payload は ``synapse_shared`` の PolicyDecisionInput と互換な dict。
        戻り値は policy-service の PolicyDecisionResult を JSON-deserialize した dict。
        """
        ...


@dataclass
class HttpPolicyClient:
    """本番経路: HTTP で policy-service を呼ぶ."""

    base_url: str
    timeout_seconds: float = 5.0

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.post("/policy-decisions", json=payload)
            r.raise_for_status()
            return r.json()


@dataclass
class StubPolicyClient:
    """Test 用 stub: 設定された決定を順番に返す."""

    scripted: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(payload)
        if not self.scripted:
            return _default_allow_decision(payload)
        return self.scripted.pop(0)


def _default_allow_decision(payload: dict[str, Any]) -> dict[str, Any]:
    """既定 allow Decision (G1 ベースライン).

    PolicyDecisionResult.model_dump() と互換な形に揃える
    (policy-service 本物の HTTP response と同じ shape にしておく)。
    """

    return {
        "policy_decision_id": "pde_tena_20260502_0001",
        "decided_at": "2026-05-02T00:00:00+00:00",
        "final_decision": "allow",
        "requires_audit": True,
        "reasons": ["stub default allow"],
        "applied_rules": [],
        "input_snapshot": payload,
    }

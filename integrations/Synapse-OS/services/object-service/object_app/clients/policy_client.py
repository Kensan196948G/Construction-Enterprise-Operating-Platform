"""Policy Service Client (BL-002).

object-service は Policy 評価ロジックを **持たず**、policy-service に委譲する。
ここでは Protocol で interface を定義し、本番 (httpx) と test (in-memory stub) の
2 実装を提供する。

依存方向の原則:
    object_app -- (Protocol API) --> Policy Service
    object_app は policy_app をimport しない。境界は HTTP / 模擬 client のみ。
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
    """本番経路: HTTP で policy-service を呼ぶ.

    Sprint 1 BL-002 単体では使わず、BL-013 統合テストおよび Pilot 配備で配線する。
    """

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

    使い方:
        cli = StubPolicyClient(scripted=[{"final_decision": "allow", ...}])
    呼ばれた input は ``calls`` に蓄積されるので、object-service が正しい入力を
    組み立てたかを assertion 可能。
    """

    scripted: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def evaluate(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(payload)
        if not self.scripted:
            return _default_allow_decision(payload)
        return self.scripted.pop(0)


def _default_allow_decision(payload: dict[str, Any]) -> dict[str, Any]:
    """既定 allow Decision (G1 ベースライン).

    test で scripted を渡さない場合に最低限の形を返す。
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

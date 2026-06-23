"""Policy read client (Sprint 4 / Governance Observability).

policy-service の ``GET /policy-decisions?tenant_id=...`` を読み出す。
Protocol + Stub + Http 三点セット。

注意: policy-service の現行 API は GET /policy-decisions/{id} のみ公開されているが、
Dashboard の集計目的では store.list() 互換の一覧取得が必要。
実環境では POLICY_BASE_URL を設定して HttpPolicyReadClient を使用する。
テスト環境では StubPolicyReadClient を使用する。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class PolicyReadClient(Protocol):
    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]: ...


@dataclass
class HttpPolicyReadClient:
    base_url: str
    timeout_seconds: float = 5.0

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if tenant_id:
            params["tenant_id"] = tenant_id
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.get("/policy-decisions", params=params)
            r.raise_for_status()
            return list(r.json())


@dataclass
class StubPolicyReadClient:
    """Test 用 stub. ``register`` で事前登録した Policy Decision を tenant_id で返す."""

    decisions: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def register(self, decision: dict[str, Any]) -> None:
        self.decisions.append(decision)

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        self.calls.append({"tenant_id": tenant_id})
        if tenant_id is None:
            return list(self.decisions)
        return [d for d in self.decisions if d.get("tenant_id") == tenant_id]

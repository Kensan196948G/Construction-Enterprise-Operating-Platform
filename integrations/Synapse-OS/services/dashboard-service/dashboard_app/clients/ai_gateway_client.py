"""AI Gateway read client (Sprint 4 / Governance Observability).

ai-gateway-service の ``GET /ai-actions?tenant_id=...`` を読み出す。
Protocol + Stub + Http 三点セット。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class AIGatewayReadClient(Protocol):
    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]: ...


@dataclass
class HttpAIGatewayReadClient:
    base_url: str
    timeout_seconds: float = 5.0

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if tenant_id:
            params["tenant_id"] = tenant_id
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.get("/ai-actions", params=params)
            r.raise_for_status()
            return list(r.json())


@dataclass
class StubAIGatewayReadClient:
    """Test 用 stub. ``register`` で事前登録した AI Action を tenant_id で返す."""

    actions: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def register(self, action: dict[str, Any]) -> None:
        self.actions.append(action)

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        self.calls.append({"tenant_id": tenant_id})
        if tenant_id is None:
            return list(self.actions)
        return [a for a in self.actions if a.get("tenant_id") == tenant_id]

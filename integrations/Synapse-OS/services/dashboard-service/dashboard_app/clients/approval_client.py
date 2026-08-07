"""Approval read client (BL-010).

workflow-service の ``GET /approvals?tenant_id=...`` を読み出す。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx


class ApprovalReadClient(Protocol):
    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]: ...


@dataclass
class HttpApprovalReadClient:
    base_url: str
    timeout_seconds: float = 5.0

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if tenant_id:
            params["tenant_id"] = tenant_id
        with httpx.Client(base_url=self.base_url, timeout=self.timeout_seconds) as cli:
            r = cli.get("/approvals", params=params)
            r.raise_for_status()
            return list(r.json())


@dataclass
class StubApprovalReadClient:
    approvals: list[dict[str, Any]] = field(default_factory=list)
    calls: list[dict[str, Any]] = field(default_factory=list)

    def register(self, approval: dict[str, Any]) -> None:
        self.approvals.append(approval)

    def list(self, *, tenant_id: str | None = None) -> list[dict[str, Any]]:
        self.calls.append({"tenant_id": tenant_id})
        if tenant_id is None:
            return list(self.approvals)
        return [a for a in self.approvals if a.get("tenant_id") == tenant_id]

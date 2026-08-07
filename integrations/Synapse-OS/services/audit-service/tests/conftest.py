"""audit-service テスト fixture.

JSONL 出力先をテストごとに tmp_path に切り替えてテスト間の漏れを防ぐ。
"""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from audit_app.main import app
from audit_app.storage.event_store import AuditEventStore, get_store


@pytest.fixture()
def store(tmp_path: Path) -> AuditEventStore:
    return AuditEventStore(jsonl_path=tmp_path / "audit_events.jsonl")


@pytest.fixture()
def client(store: AuditEventStore) -> Iterator[TestClient]:
    app.dependency_overrides[get_store] = lambda: store
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.pop(get_store, None)


@pytest.fixture()
def base_ingress() -> dict[str, object]:
    return {
        "event_type": "PolicyEvaluated",
        "tenant_id": "ten_tena_20260502_0001",
        "actor_id": "idn_tena_20260502_0001",
        "actor_type": "human",
        "action": "policy.evaluate",
        "object_id": "pde_tena_20260502_0001",
        "object_type": "policy_decision",
        "correlation_id": "corr-0001",
        "policy_decision_ref": "pde_tena_20260502_0001",
        "policy_result": "allow",
    }

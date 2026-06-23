"""knowledge-service test fixtures (BL-011).

各 test ごとに:
    - Knowledge Repository を新品に差し替え (in-memory state を相互汚染させない)
    - Policy / Audit client を Stub に差し替え (DLP 最終判断委譲経路の観測点)

federation-service / ai-gateway-service と同じ FastAPI dependency_overrides 戦略で
``@lru_cache`` の影響を上書きする。
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from knowledge_app.api import knowledge as knowledge_api
from knowledge_app.clients.audit_client import StubAuditClient
from knowledge_app.clients.policy_client import StubPolicyClient
from knowledge_app.main import app
from knowledge_app.storage.knowledge_repository import (
    KnowledgeRepository,
    get_repository,
)


@pytest.fixture
def policy_stub() -> StubPolicyClient:
    return StubPolicyClient()


@pytest.fixture
def audit_stub() -> StubAuditClient:
    return StubAuditClient()


@pytest.fixture
def repo() -> KnowledgeRepository:
    return KnowledgeRepository()


@pytest.fixture
def client(
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    repo: KnowledgeRepository,
) -> Iterator[TestClient]:
    app.dependency_overrides[knowledge_api.get_policy_client] = lambda: policy_stub
    app.dependency_overrides[knowledge_api.get_audit_client] = lambda: audit_stub
    app.dependency_overrides[get_repository] = lambda: repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

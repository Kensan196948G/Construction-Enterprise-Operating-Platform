"""ai-gateway-service test fixtures (BL-006).

各 test ごとに:
    - AI Action Repository を新品に差し替え
    - Policy / Audit / LLM client を Stub に差し替え
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from ai_gateway_app.api import ai_actions as ai_actions_api
from ai_gateway_app.clients.audit_client import StubAuditClient
from ai_gateway_app.clients.policy_client import StubPolicyClient
from ai_gateway_app.llm.llm_client import StubLLMClient
from ai_gateway_app.main import app
from ai_gateway_app.storage.ai_action_repository import (
    AIActionRepository,
    get_repository,
)


@pytest.fixture
def policy_stub() -> StubPolicyClient:
    return StubPolicyClient()


@pytest.fixture
def audit_stub() -> StubAuditClient:
    return StubAuditClient()


@pytest.fixture
def llm_stub() -> StubLLMClient:
    return StubLLMClient()


@pytest.fixture
def repo() -> AIActionRepository:
    return AIActionRepository()


@pytest.fixture
def client(
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    llm_stub: StubLLMClient,
    repo: AIActionRepository,
) -> Iterator[TestClient]:
    app.dependency_overrides[ai_actions_api.get_policy_client] = lambda: policy_stub
    app.dependency_overrides[ai_actions_api.get_audit_client] = lambda: audit_stub
    app.dependency_overrides[ai_actions_api.get_llm_client] = lambda: llm_stub
    app.dependency_overrides[get_repository] = lambda: repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

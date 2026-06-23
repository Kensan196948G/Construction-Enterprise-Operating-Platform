"""federation-service test fixtures (BL-008).

各 test ごとに:
    - Federation Event Repository を新品に差し替え
    - Policy / Audit client を Stub に差し替え
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from federation_app.api import federation_events as federation_events_api
from federation_app.clients.audit_client import StubAuditClient
from federation_app.clients.policy_client import StubPolicyClient
from federation_app.main import app
from federation_app.storage.federation_event_repository import (
    FederationEventRepository,
    get_repository,
)


@pytest.fixture
def policy_stub() -> StubPolicyClient:
    return StubPolicyClient()


@pytest.fixture
def audit_stub() -> StubAuditClient:
    return StubAuditClient()


@pytest.fixture
def repo() -> FederationEventRepository:
    return FederationEventRepository()


@pytest.fixture
def client(
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    repo: FederationEventRepository,
) -> Iterator[TestClient]:
    app.dependency_overrides[federation_events_api.get_policy_client] = lambda: policy_stub
    app.dependency_overrides[federation_events_api.get_audit_client] = lambda: audit_stub
    app.dependency_overrides[get_repository] = lambda: repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

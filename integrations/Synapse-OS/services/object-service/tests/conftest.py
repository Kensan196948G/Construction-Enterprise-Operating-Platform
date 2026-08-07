"""object-service test fixtures (BL-002 / BL-007).

各 test ごとに:
    - SQLite テーブルを drop_all / create_all でリセット (共有 in-memory DB のデータ漏れを防ぐ)
    - Issue / Document Repository を新品に差し替え
    - Policy / Audit client を Stub に差し替え (実 service を起動しない)

issues_api と documents_api は同じ FastAPI app を共有するため、
両方の DI を同 fixture でまとめて override する。
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from object_app.api import documents as documents_api
from object_app.api import issues as issues_api
from object_app.clients.audit_client import StubAuditClient
from object_app.clients.policy_client import StubPolicyClient
from object_app.main import app
from object_app.storage.database import Base, engine
from object_app.storage.document_repository import DocumentRepository
from object_app.storage.document_repository import get_repository as get_document_repository
from object_app.storage.issue_repository import IssueRepository
from object_app.storage.issue_repository import get_repository as get_issue_repository


@pytest.fixture(autouse=True)
def reset_db() -> Iterator[None]:
    """Drop and recreate all tables before each test to prevent cross-test data leakage."""
    from object_app.storage import orm_models  # noqa: F401 - register models
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def policy_stub() -> StubPolicyClient:
    return StubPolicyClient()


@pytest.fixture
def audit_stub() -> StubAuditClient:
    return StubAuditClient()


@pytest.fixture
def repo() -> IssueRepository:
    return IssueRepository()


@pytest.fixture
def doc_repo() -> DocumentRepository:
    return DocumentRepository()


@pytest.fixture
def client(
    policy_stub: StubPolicyClient,
    audit_stub: StubAuditClient,
    repo: IssueRepository,
    doc_repo: DocumentRepository,
) -> Iterator[TestClient]:
    app.dependency_overrides[issues_api.get_policy_client] = lambda: policy_stub
    app.dependency_overrides[issues_api.get_audit_client] = lambda: audit_stub
    app.dependency_overrides[get_issue_repository] = lambda: repo
    app.dependency_overrides[documents_api.get_policy_client] = lambda: policy_stub
    app.dependency_overrides[documents_api.get_audit_client] = lambda: audit_stub
    app.dependency_overrides[get_document_repository] = lambda: doc_repo
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

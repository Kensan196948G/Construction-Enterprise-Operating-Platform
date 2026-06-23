"""policy-service test fixtures.

各テストで SQLite テーブルを drop_all / create_all でリセットし、
テスト間のデータ漏れを防ぐ。
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from policy_app.main import app
from policy_app.storage.database import Base, engine
from policy_app.storage.decision_store import PolicyDecisionStore, get_store


@pytest.fixture(autouse=True)
def reset_db() -> Iterator[None]:
    """Drop and recreate all tables before each test to prevent cross-test data leakage."""
    from policy_app.storage import orm_models  # noqa: F401 - register models
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def store() -> PolicyDecisionStore:
    return PolicyDecisionStore()


@pytest.fixture()
def client(store: PolicyDecisionStore) -> Iterator[TestClient]:
    app.dependency_overrides[get_store] = lambda: store
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.pop(get_store, None)


@pytest.fixture()
def base_input() -> dict[str, object]:
    """G1 で「ほぼ allow」になる baseline 入力（テストごとに dict をコピーして上書き）."""
    return {
        "actor_id": "idn_tena_20260502_0001",
        "actor_type": "human",
        "tenant_id": "ten_tena_20260502_0001",
        "object_type": "issue",
        "action": "issue.create",
        "classification": "internal",
        "data_destination": "internal",
        "model_provider": "n/a",
        "risk_score": 10.0,
    }

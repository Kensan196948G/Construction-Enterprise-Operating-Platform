"""PolicyDecisionStore unit tests (Sprint 4 coverage expansion).

カバレッジ:
    - issue_id() が pde_ prefix の ID を返すこと
    - issue_id() が同じ scope/date で連番を採番すること (seq 1→2→3...)
    - save() + get() のラウンドトリップ
    - list_by_tenant() がテナントでフィルタすること
"""

from __future__ import annotations

import re
from datetime import date, datetime, timezone

from policy_app.schemas.decision import PolicyDecisionInput, PolicyDecisionResult
from policy_app.storage.decision_store import PolicyDecisionStore
from synapse_shared.enums import PolicyDecisionType

PDE_ID_PATTERN = re.compile(r"^pde_(tena|tenb|tenc|global)_\d{8}_\d{4,}$")

TENANT_A = "ten_tena_20260502_0001"
TENANT_B = "ten_tenb_20260502_0001"
ACTOR_ID = "idn_tena_20260502_0001"


def _make_decision_input(tenant_id: str = TENANT_A) -> PolicyDecisionInput:
    return PolicyDecisionInput(
        actor_id=ACTOR_ID,
        actor_type="human",
        tenant_id=tenant_id,
        object_type="issue",
        action="issue.create",
        classification="internal",
    )


def _make_decision_result(
    *,
    policy_decision_id: str,
    tenant_id: str = TENANT_A,
    final_decision: PolicyDecisionType = PolicyDecisionType.ALLOW,
) -> PolicyDecisionResult:
    inp = _make_decision_input(tenant_id=tenant_id)
    return PolicyDecisionResult(
        policy_decision_id=policy_decision_id,
        decided_at=datetime.now(tz=timezone.utc),
        final_decision=final_decision,
        input_snapshot=inp,
    )


# ---------------------------------------------------------------------------
# issue_id() — prefix / format
# ---------------------------------------------------------------------------


def test_issue_id_has_pde_prefix(store: PolicyDecisionStore) -> None:
    """issue_id() が pde_ prefix の ID を返すこと."""
    id_ = store.issue_id(tenant_id=TENANT_A)
    assert id_.startswith("pde_")
    assert PDE_ID_PATTERN.match(id_), f"invalid id format: {id_!r}"


def test_issue_id_sequential_for_same_scope_and_date(store: PolicyDecisionStore) -> None:
    """同じ scope / date に対して連番 (1→2→3) が払い出される."""
    today = date(2026, 5, 19)
    ids = [store.issue_id(tenant_id=TENANT_A, on_date=today) for _ in range(3)]
    # シーケンス部分を抽出
    seqs = [int(id_.rsplit("_", 1)[-1]) for id_ in ids]
    assert seqs == [1, 2, 3]


def test_issue_id_different_dates_restart_seq(store: PolicyDecisionStore) -> None:
    """異なる date ではシーケンスが独立してリセットされる."""
    day1 = date(2026, 5, 1)
    day2 = date(2026, 5, 2)
    id_d1 = store.issue_id(tenant_id=TENANT_A, on_date=day1)
    id_d2 = store.issue_id(tenant_id=TENANT_A, on_date=day2)
    seq_d1 = int(id_d1.rsplit("_", 1)[-1])
    seq_d2 = int(id_d2.rsplit("_", 1)[-1])
    assert seq_d1 == 1
    assert seq_d2 == 1


def test_issue_id_different_tenants_restart_seq(store: PolicyDecisionStore) -> None:
    """異なる scope (tenant) ではシーケンスが独立してリセットされる."""
    today = date(2026, 5, 19)
    id_a = store.issue_id(tenant_id=TENANT_A, on_date=today)
    id_b = store.issue_id(tenant_id=TENANT_B, on_date=today)
    seq_a = int(id_a.rsplit("_", 1)[-1])
    seq_b = int(id_b.rsplit("_", 1)[-1])
    assert seq_a == 1
    assert seq_b == 1  # 異なる scope なので独立


# ---------------------------------------------------------------------------
# save() + get() round-trip
# ---------------------------------------------------------------------------


def test_save_and_get_roundtrip(store: PolicyDecisionStore) -> None:
    """save() した PolicyDecisionResult を get() で取得できること."""
    decision_id = store.issue_id(tenant_id=TENANT_A)
    result = _make_decision_result(policy_decision_id=decision_id)
    store.save(result)

    retrieved = store.get(decision_id)
    assert retrieved is not None
    assert retrieved.policy_decision_id == decision_id
    assert retrieved.final_decision == PolicyDecisionType.ALLOW
    assert retrieved.input_snapshot.tenant_id == TENANT_A


def test_get_nonexistent_returns_none(store: PolicyDecisionStore) -> None:
    """存在しない ID に対して get() は None を返す."""
    assert store.get("pde_tena_99999999_9999") is None


def test_save_multiple_decisions(store: PolicyDecisionStore) -> None:
    """複数の PolicyDecisionResult を保存・取得できる."""
    ids = [store.issue_id(tenant_id=TENANT_A) for _ in range(3)]
    for id_ in ids:
        store.save(_make_decision_result(policy_decision_id=id_))

    assert len(store) == 3
    for id_ in ids:
        assert store.get(id_) is not None


def test_save_deny_decision(store: PolicyDecisionStore) -> None:
    """final_decision=deny の PolicyDecisionResult も保存・取得できる."""
    decision_id = store.issue_id(tenant_id=TENANT_A)
    result = _make_decision_result(
        policy_decision_id=decision_id,
        final_decision=PolicyDecisionType.DENY,
    )
    store.save(result)
    retrieved = store.get(decision_id)
    assert retrieved is not None
    assert retrieved.final_decision == PolicyDecisionType.DENY


# ---------------------------------------------------------------------------
# list() — tenant filter
# ---------------------------------------------------------------------------


def test_list_by_tenant_filters_correctly(store: PolicyDecisionStore) -> None:
    """list() に tenant_id を渡すとそのテナントの決定のみが返される."""
    # Tenant A: 2件、Tenant B: 1件
    for _ in range(2):
        id_ = store.issue_id(tenant_id=TENANT_A)
        store.save(_make_decision_result(policy_decision_id=id_, tenant_id=TENANT_A))

    id_b = store.issue_id(tenant_id=TENANT_B)
    store.save(_make_decision_result(policy_decision_id=id_b, tenant_id=TENANT_B))

    result_a = store.list(tenant_id=TENANT_A)
    assert len(result_a) == 2
    for r in result_a:
        assert r["input_snapshot"]["tenant_id"] == TENANT_A

    result_b = store.list(tenant_id=TENANT_B)
    assert len(result_b) == 1
    assert result_b[0]["input_snapshot"]["tenant_id"] == TENANT_B


def test_list_without_filter_returns_all(store: PolicyDecisionStore) -> None:
    """tenant_id 指定なしの list() は全決定を返す."""
    for tenant in [TENANT_A, TENANT_B]:
        id_ = store.issue_id(tenant_id=tenant)
        store.save(_make_decision_result(policy_decision_id=id_, tenant_id=tenant))

    all_results = store.list()
    assert len(all_results) == 2


def test_list_empty_for_unknown_tenant(store: PolicyDecisionStore) -> None:
    """データのない tenant_id に対して list() は空リストを返す."""
    results = store.list(tenant_id="ten_tena_99999999_9999")
    assert results == []

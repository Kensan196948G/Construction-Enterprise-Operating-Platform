"""AuditEventStore unit tests (Sprint 4 coverage expansion).

カバレッジ:
    - append() が previous_hash_ref を正しくチェーンすること
    - verify_chain() が改竄検知を行うこと（ハッシュ値を変えて verify_chain が False を返す）
    - 並行 append (threading) でも整合性が保たれること
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from pathlib import Path

import pytest

from audit_app.storage.event_store import AuditEventStore, compute_hash_ref
from synapse_shared.audit_base import AuditEvent, AuditEventType
from synapse_shared.enums import ActorType, ObjectType

TENANT_A = "ten_tena_20260502_0001"
TENANT_B = "ten_tenb_20260502_0001"
ACTOR_ID = "idn_tena_20260502_0001"


def _make_event(
    store: AuditEventStore,
    *,
    tenant_id: str = TENANT_A,
    actor_id: str = ACTOR_ID,
    correlation_id: str = "corr-001",
    action: str = "policy.evaluate",
    event_type: AuditEventType = AuditEventType.POLICY_EVALUATED,
) -> AuditEvent:
    """テスト用 AuditEvent を生成してストアに append するヘルパー."""
    eid = store.issue_id(tenant_id=tenant_id)
    prev_hash = store.get_previous_hash_ref(tenant_id)
    occurred_at = datetime.now(tz=timezone.utc)
    hash_ref = compute_hash_ref(
        audit_event_id=eid,
        event_type=event_type.value,
        occurred_at=occurred_at.isoformat(),
        tenant_id=tenant_id,
        actor_id=actor_id,
    )
    event = AuditEvent(
        audit_event_id=eid,
        event_type=event_type,
        occurred_at=occurred_at,
        tenant_id=tenant_id,
        actor_id=actor_id,
        actor_type=ActorType.HUMAN,
        action=action,
        object_id="pde_tena_20260502_0001",
        object_type=ObjectType.POLICY_DECISION,
        correlation_id=correlation_id,
        hash_ref=hash_ref,
        previous_hash_ref=prev_hash,
    )
    store.append(event)
    return event


# ---------------------------------------------------------------------------
# append() — hash chain
# ---------------------------------------------------------------------------


def test_first_event_has_genesis_previous_hash(store: AuditEventStore) -> None:
    """チェーン先頭イベントの previous_hash_ref は 'genesis' になる."""
    event = _make_event(store)
    assert event.previous_hash_ref == "genesis"


def test_second_event_links_to_first(store: AuditEventStore) -> None:
    """2 番目のイベントの previous_hash_ref は 1 番目の hash_ref と一致する."""
    first = _make_event(store, correlation_id="corr-001")
    second = _make_event(store, correlation_id="corr-002")
    assert second.previous_hash_ref == first.hash_ref


def test_chain_grows_sequentially(store: AuditEventStore) -> None:
    """複数イベントでチェーンが順に連結される."""
    events = [_make_event(store, correlation_id=f"corr-{i}") for i in range(4)]
    assert events[0].previous_hash_ref == "genesis"
    for i in range(1, 4):
        assert events[i].previous_hash_ref == events[i - 1].hash_ref


def test_chain_is_per_tenant(store: AuditEventStore) -> None:
    """テナントごとに独立したチェーンが構築される."""
    evt_a = _make_event(store, tenant_id=TENANT_A, correlation_id="a-001")
    evt_b = _make_event(store, tenant_id=TENANT_B, correlation_id="b-001")
    # 両方とも先頭なので genesis
    assert evt_a.previous_hash_ref == "genesis"
    assert evt_b.previous_hash_ref == "genesis"

    # Tenant A の 2 番目は Tenant A の 1 番目に連結される
    evt_a2 = _make_event(store, tenant_id=TENANT_A, correlation_id="a-002")
    assert evt_a2.previous_hash_ref == evt_a.hash_ref

    # Tenant B の 2 番目は Tenant B の 1 番目に連結される（A と無関係）
    evt_b2 = _make_event(store, tenant_id=TENANT_B, correlation_id="b-002")
    assert evt_b2.previous_hash_ref == evt_b.hash_ref


def test_append_duplicate_id_raises(store: AuditEventStore) -> None:
    """同一 audit_event_id の append は ValueError を raise する."""
    event = _make_event(store)
    with pytest.raises(ValueError, match="audit_event_id already exists"):
        store.append(event)


# ---------------------------------------------------------------------------
# verify_chain() — 改竄検知
# ---------------------------------------------------------------------------


def test_verify_valid_chain(store: AuditEventStore) -> None:
    """正常なチェーンは verify_chain が valid=True を返す."""
    for i in range(3):
        _make_event(store, correlation_id=f"corr-{i}")

    result = store.verify_chain(tenant_id=TENANT_A)
    assert result["tenant_id"] == TENANT_A
    assert result["total_events"] == 3
    assert result["valid"] is True
    assert result["broken_at"] is None


def test_verify_empty_tenant_returns_valid(store: AuditEventStore) -> None:
    """イベントが存在しないテナントは valid=True, total_events=0."""
    result = store.verify_chain(tenant_id="ten_tena_99999999_9999")
    assert result["valid"] is True
    assert result["total_events"] == 0
    assert result["broken_at"] is None


def test_verify_detects_tampered_hash_ref(store: AuditEventStore, tmp_path: Path) -> None:
    """hash_ref を書き換えると verify_chain が valid=False を返す（改竄検知）."""
    # 2 件 append
    first = _make_event(store, correlation_id="corr-tamper-1")
    _make_event(store, correlation_id="corr-tamper-2")

    # internal dict 経由でハッシュ値を改ざんする
    # AuditEvent は frozen=True なので object.__setattr__ を使う
    tampered = AuditEvent(
        audit_event_id=first.audit_event_id,
        event_type=first.event_type,
        occurred_at=first.occurred_at,
        tenant_id=first.tenant_id,
        actor_id=first.actor_id,
        actor_type=first.actor_type,
        action=first.action,
        object_id=first.object_id,
        object_type=first.object_type,
        correlation_id=first.correlation_id,
        hash_ref="sha256:" + "0" * 64,  # 改ざん済み hash
        previous_hash_ref=first.previous_hash_ref,
    )
    store._records[first.audit_event_id] = tampered

    result = store.verify_chain(tenant_id=TENANT_A)
    assert result["valid"] is False
    assert result["broken_at"] is not None


def test_verify_detects_broken_chain_link(store: AuditEventStore) -> None:
    """previous_hash_ref が前イベントの hash_ref と一致しない場合に改竄検知される."""
    _make_event(store, correlation_id="corr-link-1")

    # 2 番目のイベントを previous_hash_ref を壊して作成（append は bypass して直接 dict 更新）
    eid2 = store.issue_id(tenant_id=TENANT_A)
    occurred_at = datetime.now(tz=timezone.utc)
    correct_hash = compute_hash_ref(
        audit_event_id=eid2,
        event_type=AuditEventType.POLICY_EVALUATED.value,
        occurred_at=occurred_at.isoformat(),
        tenant_id=TENANT_A,
        actor_id=ACTOR_ID,
    )
    broken_event = AuditEvent(
        audit_event_id=eid2,
        event_type=AuditEventType.POLICY_EVALUATED,
        occurred_at=occurred_at,
        tenant_id=TENANT_A,
        actor_id=ACTOR_ID,
        actor_type=ActorType.HUMAN,
        action="policy.evaluate",
        object_id="pde_tena_20260502_0002",
        object_type=ObjectType.POLICY_DECISION,
        correlation_id="corr-link-2",
        hash_ref=correct_hash,
        previous_hash_ref="sha256:" + "f" * 64,  # 誤った previous_hash_ref
    )
    # append を bypass して直接 dict に挿入（previous_hash_ref の意図的な破損）
    store._records[eid2] = broken_event

    result = store.verify_chain(tenant_id=TENANT_A)
    assert result["valid"] is False
    assert result["broken_at"] == eid2


# ---------------------------------------------------------------------------
# 並行 append — threading での整合性
# ---------------------------------------------------------------------------


def test_concurrent_append_maintains_consistency(tmp_path: Path) -> None:
    """複数スレッドから並行 append を行っても内部状態が一貫していること."""
    store = AuditEventStore(jsonl_path=tmp_path / "concurrent.jsonl")
    n_threads = 5
    n_events_per_thread = 10
    errors: list[Exception] = []

    def worker(thread_idx: int) -> None:
        try:
            for i in range(n_events_per_thread):
                _make_event(store, correlation_id=f"t{thread_idx}-{i}")
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=worker, args=(t,)) for t in range(n_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # 例外が発生していないこと
    assert errors == [], f"Concurrent append raised exceptions: {errors}"

    # 全イベントが記録されていること
    total_expected = n_threads * n_events_per_thread
    assert len(store) == total_expected

    # JSONL ファイルにも全イベントが書き込まれていること
    lines = store._path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == total_expected


def test_concurrent_append_unique_ids(tmp_path: Path) -> None:
    """並行 append で払い出される audit_event_id が全て一意であること."""
    store = AuditEventStore(jsonl_path=tmp_path / "unique_ids.jsonl")
    collected_ids: list[str] = []
    lock = threading.Lock()

    def worker() -> None:
        event = _make_event(store, correlation_id="unique-test")
        with lock:
            collected_ids.append(event.audit_event_id)

    threads = [threading.Thread(target=worker) for _ in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # ID が全て一意であること
    assert len(set(collected_ids)) == len(collected_ids), "Duplicate audit_event_id detected"

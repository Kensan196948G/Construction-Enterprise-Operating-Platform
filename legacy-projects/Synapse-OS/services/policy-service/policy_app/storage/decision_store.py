"""SQLite-backed Policy Decision Store (Sprint 3).

役割:
    1. Policy Decision ID `pde_{scope}_{yyyymmdd}_{seq}` の払い出し
    2. PolicyDecisionResult を SQLite に永続化し ID で参照可能にする

Sprint 3 で in-memory dict から SQLite（SQLAlchemy）に置き換え。
SQLITE_DB 環境変数でパスを指定。未設定なら sqlite:///:memory: + StaticPool。
"""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from threading import Lock

from synapse_shared.ids import ID_PREFIXES, parse_id

from ..schemas.decision import PolicyDecisionResult
from .database import SessionLocal, init_db
from .orm_models import PolicyDecisionRecord


def _today_utc() -> date:
    return datetime.now(tz=timezone.utc).date()


def _scope_from_tenant_id(tenant_id: str) -> str:
    """`ten_tena_20260502_0001` -> `tena` を取り出す.

    Policy Decision の scope は「決定を下した側の tenant」を採用する。
    Cross Tenant のときは source 側 (= inp.tenant_id) を採用するのが G1 での運用。
    """
    return parse_id(tenant_id).scope


class PolicyDecisionStore:
    """Decision を発番し、SQLite に永続化する.

    Thread-safe: シーケンス発番は Lock で保護する。
    """

    def __init__(self) -> None:
        self._sequences: dict[tuple[str, str], int] = {}
        self._lock = Lock()
        init_db()

    def issue_id(self, *, tenant_id: str, on_date: date | None = None) -> str:
        scope = _scope_from_tenant_id(tenant_id)
        d = on_date or _today_utc()
        date_str = d.strftime("%Y%m%d")
        with self._lock:
            key = (scope, date_str)
            self._sequences[key] = self._sequences.get(key, 0) + 1
            seq = self._sequences[key]
        return f"{ID_PREFIXES['policy_decision']}_{scope}_{date_str}_{seq:04d}"

    def save(self, result: PolicyDecisionResult) -> None:
        """PolicyDecisionResult を SQLite に保存する.

        Note:
            タイムゾーン情報は UTC に正規化して保存する。SQLAlchemy + SQLite では
            naive datetime しか扱えない場合があるため UTC に統一して naive 化する。
            復元時は payload JSON 経由で完全な tz-aware datetime に復元できる。
        """
        payload_json = result.model_dump_json()
        if result.decided_at.tzinfo is not None:
            decided_at = result.decided_at.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            decided_at = result.decided_at
        record = PolicyDecisionRecord(
            policy_decision_id=result.policy_decision_id,
            tenant_id=result.input_snapshot.tenant_id,
            decided_at=decided_at,
            payload=payload_json,
        )
        with SessionLocal() as session:
            try:
                session.merge(record)
                session.commit()
            except Exception:
                session.rollback()
                raise

    def get(self, policy_decision_id: str) -> PolicyDecisionResult | None:
        """ID で PolicyDecisionResult を取得する。存在しなければ None。"""
        with SessionLocal() as session:
            record = session.get(PolicyDecisionRecord, policy_decision_id)
            if record is None:
                return None
            return PolicyDecisionResult.model_validate(json.loads(record.payload))

    def list(self, *, tenant_id: str | None = None) -> list[dict]:
        """全決定を dict のリストで返す。tenant_id 指定時はフィルタリング。"""
        with SessionLocal() as session:
            query = session.query(PolicyDecisionRecord)
            if tenant_id is not None:
                query = query.filter(PolicyDecisionRecord.tenant_id == tenant_id)
            records = query.all()
        return [json.loads(r.payload) for r in records]

    def __len__(self) -> int:  # テスト可視化のため
        with SessionLocal() as session:
            return session.query(PolicyDecisionRecord).count()


_default_store = PolicyDecisionStore()


def get_store() -> PolicyDecisionStore:
    """FastAPI dependency 注入用のシングルトン取得.

    テストではこの関数を override することで store を差し替え可能。
    """
    return _default_store

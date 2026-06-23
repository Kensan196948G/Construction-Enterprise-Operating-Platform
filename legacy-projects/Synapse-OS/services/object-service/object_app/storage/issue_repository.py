"""SQLite-backed Issue Repository (Sprint 2 MVP RC).

Sprint 1 の in-memory interface を維持しつつ、
SQLITE_DB 環境変数でファイルベース SQLite に切り替え可能。
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from threading import Lock

from synapse_shared.ids import ID_PREFIXES, parse_id

from ..schemas.issue import Issue
from .database import SessionLocal, init_db
from .orm_models import IssueRecord


def _today_utc() -> date:
    return datetime.now(tz=timezone.utc).date()


def _scope_from_tenant_id(tenant_id: str) -> str:
    return parse_id(tenant_id).scope


class IssueRepository:
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
        return f"{ID_PREFIXES['issue']}_{scope}_{date_str}_{seq:04d}"

    def save(self, issue: Issue) -> None:
        record = IssueRecord.from_issue(issue)
        with SessionLocal() as session:
            existing = session.get(IssueRecord, issue.object_id)
            if existing:
                for attr in ["title", "status", "priority", "updated_at", "payload"]:
                    setattr(existing, attr, getattr(record, attr))
            else:
                session.add(record)
            session.commit()

    def get(self, issue_id: str) -> Issue | None:
        with SessionLocal() as session:
            record = session.get(IssueRecord, issue_id)
            if record is None:
                return None
            return Issue.model_validate_json(record.payload)

    def delete(self, issue_id: str) -> bool:
        """Delete an issue by ID. Returns True if deleted, False if not found."""
        with SessionLocal() as session:
            record = session.get(IssueRecord, issue_id)
            if record is None:
                return False
            session.delete(record)
            session.commit()
            return True

    def list(self, *, tenant_id: str | None = None) -> list[Issue]:
        from sqlalchemy import select
        with SessionLocal() as session:
            stmt = select(IssueRecord).order_by(IssueRecord.created_at)
            if tenant_id is not None:
                stmt = stmt.where(IssueRecord.tenant_id == tenant_id)
            records = session.execute(stmt).scalars().all()
            return [Issue.model_validate_json(r.payload) for r in records]

    def __len__(self) -> int:
        from sqlalchemy import func, select
        with SessionLocal() as session:
            return session.execute(select(func.count(IssueRecord.object_id))).scalar_one()


_default_repo = IssueRepository()


def get_repository() -> IssueRepository:
    return _default_repo

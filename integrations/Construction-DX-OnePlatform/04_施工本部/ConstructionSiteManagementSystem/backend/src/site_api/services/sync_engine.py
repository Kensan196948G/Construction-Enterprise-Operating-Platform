"""オフライン同期エンジン (タイムスタンプベースのコンフリクト解決).

設計:
  - クライアントは ``client_timestamp`` と ``sync_version`` をペイロードに含める。
  - サーバー側は対応レコードを引いて ``updated_at`` / ``sync_version`` を比較する。
  - server-wins: ``client_timestamp < server.updated_at`` の場合は拒否し、コンフリクト
    情報 (現サーバー値スナップショット) を返す。
  - dispatch: ``entity_type`` ごとに対応するモデルへ create/update を適用する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.attendance import WorkerAttendance
from ..models.blackboard import ElectronicBoard
from ..models.daily_report import DailySiteReport
from ..models.heavy_equipment import Equipment
from ..models.photo import SitePhoto
from ..models.project import ConstructionProject
from ..models.schedule import ScheduleTask
from ..models.sync_log import SyncLog
from ..schemas.common import SyncEnvelopeItem, SyncResultItem


@dataclass(frozen=True)
class ConflictDecision:
    """コンフリクト判定の結果."""

    accept_client: bool
    reason: str
    server_snapshot: dict[str, Any] | None = None


# entity_type -> ORM クラスマップ
ENTITY_MODEL_MAP: dict[str, type] = {
    "project": ConstructionProject,
    "schedule": ScheduleTask,
    "daily_report": DailySiteReport,
    "photo": SitePhoto,
    "blackboard": ElectronicBoard,
    "attendance": WorkerAttendance,
    "equipment": Equipment,
}


def _coerce_dt(value: Any) -> datetime | None:
    """ISO 文字列または datetime を timezone-aware に正規化."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None


class SyncEngine:
    """同期コンフリクト解決と entity_type 別 dispatch."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # --------------------------------------------------------------
    # 判定ロジック (純粋関数として単体テスト可能)
    # --------------------------------------------------------------
    def decide(
        self,
        client_timestamp: datetime | None,
        client_version: int,
        server_updated_at: datetime | None,
        server_version: int,
    ) -> ConflictDecision:
        """タイムスタンプ・バージョン比較でクライアント反映可否を決める.

        - サーバー側にレコードが無い → 受け入れ (新規)。
        - client_timestamp が server.updated_at より古い → 拒否 (server-wins)。
        - その他は受け入れ。
        """
        if server_updated_at is None:
            return ConflictDecision(accept_client=True, reason="no server record")
        ct = client_timestamp or datetime.now(tz=timezone.utc)
        if ct.tzinfo is None:
            ct = ct.replace(tzinfo=timezone.utc)
        srv = server_updated_at if server_updated_at.tzinfo else server_updated_at.replace(
            tzinfo=timezone.utc
        )
        if ct < srv:
            return ConflictDecision(
                accept_client=False,
                reason="server newer",
                server_snapshot={
                    "updated_at": srv.isoformat(),
                    "sync_version": server_version,
                },
            )
        return ConflictDecision(accept_client=True, reason="client newer or equal")

    # --------------------------------------------------------------
    # dispatch
    # --------------------------------------------------------------
    async def dispatch(self, item: SyncEnvelopeItem) -> SyncResultItem:
        """entity_type ごとに対応モデルへ create/update を適用する."""
        model = ENTITY_MODEL_MAP.get(item.entity_type)
        if model is None:
            return SyncResultItem(
                entity_type=item.entity_type,
                status="error",
                error=f"unknown entity_type: {item.entity_type}",
            )

        data = dict(item.data or {})
        op = item.operation

        # 既存レコード検索: data["id"] が来ていればそれを使う
        existing: Any = None
        target_id = data.get("id")
        if target_id is not None:
            existing = await self.session.get(model, target_id)

        # コンフリクト判定 (update のみ)
        if op == "update" and existing is not None:
            server_updated = _coerce_dt(getattr(existing, "updated_at", None))
            server_version = int(getattr(existing, "sync_version", 0) or 0)
            decision = self.decide(
                client_timestamp=item.client_timestamp,
                client_version=item.client_version,
                server_updated_at=server_updated,
                server_version=server_version,
            )
            if not decision.accept_client:
                return SyncResultItem(
                    entity_type=item.entity_type,
                    status="conflict",
                    server_id=int(getattr(existing, "id", 0)) or None,
                    conflict_detail=decision.server_snapshot,
                )

        try:
            if op == "delete":
                if existing is None:
                    return SyncResultItem(
                        entity_type=item.entity_type,
                        status="error",
                        error="record not found",
                    )
                await self.session.delete(existing)
                return SyncResultItem(
                    entity_type=item.entity_type,
                    status="synced",
                    server_id=target_id,
                )
            if op in ("create", "update"):
                if existing is None:
                    rec = model(**{k: v for k, v in data.items() if k != "id"})
                    self.session.add(rec)
                    await self.session.flush()
                    new_id = int(getattr(rec, "id", 0)) or None
                    return SyncResultItem(
                        entity_type=item.entity_type,
                        status="synced",
                        server_id=new_id,
                    )
                for k, v in data.items():
                    if k == "id":
                        continue
                    if hasattr(existing, k):
                        setattr(existing, k, v)
                # sync_version を持つモデルはインクリメント
                if hasattr(existing, "sync_version"):
                    existing.sync_version = int(getattr(existing, "sync_version", 0) or 0) + 1
                await self.session.flush()
                return SyncResultItem(
                    entity_type=item.entity_type,
                    status="synced",
                    server_id=int(getattr(existing, "id", 0)) or None,
                )
            return SyncResultItem(
                entity_type=item.entity_type,
                status="error",
                error=f"unknown operation: {op}",
            )
        except Exception as exc:  # noqa: BLE001
            return SyncResultItem(
                entity_type=item.entity_type,
                status="error",
                error=str(exc),
            )

    # --------------------------------------------------------------
    # バッチ処理: accepted/conflicts/rejected を集計して返す
    # --------------------------------------------------------------
    async def process_batch(
        self,
        device_id: str,
        items: list[SyncEnvelopeItem],
        *,
        dispatcher: Callable[[SyncEnvelopeItem], Awaitable[SyncResultItem]] | None = None,
    ) -> dict[str, list[SyncResultItem]]:
        """バッチ全体を処理し、結果を {accepted, conflicts, rejected} に分類."""
        accepted: list[SyncResultItem] = []
        conflicts: list[SyncResultItem] = []
        rejected: list[SyncResultItem] = []
        for item in items:
            run = dispatcher or self.dispatch
            res = await run(item)
            await self.log(device_id, item, res)
            if res.status == "synced":
                accepted.append(res)
            elif res.status == "conflict":
                conflicts.append(res)
            else:
                rejected.append(res)
        return {"accepted": accepted, "conflicts": conflicts, "rejected": rejected}

    async def log(
        self,
        device_id: str,
        item: SyncEnvelopeItem,
        result: SyncResultItem,
    ) -> None:
        """SyncLog テーブルに記録."""
        log = SyncLog(
            device_id=device_id,
            entity_type=item.entity_type,
            entity_id=str(result.server_id) if result.server_id else None,
            operation=item.operation,
            status=result.status,
            client_timestamp=item.client_timestamp,
            server_timestamp=datetime.now(tz=timezone.utc),
            payload=item.data,
            conflict_detail=result.conflict_detail,
            error_message=result.error,
        )
        self.session.add(log)

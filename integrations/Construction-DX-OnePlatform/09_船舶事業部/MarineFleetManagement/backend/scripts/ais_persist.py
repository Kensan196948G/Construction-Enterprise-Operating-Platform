"""AIS 受信レコードのバッファリング & 永続化."""
from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from marine_api.services.ais_receiver import AISPosition

LOG = logging.getLogger(__name__)


@dataclass
class BufferedRow:
    """flush 前にメモリ上に積まれる 1 行."""

    received_at: datetime
    mmsi: str
    longitude: float | None
    latitude: float | None
    sog_knots: float | None
    cog_deg: float | None
    heading_deg: int | None


# 永続化フック型: list[BufferedRow] -> awaitable
PersistFn = Callable[[list[BufferedRow]], Awaitable[int]]


async def _default_persist(rows: list[BufferedRow]) -> int:
    """既定の永続化フック: DB に bulk insert する.

    MMSI ↔ vessel_id 解決は `Vessel.imo_no` 列を MMSI 文字列とみなして検索する
    簡易実装。解決できない行は skip する。

    返り値: 実際に insert された行数。
    """
    if not rows:
        return 0
    try:
        from sqlalchemy import select
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        from geoalchemy2.elements import WKTElement

        from cdx_db.session import get_sessionmaker
        from marine_api.models import Vessel, VesselPosition
    except Exception as e:  # pragma: no cover - import 失敗時 (DB 未設定)
        LOG.warning("persist deps unavailable: %s", e)
        return 0

    sm = get_sessionmaker()
    async with sm() as session:
        mmsi_set = {r.mmsi for r in rows}
        result = await session.execute(
            select(Vessel.id, Vessel.imo_no).where(Vessel.imo_no.in_(mmsi_set))
        )
        mmsi_to_id: dict[str, int] = {imo: vid for vid, imo in result.all() if imo}

        payload: list[dict[str, Any]] = []
        for r in rows:
            vid = mmsi_to_id.get(r.mmsi)
            if vid is None:
                continue
            geom = None
            if r.longitude is not None and r.latitude is not None:
                geom = WKTElement(f"POINT({r.longitude} {r.latitude})", srid=4326)
            payload.append(
                {
                    "time": r.received_at,
                    "vessel_id": vid,
                    "geom": geom,
                    "speed_knots": r.sog_knots,
                    "heading_deg": r.heading_deg if r.heading_deg is not None else r.cog_deg,
                    "source": "AIS",
                }
            )

        if not payload:
            return 0
        stmt = pg_insert(VesselPosition).values(payload)
        # 同一 (time, vessel_id) は既に存在するなら ignore
        stmt = stmt.on_conflict_do_nothing(index_elements=["time", "vessel_id"])
        await session.execute(stmt)
        await session.commit()
        return len(payload)


@dataclass
class AISPositionBuffer:
    """AIS Position をメモリにためる非同期セーフバッファ."""

    batch_size: int = 500
    persist_fn: PersistFn = field(default=_default_persist)
    _rows: list[BufferedRow] = field(default_factory=list)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    _last_flush_ts: float = field(default_factory=time.monotonic)
    _persisted_total: int = 0

    def add_from_ais(self, pos: AISPosition, *, now: datetime | None = None) -> None:
        """`AISPosition` を 1 行追加する (同期)."""
        row = BufferedRow(
            received_at=now or datetime.now(timezone.utc),
            mmsi=pos.mmsi,
            longitude=pos.longitude,
            latitude=pos.latitude,
            sog_knots=pos.sog_knots,
            cog_deg=pos.cog_deg,
            heading_deg=pos.heading_deg,
        )
        self._rows.append(row)

    def add_row(self, row: BufferedRow) -> None:
        self._rows.append(row)

    @property
    def size(self) -> int:
        return len(self._rows)

    @property
    def persisted_total(self) -> int:
        return self._persisted_total

    async def flush_if_needed(self, *, force: bool = False) -> int:
        """条件を満たすか force=True なら flush する.

        条件: バッファ件数 >= batch_size。
        返り値: 今回 persist された行数。
        """
        async with self._lock:
            if not self._rows:
                self._last_flush_ts = time.monotonic()
                return 0
            if not force and len(self._rows) < self.batch_size:
                return 0
            rows = self._rows
            self._rows = []
            self._last_flush_ts = time.monotonic()

        try:
            persisted = await self.persist_fn(rows)
        except Exception as e:  # pragma: no cover - 永続化失敗時の rollback はしない
            LOG.error("flush failed: %s (lost %d rows)", e, len(rows))
            return 0
        self._persisted_total += persisted
        return persisted

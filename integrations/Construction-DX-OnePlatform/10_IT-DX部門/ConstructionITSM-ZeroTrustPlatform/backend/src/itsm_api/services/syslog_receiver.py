"""Async UDP syslog receiver for FortiGate.

Parses FortiGate key=value Syslog into structured records and persists them
into ``t_fortigate_log`` in batches (size N or every T seconds, whichever
comes first). The persistence callback is injected so the receiver can be
tested without a real database.
"""
from __future__ import annotations

import asyncio
import logging
import re
from collections import Counter
from collections.abc import Awaitable, Callable, Iterable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime

logger = logging.getLogger(__name__)


# Tolerant key=value extractor: value can be quoted ("...") or bare (no spaces)
_KV_RE = re.compile(r'(\w+)=("(?:[^"\\]|\\.)*"|\S+)')

# RFC3164/RFC5424 leading PRI/timestamp/host prefix that may precede the kv body
_PRI_RE = re.compile(r"^<\d{1,3}>")


@dataclass
class SyslogRecord:
    time: datetime
    device: str | None
    src_ip: str | None
    dst_ip: str | None
    src_port: int | None
    dst_port: int | None
    action: str | None
    threat: str | None
    severity: str | None
    policy_id: str | None
    message: str | None
    raw: str
    fields: dict[str, str] = field(default_factory=dict)


def _to_int(s: str | None) -> int | None:
    if s is None:
        return None
    try:
        return int(s)
    except (TypeError, ValueError):
        return None


def _parse_time(fields: dict[str, str]) -> datetime:
    date = fields.get("date")
    time = fields.get("time")
    tz = fields.get("tz") or "UTC"
    if date and time:
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
            try:
                naive = datetime.strptime(f"{date} {time}", fmt)
                return naive.replace(tzinfo=UTC)
            except ValueError:
                continue
    eventtime = fields.get("eventtime")
    if eventtime and eventtime.isdigit():
        # FortiGate eventtime is ns since epoch (>=10 digits => seconds)
        ts = int(eventtime)
        if ts > 10**12:
            ts = ts // 10**9
        return datetime.fromtimestamp(ts, tz=UTC)
    _ = tz  # reserved for future timezone support
    return datetime.now(UTC)


def parse_fortigate(line: str) -> SyslogRecord:
    """Parse a single FortiGate Syslog line into ``SyslogRecord``."""
    body = _PRI_RE.sub("", line).strip()
    fields = {k: v.strip('"') for k, v in _KV_RE.findall(body)}
    return SyslogRecord(
        time=_parse_time(fields),
        device=fields.get("devname") or fields.get("devid"),
        src_ip=fields.get("srcip"),
        dst_ip=fields.get("dstip"),
        src_port=_to_int(fields.get("srcport")),
        dst_port=_to_int(fields.get("dstport")),
        action=fields.get("action"),
        threat=fields.get("attack") or fields.get("virus") or fields.get("threat"),
        severity=fields.get("level") or fields.get("severity"),
        policy_id=fields.get("policyid"),
        message=fields.get("msg"),
        raw=line,
        fields=fields,
    )


def aggregate(records: Iterable[SyslogRecord]) -> dict[str, dict[str, int]]:
    """Summarise records by threat and action (used by tests / metrics)."""
    threats: Counter[str] = Counter()
    actions: Counter[str] = Counter()
    for r in records:
        threats[r.threat or "none"] += 1
        actions[r.action or "unknown"] += 1
    return {"by_threat": dict(threats), "by_action": dict(actions)}


PersistFn = Callable[[Sequence[SyslogRecord]], Awaitable[None]]


class BatchBuffer:
    """Time/size bounded buffer that flushes to ``persist``."""

    def __init__(
        self,
        persist: PersistFn,
        max_size: int = 500,
        interval_sec: float = 1.0,
    ) -> None:
        self.persist = persist
        self.max_size = max_size
        self.interval_sec = interval_sec
        self._buf: list[SyslogRecord] = []
        self._lock = asyncio.Lock()
        self._task: asyncio.Task[None] | None = None
        self._stop = asyncio.Event()

    async def add(self, record: SyslogRecord) -> None:
        async with self._lock:
            self._buf.append(record)
            should_flush = len(self._buf) >= self.max_size
            batch: list[SyslogRecord] = []
            if should_flush:
                batch = self._buf
                self._buf = []
        if batch:
            await self._safe_persist(batch)

    async def _safe_persist(self, batch: list[SyslogRecord]) -> None:
        try:
            await self.persist(batch)
        except Exception:  # noqa: BLE001
            logger.exception("syslog persist failed (%d records dropped)", len(batch))

    async def _ticker(self) -> None:
        while not self._stop.is_set():
            try:
                await asyncio.wait_for(self._stop.wait(), timeout=self.interval_sec)
            except TimeoutError:
                pass
            await self.flush()

    async def flush(self) -> None:
        async with self._lock:
            if not self._buf:
                return
            batch = self._buf
            self._buf = []
        await self._safe_persist(batch)

    def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._ticker())

    async def stop(self) -> None:
        self._stop.set()
        if self._task is not None:
            await self._task
        await self.flush()


class SyslogUdpProtocol(asyncio.DatagramProtocol):
    def __init__(self, buffer: BatchBuffer) -> None:
        self.buffer = buffer
        self.transport: asyncio.transports.DatagramTransport | None = None

    def connection_made(self, transport: asyncio.BaseTransport) -> None:  # type: ignore[override]
        self.transport = transport  # type: ignore[assignment]
        logger.info("FortiGate syslog UDP receiver listening")

    def datagram_received(self, data: bytes, addr) -> None:  # type: ignore[override]
        try:
            line = data.decode("utf-8", errors="replace").rstrip()
            record = parse_fortigate(line)
            asyncio.create_task(self.buffer.add(record))
        except Exception:  # noqa: BLE001
            logger.exception("Failed to parse syslog line from %s", addr)


async def start_udp(
    host: str,
    port: int,
    persist: PersistFn,
    *,
    batch_size: int = 500,
    interval_sec: float = 1.0,
) -> tuple[asyncio.BaseTransport, BatchBuffer]:
    """Start a UDP syslog endpoint. Returns (transport, batch_buffer)."""
    loop = asyncio.get_running_loop()
    buffer = BatchBuffer(persist, max_size=batch_size, interval_sec=interval_sec)
    buffer.start()
    transport, _ = await loop.create_datagram_endpoint(
        lambda: SyslogUdpProtocol(buffer), local_addr=(host, port)
    )
    return transport, buffer


def record_to_row(r: SyslogRecord) -> dict:
    """Convert a record to a dict suitable for SQLAlchemy ``insert``."""
    return {
        "time": r.time,
        "device_name": r.device,
        "src_ip": r.src_ip,
        "dst_ip": r.dst_ip,
        "src_port": r.src_port,
        "dst_port": r.dst_port,
        "action": r.action,
        "threat": r.threat,
        "severity": r.severity,
        "policy_id": r.policy_id,
        "message": r.message,
        "raw": r.fields,
    }

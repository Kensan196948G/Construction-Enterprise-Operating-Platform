"""Offline-tolerant sync orchestrator.

Pipeline::

    producer (inventory/heartbeat)
        └─▶ spool.append              (always succeeds, even offline)

    drain()
        ├─▶ for each entry: api_client.send
        │     └─ success    → remove from spool
        │     └─ failure    → leave in place, stop (preserve order)
        └─▶ returns DrainResult

The spool is rewritten once per drain so partial-success keeps in-flight
ordering and never loses an event — it just defers it to the next call.

Retries across drains use caller-provided backoff. This module is agnostic
of *how long* to sleep between drains; a systemd timer or the CLI loop owns
that cadence.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from cdx_agent.api_client import ApiClient
from cdx_agent.obs.request_id import request_scope
from cdx_agent.spool import Spool, SpoolEntry

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class DrainResult:
    total: int
    sent: int
    remaining: int
    failed_status: int | None

    @property
    def all_flushed(self) -> bool:
        return self.remaining == 0


PAYLOAD_TO_PATH = {
    "heartbeat": "/api/v1/heartbeat",
    "inventory": "/api/v1/inventory",
}


class SyncOrchestrator:
    def __init__(self, api_client: ApiClient, spool: Spool):
        self._client = api_client
        self._spool = spool

    def enqueue(self, payload_type: str, body: dict[str, object], now: float) -> None:
        self._spool.append(
            SpoolEntry(
                payload_type=payload_type,
                body=body,
                enqueued_at=now,
            )
        )

    def drain(self) -> DrainResult:
        with request_scope() as request_id:
            return self._drain_inner(request_id)

    def _drain_inner(self, request_id: str) -> DrainResult:
        entries = self._spool.load_all()
        logger.info(
            "drain start: total=%d",
            len(entries),
            extra={"total_entries": len(entries), "stage": "drain_start"},
        )
        sent = 0
        failed_status: int | None = None
        for index, entry in enumerate(entries):
            path = PAYLOAD_TO_PATH.get(entry.payload_type)
            if path is None:
                # Unknown payload type is a programmer error, not a network error:
                # drop the entry so it does not clog the spool forever — but log
                # loudly so an agent-side rollback that left undeliverable entries
                # behind is observable to ops.
                logger.warning(
                    "dropping unknown payload_type=%r enqueued_at=%s",
                    entry.payload_type,
                    entry.enqueued_at,
                )
                sent += 1
                continue
            try:
                result = self._client.send(entry.payload_type, entry.body, path)
            except Exception:
                # Network / transport failure: preserve the entry and stop
                # so ordering is kept for the next drain.
                remaining = entries[index:]
                self._spool.replace_all(remaining)
                return DrainResult(
                    total=len(entries),
                    sent=sent,
                    remaining=len(remaining),
                    failed_status=None,
                )
            if result.ok:
                sent += 1
                continue
            failed_status = result.status_code
            remaining = entries[index:]
            self._spool.replace_all(remaining)
            return DrainResult(
                total=len(entries),
                sent=sent,
                remaining=len(remaining),
                failed_status=failed_status,
            )
        # All processed successfully: truncate spool. If the truncation itself
        # fails (full disk, perms), the entries were already accepted by the
        # server, so re-sending them is preferable to crashing the agent. The
        # server-side dedup key (device_id, timestamp_bucket) absorbs the dup.
        # Phase 2 NOTE: when PostgreSQL is introduced, the storage layer must
        # use ON CONFLICT DO NOTHING / upsert semantics — not bare INSERT —
        # so a failed truncate here cannot cause UNIQUE-constraint violations.
        try:
            self._spool.replace_all([])
        except OSError as exc:
            logger.warning(
                "failed to truncate spool after successful drain: %s — entries will be re-sent and deduped server-side",
                exc,
            )
        logger.info(
            "drain ok: sent=%d total=%d",
            sent, len(entries),
            extra={"sent": sent, "total": len(entries), "stage": "drain_end"},
        )
        return DrainResult(
            total=len(entries),
            sent=sent,
            remaining=0,
            failed_status=None,
        )

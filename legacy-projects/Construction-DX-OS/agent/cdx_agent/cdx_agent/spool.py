"""Local offline spool for cdx-agent.

Stores outbound events as newline-delimited JSON under
``/var/lib/cdx-agent/spool/<name>.jsonl`` by default. The design target is
construction sites with unreliable connectivity: collection must not block
on network, and a reconnecting agent must not lose events.

Atomicity model for Phase 1:
  - ``append`` is a single ``write`` call on O_APPEND; crash-safe for line-sized records.
  - ``replace_all`` rewrites via ``<file>.tmp`` + ``os.replace`` (atomic on POSIX).

Concurrent writers are NOT supported in Phase 1. The agent runs as a single
systemd service, so one writer is sufficient.
"""

from __future__ import annotations

import json
import os
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from pathlib import Path

DEFAULT_SPOOL_DIR = Path("/var/lib/cdx-agent/spool")


@dataclass(frozen=True, slots=True)
class SpoolEntry:
    payload_type: str
    body: dict[str, object]
    enqueued_at: float

    def to_dict(self) -> dict[str, object]:
        return {
            "payload_type": self.payload_type,
            "body": self.body,
            "enqueued_at": self.enqueued_at,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> SpoolEntry:
        return cls(
            payload_type=str(data["payload_type"]),
            body=dict(data["body"]),  # type: ignore[arg-type]
            enqueued_at=float(data["enqueued_at"]),  # type: ignore[arg-type]
        )


class Spool:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def append(self, entry: SpoolEntry) -> None:
        line = json.dumps(entry.to_dict(), sort_keys=True, ensure_ascii=False)
        with self.path.open("a", encoding="utf-8") as fh:
            fh.write(line + "\n")

    def iter_all(self) -> Iterator[SpoolEntry]:
        if not self.path.exists():
            return
        with self.path.open(encoding="utf-8") as fh:
            for raw in fh:
                line = raw.strip()
                if not line:
                    continue
                yield SpoolEntry.from_dict(json.loads(line))

    def load_all(self) -> list[SpoolEntry]:
        return list(self.iter_all())

    def replace_all(self, entries: Iterable[SpoolEntry]) -> None:
        tmp = self.path.with_suffix(self.path.suffix + ".tmp")
        with tmp.open("w", encoding="utf-8") as fh:
            for entry in entries:
                line = json.dumps(entry.to_dict(), sort_keys=True, ensure_ascii=False)
                fh.write(line + "\n")
        os.replace(tmp, self.path)

    def __len__(self) -> int:
        return sum(1 for _ in self.iter_all())

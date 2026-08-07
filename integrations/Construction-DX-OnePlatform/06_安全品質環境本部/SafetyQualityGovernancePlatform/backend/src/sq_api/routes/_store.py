"""In-memory store helper for骨格 CRUD (DB 切替前の dev 用)."""
from __future__ import annotations

import uuid
from threading import RLock
from typing import Any


class MemoryStore:
    """シンプルな id 付き辞書ストア."""

    def __init__(self, id_key: str) -> None:
        self._items: dict[str, dict[str, Any]] = {}
        self._lock = RLock()
        self._id_key = id_key

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            return list(self._items.values())

    def get(self, item_id: str) -> dict[str, Any] | None:
        with self._lock:
            return self._items.get(item_id)

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            new_id = data.get(self._id_key) or str(uuid.uuid4())
            data[self._id_key] = new_id
            self._items[new_id] = data
            return data

    def update(self, item_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
        with self._lock:
            cur = self._items.get(item_id)
            if not cur:
                return None
            cur.update(data)
            cur[self._id_key] = item_id
            return cur

    def delete(self, item_id: str) -> bool:
        with self._lock:
            return self._items.pop(item_id, None) is not None

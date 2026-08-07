"""共通スキーマ."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SyncEnvelopeItem(BaseModel):
    entity_type: str
    operation: str  # create / update / delete
    data: dict[str, Any]
    client_timestamp: datetime | None = None
    client_version: int = 1
    blob_ref: str | None = None


class SyncPushRequest(BaseModel):
    device_id: str
    sync_batch: list[SyncEnvelopeItem]


class SyncResultItem(BaseModel):
    entity_type: str
    status: str  # synced / conflict / error
    server_id: int | None = None
    conflict_detail: dict[str, Any] | None = None
    error: str | None = None


class SyncPushResponse(BaseModel):
    results: list[SyncResultItem]
    accepted: list[SyncResultItem] = []
    conflicts: list[SyncResultItem] = []
    rejected: list[SyncResultItem] = []

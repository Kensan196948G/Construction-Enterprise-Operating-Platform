---
id: "0007"
title: "Phase 2: swap InMemoryStorage → PostgreSQL (SQLAlchemy)"
status: done
priority: P2
phase: "Phase 2"
labels: [server, db, migration]
created: "2026-04-15"
closed: "2026-04-16"
---

## Summary

Phase 1 の in-memory storage を PostgreSQL に置換する。既存 test を
壊さないよう、`InMemoryStorage` のインターフェースを Protocol として
抽出し、`PostgresStorage` が同じインターフェースを実装する形にする。

## Required changes

1. `cdx_server/storage.py` の `InMemoryStorage` メソッドを Protocol 抽出
2. `cdx_server/storage_pg.py` 追加 (SQLAlchemy 2.x + asyncpg)
3. Alembic migration 基盤 (`server/api/migrations/`)
4. `docker-compose.yml` for dev Postgres
5. CI に Postgres service container 追加 (agent/server 個別 job にしない)

## Schema v1

- `devices(device_id PK, profile, hostname, shared_secret_hash, registered_at)`
- `heartbeats(id PK, device_id, timestamp_bucket, agent_version, uptime_seconds, sent_at, received_at, UNIQUE(device_id, timestamp_bucket))`
- `inventories(id PK, device_id, timestamp_bucket, body JSONB, received_at, UNIQUE(device_id, timestamp_bucket))`

## Acceptance Criteria

- [x] **14 tests が `PostgresStorage` + SQLite fallback で全 green** — Loop 13
- [x] **Alembic migration scaffold (0001_initial_schema.py + env.py + alembic.ini)** — Loop 13
- [x] **docker-compose で postgres:17-alpine 有効化 + DATABASE_URL 自動構成** — Loop 15
- [x] **CI に postgres:16 service container + TEST_DATABASE_URL 設定済み** — Loop 14
- [x] **DATABASE_URL 環境変数で PostgresStorage 自動選択 (app.py _build_default_storage)** — Loop 14
- [x] **`/health` に storage liveness (ping() Protocol)** — Loop 15

## 注意

- `shared_secret` を平文でなくハッシュ (bcrypt or argon2) で保持 ← Phase 3 TODO
- idempotency キーは DB の UNIQUE 制約で担保 (アプリ層で見る必要なくなる)

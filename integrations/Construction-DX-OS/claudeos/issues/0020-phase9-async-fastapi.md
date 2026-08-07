---
id: "0020"
title: "Phase 9: FastAPI 完全 async 化 (asyncpg + async SQLAlchemy)"
status: done
priority: P2
phase: "Phase 9"
labels: [architecture, performance, database]
created: "2026-04-22"
---

## Summary

現在の `PostgresStorage` は同期 SQLAlchemy (`Session`) を使用している。
FastAPI は async 環境であり、sync DB 呼び出しは `run_in_threadpool` 経由になるため
GIL によるスループット低下が発生しうる。

Phase 9 では `asyncpg` + `AsyncSession` を使った完全非同期 DB 層に移行する。

## 現状の課題

- `storage_pg.py` の全メソッドが `Session` (同期) を使用
- FastAPI の endpoint は async だが、DB 呼び出しは同期コード実行（スレッドプール経由）
- 高負荷時のスループットがブロッキング IO でボトルネックになる可能性

## 対応方針

| コンポーネント | 現在 | 移行先 |
|---|---|---|
| SQLAlchemy Engine | `create_engine` (sync) | `create_async_engine` (async) |
| Session | `Session` | `AsyncSession` |
| ドライバ | `psycopg2` | `asyncpg` |
| Storage Protocol | 同期メソッド | async メソッド |

## スコープ

- `storage_pg.py`: async SQLAlchemy に書き換え
- `storage_protocol.py`: Protocol の async 化
- `app.py`: `AsyncSession` を使った engine 設定
- テスト: `pytest-asyncio` + `aiosqlite` で SQLite async テスト
- migration: `alembic async` 対応

## Acceptance Criteria

- [ ] `storage_pg.py` が全て `async def` + `AsyncSession`
- [ ] `StorageProtocol` が async メソッド定義
- [ ] CI の pytest が `pytest-asyncio` で全通過
- [ ] `InMemoryStorage` も async Protocol 準拠
- [ ] 272+ テスト green

## 注意事項

- 大型変更のため専用ブランチ + STABLE N=5 要件
- `InMemoryStorage` も async 化が必要（Protocol 準拠のため）
- Phase 2 完了後の次大型マイルストーン

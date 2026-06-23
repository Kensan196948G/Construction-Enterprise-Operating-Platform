---
id: "0032"
title: "Alembic env.py を asyncpg 対応に更新（同期/非同期 URL 自動切替）"
status: done
priority: P2
phase: "Phase 9"
labels: [database, alembic, devx]
created: "2026-05-06"
---

## Summary

現在の `migrations/env.py` は同期 `engine_from_config` を使用しており、
`DATABASE_URL=postgresql+asyncpg://...` を渡すと MissingGreenlet エラーになる。
回避策として `psycopg2` スキームで実行しているが、これは暗黙の知識となっている。

## 対応方針

`env.py` で URL を受け取ったとき `asyncpg` → `psycopg2` に自動変換して
Alembic が常に同期エンジンで動作できるようにする（Alembic は通常 sync で使用）。

## Acceptance Criteria

- [ ] `DATABASE_URL=postgresql+asyncpg://...` を設定したまま `alembic upgrade head` が成功する
- [ ] 変換ロジックが `migrations/env.py` にコメント付きで記述されている
- [ ] CI の Alembic ステップ（`postgresql+psycopg2://`）は引き続き成功する

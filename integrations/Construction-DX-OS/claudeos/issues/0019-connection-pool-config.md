---
id: "0019"
title: "PostgreSQL 接続プール設定ドキュメント + .env.example 更新"
status: done
priority: P3
phase: "Phase 2"
labels: [docs, infra, database]
created: "2026-04-22"
---

## Summary

Phase 2 で追加した `CDX_DB_POOL_*` 環境変数（pool_size / max_overflow /
pool_recycle / pool_timeout）が `.env.example` と CONTRIBUTING.md に未記載。
本番デプロイ時の参照ドキュメントとして追記する。

## 対象環境変数

| 変数 | デフォルト | 説明 |
|---|---|---|
| `CDX_DB_POOL_SIZE` | 5 | コネクションプールサイズ |
| `CDX_DB_MAX_OVERFLOW` | 10 | プール超過許容数 |
| `CDX_DB_POOL_RECYCLE` | 300 | コネクション再作成間隔 (秒) |
| `CDX_DB_POOL_TIMEOUT` | 30 | コネクション取得タイムアウト (秒) |

## Acceptance Criteria

- [ ] `.env.example` に上記 4 変数を追記（コメント付き）
- [ ] `CONTRIBUTING.md` の環境変数セクションに追記
- [ ] README.md の設定テーブルに追記

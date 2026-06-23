---
id: "0008"
title: "Loop 4 改善で発見された残タスク"
status: done
priority: P3
phase: "Phase 1 → Phase 2 橋渡し"
labels: [followup, hardening]
created: "2026-04-15"
---

## Summary

Loop 4 までの実装で見えてきた "次の人が触るとき先に直すと良い" 細部。

## 候補

### Code quality
- [x] pytest-asyncio の deprecation warning 解消: 両 pyproject.toml に
      `asyncio_default_fixture_loop_scope = "function"` を追加 (Improvement loop)
- [x] `cdx_server.app` で routers の `_get_storage` を import するとき private 指定の `_` を抜くか
      `dependency_overrides` 経由で指定する idiom に揃える — Loop 19: 全6ルーター同一パターン確認済み、変更不要
- [x] **`api_client._build_request` → `_PreparedRequest` NamedTuple (body_bytes/headers/bucket)** — Loop 17

### Operational
- [x] **cdx-agent: JSON 構造化ログ + journalctl 対応 (stdout → systemd-journald 自動収集)** — Loop 7
- [x] **cdx-server: `/health` に storage backend liveness (`ping()`) 追加 — Loop 15** 
- [x] launcher: cdx-server 接続失敗時に UI 上に "オフライン" バッジ表示 (Loop 12 完了)

### Documentation
- [x] `docs/06_cdx-agent/03_同期・オフライン設計.md` に backoff 実装表 + mermaid sequence 追記
- [x] `docs/07_中央管理基盤/02_API サーバ設計.md` に endpoint 表 + 認証モデル + Storage Protocol 追記
- [x] `docs/05_クライアントOS/03_live-build構成案.md` に hook 一覧 + profile matrix 追記

### Testing
- [x] **contract test に 5xx → retry → success / exhausted シナリオ追加 (_FaultInjectSession)** — Loop 13
- [x] **storage_protocol が PostgresStorage でも通ることを test_storage_pg.py で確認** — Loop 13

### Deferred to Phase 2
- [ ] Codex review (remote push 後)
- [ ] CodeRabbit static-analysis pass
- [x] **PostgreSQL migration scaffold (Issue 0007)** — Loop 13
- [ ] AppArmor profile / capabilities 削減
- [ ] OpenAPI からの client SDK 自動生成 (rust / kotlin など現場アプリ向け)

---
id: "0010"
title: "Phase 4: WebUI 認証 / Redis rate-limit / OpenAPI SDK"
status: done
priority: P2
phase: "Phase 4"
labels: [auth, redis, sdk, webui, server]
created: "2026-04-16"
---

## Summary

Phase 3 WebUI 完了を受け、Phase 4 として以下を実装する:

1. **管理 WebUI 認証** — OIDC / LDAP ベースのログイン (現在は認証なし)
2. **分散 rate-limit backend** — Redis への swap (現在は InMemory プロセス内)
3. **OpenAPI クライアント SDK 自動生成** — Rust / Kotlin / TypeScript 向け

## Motivation

| 現状 | Phase 4 目標 |
|---|---|
| `/admin` は認証なし (ローカル/VPN 限定運用) | OIDC/LDAP 認証付き管理者ログイン |
| rate-limit が InMemory (スケールアウト不可) | Redis backend で水平スケール対応 |
| クライアント SDK なし (手書き HTTP) | openapi-generator で型安全クライアント |

## Scope

### Phase 4a — WebUI 認証 (P2) ✅ Loop 21 完了

- [x] HTTP Basic Auth (`CDX_ADMIN_TOKEN` 環境変数) — 追加依存ゼロ
- [x] `CDX_ADMIN_ENABLED=false` でdev モードバイパス (Phase 3 後方互換)
- [x] `secrets.compare_digest` で定数時間比較 (タイミング攻撃対策)
- [x] テスト: 未認証 → 401 + WWW-Authenticate、認証済み → 200、devモード → 200
- [ ] OIDC/LDAP 本番認証 — Phase 5 (Issue 0011) に延期

### Phase 4b — Redis rate-limit backend (P2) ✅ Loop 22 完了

- [x] `RedisRateLimiter` — Lua スクリプト sliding-window (ZADD + ZREMRANGEBYSCORE)
- [x] `REDIS_URL` 環境変数で自動選択 (未設定 → InMemory 維持)
- [x] `docker-compose.yml` に Redis 7-alpine サービス追加
- [x] fakeredis + lupa で 10件ユニットテスト (実 Redis 不要)

### Phase 4c — OpenAPI client SDK (P3) ✅ Loop 23 (JSON生成まで)

- [x] `scripts/generate_openapi.py` — `app.openapi()` で `server/api/openapi.json` 生成
- [x] CI に `--check` ステップ追加 (stale 検知)
- [x] `server/api/openapi.json` コミット済み (7 endpoints)
- [ ] `openapi-generator-cli` で TypeScript + Rust クライアントを生成 → Phase 5 (Issue 0011)

## Dependencies

- Issue 0004 (GitHub remote) — Codex/CodeRabbit レビューのため
- Issue 0009 (Phase 3 WebUI) — 完了 ✅

## Acceptance Criteria

- [x] `CDX_ADMIN_TOKEN` 設定時に `/admin` へのアクセスに認証が必要
- [x] 誤パスワードで 401 + `WWW-Authenticate: Basic` が返る
- [ ] ログアウト (Basic Auth はブラウザ管理) — OIDC 移行後に対応
- [ ] redis-backed rate-limit で既存 rate-limit テストが全通過
- [ ] `openapi.json` が CI で自動更新される

## Notes

- Phase 4a は MVP: OIDC プロバイダは Keycloak (社内) または GitHub OAuth
- Phase 4b の Redis 統合は水平スケール要件が確定してから実装でよい
- Phase 4c は OpenAPI スペックが安定してから自動生成する

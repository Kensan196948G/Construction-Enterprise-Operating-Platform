---
id: "0006"
title: "Phase 1 next: observability, backoff, systemd"
status: done
priority: P2
phase: "Phase 1"
labels: [agent, server, enhancement]
created: "2026-04-15"
---

## Summary

vertical slice (Issue 0005) が立ったので、Phase 1 の残課題を順次解消する。

## Sub-tasks

### P2 - Observability
- [x] server に basic logging (router 単位 logger)
- [x] sync が unknown payload_type を log warning
- [x] **JSON 構造化ログ (stdlib logging + JsonFormatter)** — Loop 6
- [x] **request-id middleware (contextvars + X-Request-Id echo)** — Loop 6
- [x] **`/metrics` Prometheus endpoint** (ingest_total / registration_total / auth_failure_total) — Loop 6
- [x] **agent: 構造化 JSON ログ + request-id 伝搬 (X-Request-Id)** — Loop 7
- [x] **server: `cdx_rate_limit_exceeded_total{endpoint}` メトリクス** — Loop 8

### P2 - Backoff & resilience
- [x] agent api_client に explicit timeout
- [x] agent api_client に full-jitter exponential backoff (5xx/408/429/transport)
- [x] sync が truncate 失敗で再送ループにならない安全策 (Loop 4)
- [x] **server: 429 Too Many Requests のトークンバケット実装 + Retry-After ヘッダ** — Loop 8
- [x] **agent: 429/503 の Retry-After ヘッダを honor (delta-seconds, cap clamp, malformed → backoff fallback)** — Loop 9

### P2 - systemd integration
- [x] `agent/cdx_agent/debian/cdx-agent.service`
- [x] `agent/cdx_agent/debian/cdx-agent.timer`
- [x] inventory.service / inventory.timer
- [x] hardening directives (NoNewPrivileges, ProtectSystem, ...)
- [x] sysusers.d snippet (Loop 4 fix)
- [x] **Debian packaging (debhelper) scaffold — control / rules / changelog / postinst / prerm** — Loop 12

### P2 - Storage abstraction (Phase 2 prep)
- [x] storage_protocol.Storage 抽出
- [x] runtime_checkable で test-time 確認
- [x] **policy-pull endpoint GET /api/v1/policy (PolicyRecord + PolicyResponse + router)** — Loop 10
- [x] **agent: policy client — poll GET /api/v1/policy, apply intervals (PolicyClient + poll-policy CLI)** — Loop 11
- [x] **PostgresStorage 実装 (SQLAlchemy ORM + Alembic + 14 SQLite tests)** — Loop 13 (Issue 0007)

### P3 - Dev UX
- [x] `scripts/dev-up.sh` (venv health check 付き)
- [x] `scripts/dev-register.sh` (secret tempfile経由)
- [x] **docker-compose.yml で cdx-server + Prometheus セット (Phase 2 Postgres placeholder)** — Loop 12
- [x] **Construction Hub: 接続失敗時 UI フィードバック (connecting/error/ok + 5s timeout)** — Loop 12

## Acceptance Criteria

- [x] backoff ジッタ付き retry が 5xx で動くテスト
- [x] sysusers が systemd unit と整合
- [x] secret が terminal scrollback に残らない
- [x] 構造化ログで全リクエストが JSON 1 行で出る (Loop 6+7 両側)
- [x] 過剰送信時に 429 + Retry-After で agent が backoff する契約 (Loop 8 server, Loop 9 agent)
- [ ] cdx-agent が systemd timer で 1 分毎に drain を実行できる (実機検証)

## Notes

Loop 4 で約半分解消。残りは Phase 2 開始前のラスト 1 マイル。

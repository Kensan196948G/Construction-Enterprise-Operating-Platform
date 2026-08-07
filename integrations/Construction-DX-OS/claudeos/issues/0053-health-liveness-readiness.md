---
id: "0053"
title: "Health endpoint を liveness/readiness に分離 — Kubernetes-style probes"
status: resolved
priority: P2
phase: "Month 5 Stabilize"
labels: [feature, api, health, monitoring, production]
created: "2026-05-28"
resolved: "2026-05-28"
resolved_by: "PR #47 (feat/issue-0053-health-probes)"
---

## Summary

現状の `GET /health` は storage と Redis を含む包括的なヘルスチェック (deep
dependency check) を返す。本番運用の load balancer / Kubernetes / Docker
Swarm では「liveness (プロセス生存)」と「readiness (依存接続性)」を分離す
る必要がある:

- **liveness** が false の場合 → コンテナを再起動すべき
- **readiness** が false の場合 → LB から外すが再起動はしない

現状の `/health` は readiness 相当の挙動 (storage 不通で 503) なので、
liveness probe としては使えない (DB 障害でコンテナが無限再起動するリスク)。

## 対応内容

1. `GET /health/live` を追加
   - process が起動していれば 200 を返す (依存サービスは確認しない)
   - 起動経過時刻 (uptime_seconds) と version のみ返す
   - 必ず 200 (例外時 500)

2. `GET /health/ready` を追加
   - 現状の `/health` と同じロジック (storage + Redis 確認)
   - 全て ok で 200、いずれか error で 503
   - HealthResponse schema を再利用

3. `GET /health` (既存) は後方互換のため変更しない

4. テスト追加 (`server/api/tests/test_health_probes.py` 新設、または既存
   test_health.py に追加):
   - `/health/live` が常に 200 を返す
   - `/health/ready` が ok 時 200、storage 障害時 503
   - `/health` の後方互換動作が変わっていない (回帰確認)

5. OpenAPI 再生成 (CI の `--check` が通ること)

6. SDK 再生成 (CI の `--check` が通ること)

7. ドキュメント
   - README.md の「ヘルスチェック」セクション (なければ新設)
   - docker-compose.prod.yml の healthcheck 命令を `/health/ready` に変更
     (liveness は docker 標準が process 監視なので /health/live は不要)
   - Production go-live checklist に readiness/liveness の説明追加

## Acceptance Criteria

- [ ] `GET /health/live` が 200 + JSON を返す
- [ ] `GET /health/ready` が ok で 200、storage 不通で 503 を返す
- [ ] `GET /health` の挙動が変わっていない
- [ ] テスト 5 件以上追加
- [ ] OpenAPI spec 更新済 (CI green)
- [ ] SDK 自動生成済 (CI green)
- [ ] docker-compose.prod.yml の healthcheck が `/health/ready` を参照
- [ ] CI 全 job green

## 設計メモ

- HealthResponse の `status` Literal 型を拡張する場合は Optional に → 既存
  fields を再利用する形が破壊的変更を避けやすい
- /health/live は依存を一切持たないため極めて軽量、k8s liveness 標準推奨
- /health/ready は ConnectionPool 経由の storage ping が走るため
  cold-start 時に遅延が出る可能性 — but 本来 readiness はそうあるべき

## 関連

- Issue 0046 (production hardening)
- Issue 0050 (production go-live checklist)
- Issue 0027 (monitoring / Grafana)

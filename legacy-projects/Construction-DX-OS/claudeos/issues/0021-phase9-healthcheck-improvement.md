---
id: "0021"
title: "Phase 9: /health エンドポイント強化 (readiness probe + version info)"
status: done
priority: P3
phase: "Phase 9"
labels: [observability, api]
created: "2026-04-22"
---

## Summary

現在の `/health` は liveness probe のみ（ping が通るか）。
Kubernetes や docker-compose の readiness probe として使用するには
より詳細な情報が必要。

## 追加項目

- `storage_backend`: 現在のストレージ種別 (InMemory / PostgreSQL)
- `redis_backend`: レート制限バックエンド (InMemory / Redis)
- `uptime_seconds`: サービス起動からの経過時間
- `git_revision`: デプロイ時のコミットハッシュ (ENV 経由)

## Acceptance Criteria

- [ ] GET /health に上記フィールドを追加
- [ ] `HealthResponse` Pydantic スキーマ更新
- [ ] OpenAPI --check が通る
- [ ] 既存テスト + 新規 health フィールドテストが全通過

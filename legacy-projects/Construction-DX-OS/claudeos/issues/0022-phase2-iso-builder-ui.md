---
id: "0022"
title: "Phase 2: ISO Builder UI (WebUI から live-build を非同期実行)"
status: in-progress
priority: P2
phase: "Phase 2"
labels: [feature, webui, iso, infra, phase2]
created: "2026-04-28"
progress:
  phase_a_schema: done (commit 52d3ec8 Loop 54 — Issue 0024)
  phase_b_storage: done (commit a0daa48 Loop 54 — IsoBuildStorage Protocol + 11 tests)
  phase_c_alpha_api: done (commit d41412f Loop 54 — 4 endpoints + 12 tests + SDK regen)
  phase_c_beta_webui: done (commit 4829ec8 Loop 54 — Jinja2 SSR + 4 templates + 13 tests + nav)
  phase_d_worker: done (PR #6 Loop 58 — RQ task + CDX_WORKER_MOCK=1 + 6 tests)
  phase_e_sse_log: done (PR #9 Loop 62 — GET /{id}/log EventSource + 4 tests)
  phase_f_storage: done (PR #10 Loop 63 — MinIO skeleton + download endpoint + PR #11 Loop 64 — download button)
acceptance_partial:
  - "API 5/5 endpoints done (POST/GET list/GET detail/POST cancel/GET download)"
  - "WebUI 4/4 views + download button (succeeded jobs) + SSE live log panel"
  - "SSE log streaming: GET /api/v1/iso-builds/{id}/log EventSource"
  - "MinIO presigned URL: GET /api/v1/iso-builds/{id}/download → 307"
  - "216 server tests + 10 worker tests / CI 8/8 green"
---

## Summary

中央管理 WebUI から `live-build` を非同期に呼び出し、profile 別 ISO を「ボタン操作」で生成・配布できるサブシステム。情シスが Linux build host に直接ログインしなくても ISO を作成・ダウンロードできるようにする。

設計正本: [docs/07_中央管理基盤（Central-Platform）/05_ISO-Builder-UI設計](../../docs/07_中央管理基盤（Central-Platform）/05_ISO-Builder-UI設計（ISO-Builder-UI-Design）.md)

## 動機

- 現状 `lb build` は CLI 必須 → IT 部門の負担とミス余地
- profile (`admin`/`standard`/`field`/`kiosk`/`admin-support`) 切替を UI に集約したい
- ビルド履歴 / ログ / SHA256 を中央で監査可能にしたい
- 再現性のある ISO 配布を担保したい

## スコープ

### 含むもの
- WebUI: `/admin/iso-builder` 一覧・詳細・新規・SSE ログ
- API: `POST/GET /api/v1/iso-builds` ほか 5 エンドポイント
- ジョブキュー: Redis Queue (RQ)
- 専用 build-worker (Linux host) + `cdx-build-worker.service`
- 成果物保管: MinIO/S3 互換 + 署名付き URL
- 監査ログ + Prometheus メトリクス

### 含まないもの
- package-list の WebUI 編集 (PR フロー継続)
- Debian ベースバージョン切替 (trixie 固定)
- APT ミラー / リング配信 (別系統)

## マイルストーン

| Step | 内容 | 完了条件 |
|---|---|---|
| 2.1 | DB schema + Alembic | `iso_build_jobs` / `iso_build_audit` 2 テーブル |
| 2.2 | API スケルトン + 認可 | 5 エンドポイントが 401/403/200 |
| 2.3 | RQ + mock worker | enqueue → succeeded で dummy ISO 出力 |
| 2.4 | 実 live-build 連携 | 専用ホストで `field` profile が ISO 完成 |
| 2.5 | WebUI 一覧/詳細/SSE | tail -f ログ表示 |
| 2.6 | 署名付きダウンロード | MinIO presigned URL |
| 2.7 | 監査ログ + メトリクス | Grafana 可視化 |
| 2.8 | E2E + ドキュメント | Playwright で「ビルド→DL」緑 |

## Acceptance Criteria

- [ ] 情シス担当者が CLI に触れず ISO を 1 件以上ビルド・ダウンロードできる
- [ ] ジョブ失敗時に WebUI 上で原因 (build.log の最後 200 行) を確認できる
- [ ] 同じ `git_ref` + `profile` で再実行すると SHA256 が一致する
- [ ] Admin 以外のロールは API/UI から 403 を受ける
- [ ] `iso_build_audit` に actor / action / job_id / request_id が残る
- [ ] Prometheus に `cdx_iso_build_total{profile,status}` 等のメトリクスが流れる
- [ ] `pytest` + `ruff` + `openapi --check` が全 green

## 依存

- `redis` パッケージ + `rq`
- `minio` Python client もしくは `boto3`
- live-build がインストール済の Debian ホスト
- Issue 0007 (PostgreSQL 移行) ✅ 完了済み

## リスク

- live-build 実行時間 20〜40 分 → SSE/ポーリング設計必須
- ISO 1〜3 GB → ストレージ容量計画
- root 権限が必要 → API ホスト直下では動かさない (隔離 VM)
- Secret (registration_token / shared_secret) を ISO に焼き込まない (postinstall で配布)

## 関連 Issue

- 0023: ISO Builder build-worker 実装 (RQ + live-build runner)
- 0024: iso_build_jobs / iso_build_audit テーブル + Alembic migration

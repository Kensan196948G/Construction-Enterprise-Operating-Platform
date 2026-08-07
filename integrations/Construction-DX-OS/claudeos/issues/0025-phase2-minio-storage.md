---
id: "0025"
title: "Phase 2: MinIO/S3 成果物ストレージ (presigned URL配布)"
status: design
priority: P2
phase: "Phase 2"
labels: [feature, infra, iso, phase2, storage, minio]
created: "2026-05-06"
---

## Summary

Issue 0023 Phase F。build-worker が生成した ISO + build.log を MinIO (S3互換) に
アップロードし、管理WebUIからワンクリックで presigned URL ダウンロードを提供する。
情シスが SSH ログイン不要で ISO を安全に取得できるようにする。

## 配置

- `build/worker/cdx_build_worker/minio_client.py` — MinIO PUT + presigned GET
- `server/api/cdx_server/routers/iso_builds.py` — GET /{id}/download → presigned URL redirect
- `server/api/templates/admin/iso_build_detail.html` — ダウンロードボタン追加

## 動作フロー

1. build-worker が ISO 完成後に `minio_client.upload_iso(job_id, path)` 呼出
2. MinIO に `iso/{job_id}/construction-dx-os.iso` と `iso/{job_id}/build.log` を PUT
3. `iso_storage.update_iso_build_job(job_id, iso_path="s3://...", sha256=..., size=...)` で DB更新
4. WebUI の詳細ページに「⬇ ISOをダウンロード」ボタン表示
5. ボタンクリック → `GET /api/v1/iso-builds/{id}/download` → presigned URL に 307 redirect
6. URL 有効期間: 1時間（設定可能: `CDX_MINIO_PRESIGN_EXPIRES`）

## Acceptance Criteria

- [ ] `CDX_MINIO_URL` / `CDX_MINIO_ACCESS_KEY` / `CDX_MINIO_SECRET_KEY` で接続設定
- [ ] mock モード (`CDX_WORKER_MOCK=1`) では実 MinIO 不要（iso_path = "mock://..."のまま）
- [ ] `GET /api/v1/iso-builds/{id}/download` → 307 + presigned URL
- [ ] 未完了ジョブ (queued/running) は 409 Conflict
- [ ] WebUI 詳細ページにダウンロードボタン（succeeded のみ有効）
- [ ] minio-client テスト (mock S3 使用): 3件以上

## 依存

- Issue 0022 Phase C (API + WebUI) ✅
- Issue 0024 Phase A/B (schema + storage) ✅
- Issue 0023 Phase D (build-worker mock) ✅
- Issue 0023 Phase E (SSE log) ✅

## 環境変数

| 変数 | デフォルト | 説明 |
|---|---|---|
| CDX_MINIO_URL | — | MinIO エンドポイント (例: http://minio:9000) |
| CDX_MINIO_ACCESS_KEY | — | アクセスキー |
| CDX_MINIO_SECRET_KEY | — | シークレットキー |
| CDX_MINIO_BUCKET | cdx-iso | バケット名 |
| CDX_MINIO_PRESIGN_EXPIRES | 3600 | presigned URL 有効秒数 |

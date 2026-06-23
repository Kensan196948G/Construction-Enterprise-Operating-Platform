# Issue 0069: OpenAPI スキーマ改善 / API ドキュメント整備

## 概要

FastAPI の OpenAPI メタデータを v1.0-rc1 相当に更新し、エンドポイント管理者・外部利用者向けの API ドキュメントを整備する。

## 背景

- `description` が "Construction DX OS central platform API (Phase 1)." のまま (陳腐化)
- `openapi_tags` 未設定 — Swagger UI / ReDoc でタググループの説明が表示されない
- `health.py` ルーターがルーターレベルで tags 未設定
- `contact` / `license_info` 未設定
- v1.0-rc1 リリース前に API ドキュメント品質を向上させる

## 受入れ基準

- [x] `app.py` の `description` を v1.0-rc1 相当に更新
- [x] `openapi_tags` で各タグ (devices/heartbeat/inventory/health/dashboard/pxe/iso-builds/serial-scan/registration/admin/policy) に説明文追加
- [x] `contact` / `license_info` を FastAPI メタデータに追加
- [x] `health.py` ルーターにルーターレベルの tags 設定
- [x] CI green 維持 (PR #64: 12/12 pass)
- [x] `GET /openapi.json` で全タグに description が表示されること (test_openapi_schema.py 7 tests pass)

## ステータス: RESOLVED (Loop 101, 2026-06-17, PR #64 CI 12/12 green)

## スコープ

- `server/api/cdx_server/app.py` の FastAPI メタデータ更新
- `server/api/cdx_server/routers/health.py` の router tags 設定
- テスト追加 (openapi.json スキーマ検証)

## 対象外

- ルーター実装の変更
- 新エンドポイント追加

## 優先度: P3

## 担当: Developer + QA

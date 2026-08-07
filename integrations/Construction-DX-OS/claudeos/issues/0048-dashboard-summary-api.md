---
id: "0048"
title: "GET /api/v1/dashboard — デバイス・ISO build・サーバー状態の集約エンドポイント"
status: resolved
priority: P2
phase: "Month 5 Stabilize"
labels: [feature, api, dashboard, monitoring]
created: "2026-05-14"
resolved: "2026-05-28"
resolved_by: "server/api/cdx_server/routers/dashboard.py + test_dashboard.py + SDK 全完備"
---

## Resolution (Loop 89)

ledger drift 補正: 本 Issue で要求された全項目は既存実装で完了済み:

- `server/api/cdx_server/routers/dashboard.py` 実装済み
- `server/api/tests/test_dashboard.py` テスト存在 (8+ ケース)
- `sdk/python/cdx_client/api/dashboard_api.py` と
  `sdk/typescript/src/apis/DashboardApi.ts` 自動生成済み
- Admin SPA の `proto-page-dashboard.jsx` が `/api/v1/dashboard` を消費

CI 直近 run `26222532729` で関連 cdx-server ジョブ green。

## Summary

Admin SPA やモニタリングシステムが dashboard 集約データを単一エンドポイントで取得できるよう、
`GET /api/v1/dashboard` を追加する。

## 対応内容

1. `GET /api/v1/dashboard` エンドポイントを追加
   - デバイス数 (total / online / offline / warning)
   - ISO build 数 (total / running / succeeded / failed)
   - サーバー状態 (storage / redis / uptime)

2. `DashboardResponse` Pydantic モデルを追加

3. テスト追加 (`test_dashboard.py`)

4. OpenAPI spec 更新 + SDK 再生成

## Acceptance Criteria

- [ ] `GET /api/v1/dashboard` が 200 + JSON を返す
- [ ] `devices.total`, `iso_builds.total`, `server.uptime_seconds` が含まれる
- [ ] Admin 以外のロールからも閲覧可能 (監視システム用)
- [ ] テスト追加 (最低 5 テスト)
- [ ] CI green

## 関連

- Issue 0039 (Admin SPA)
- Issue 0047 (E2E CI)

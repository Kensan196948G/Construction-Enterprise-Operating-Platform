---
id: "0049"
title: "Admin SPA Dashboard — /api/v1/dashboard からライブデータ取得"
status: done
priority: P2
phase: "Month 5 Stabilize"
labels: [webui, admin, spa, react, api]
created: "2026-05-14"
resolved: "2026-05-14"
---

## Summary

Admin SPA のダッシュボードページが `/api/v1/dashboard` からリアルタイムデータを取得し、
端末数・オンライン数・ISO build 数を実際の API データで表示するようにした。

## 実装

- `proto-page-dashboard.jsx`: `React.useEffect` + `fetch('/api/v1/dashboard')` 追加
  - マウント時に非同期取得 (AbortController でクリーンアップ)
  - API 到達時: 端末数 / オンライン / オフライン / 警告 / ISO build 数を LIVE データで表示
  - API 未到達時: 既存モックデータをフォールバック (プログレッシブ強化)
  - LIVE バッジ (緑) でリアルタイム更新を視覚的に示す
- `dist/bundle.js` 再ビルド済み (npm run build)

## Acceptance Criteria

- [x] `/admin-spa/` ダッシュボードが API データで数値を更新する
- [x] API 不到達時はモックデータを表示（フォールバック）
- [x] dist/bundle.js が再ビルドされている
- [x] 325 tests green

## 関連

- Issue 0048 (GET /api/v1/dashboard)
- Issue 0039 (Admin SPA)

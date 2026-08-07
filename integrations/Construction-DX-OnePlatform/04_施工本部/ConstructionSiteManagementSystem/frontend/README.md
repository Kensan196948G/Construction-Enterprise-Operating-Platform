# cdx-site-frontend (施工管理 PWA)

React 18 + TypeScript + Vite + Workbox + Dexie.js による PWA フロントエンド。

## 起動

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## オフライン対応

- **Service Worker** (`src/sw.ts`): Workbox による precache + runtime cache + Background Sync
- **IndexedDB** (`src/db/dexie.ts`): `projects/schedules/dailyReports/photos/blackboards/attendances/syncQueue`
- **Background Sync**: `useOfflineSync` フックがオンライン復帰時に `/api/v1/sync/push` を再送

## 主要画面

| パス | 画面 | オフライン |
|------|------|:---------:|
| /dashboard | 現場ダッシュボード | ○ |
| /schedule  | ガントチャート | ○ |
| /progress  | 出来高入力 | ○ |
| /cost      | 原価分析 (EAC) | ○ |
| /daily-report | 作業日報 / KY | ○ |
| /photo     | 写真撮影 + AI分類 | ○ |
| /blackboard | 電子黒板 (SHA-256) | ○ |
| /attendance | 入退場 (QR) | ○ |
| /equipment | 重機 | △ |
| /sync      | 同期ステータス | - |

## ビルド

```bash
npm run build
npm run preview
```

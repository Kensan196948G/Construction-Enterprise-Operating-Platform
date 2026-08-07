# Marine Fleet Management Frontend (cdx-marine-frontend)

船舶運航管理プラットフォーム フロントエンド (React 18 + Vite + Tailwind + Leaflet 海図).

## 起動

```bash
# モノレポルートで shared-ui をビルド (初回のみ)
npm i --workspaces --include-workspace-root --legacy-peer-deps
npm -w @cdx/shared-ui run build

# 当 frontend を起動 (port 5175)
npm -w cdx-marine-frontend run dev
```

API プロキシ: `/api` → `http://localhost:8000` (vite.config.ts).

## ページ

| パス | 用途 |
|---|---|
| `/dashboard` | 船隊 KPI: 稼働率 / 燃料 / 工事貢献 / 連続無事故時間 |
| `/vessels` | 船舶一覧 (船種別カラー) |
| `/vessels/:id` | 船舶諸元 + 最新位置 + 稼働率 |
| `/voyages` | 運航計画 + 計画/実績 |
| `/map` | Leaflet 海図 + 全船リアルタイム位置 + 海象オーバーレイ |
| `/fuel` | 燃料補給/残量推移 + FuelGauge |
| `/crew` | 乗組員 + 連続乗船日数アラート |
| `/weather` | 気象庁海上予報 + 海象観測 |
| `/port-calls` | 寄港記録 |

## コンポーネント

- `VesselMarker`: 船種別カラー + 針路で回転する Leaflet ship icon
- `WeatherOverlay`: 風 / 波高 / 視程 表示
- `FuelGauge`: 燃料残量バー + 燃費 L/h 表示
- `CrewRosterCard`: 連続乗船日数 30 日超の警告表示

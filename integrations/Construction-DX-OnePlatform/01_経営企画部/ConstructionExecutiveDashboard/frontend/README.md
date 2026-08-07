# Construction Executive Dashboard — Frontend

React 18 + TypeScript + Vite + TailwindCSS + Recharts/D3 + Zustand + React Router。

## ページ
- `/dashboard` — 経営 KPI ワンビュー (受注/利益/原価/事故/労務)
- `/kpi` — KPI ドリルダウン (棒グラフ + テーブル)
- `/forecast` — AI 予測 (Prophet, 信頼区間付き時系列)
- `/alerts` — 経営アラート一覧 + 通知先
- `/bcp` — BCP 状況マップ
- `/esg` — ESG/SDGs ダッシュボード (レーダーチャート)
- `/board-report` — 取締役会報告書プレビュー / Markdown / PDF (stub)

## 起動
```bash
# 依存解決はリポジトリルートの npm workspace から
cd ../../..
npm install

# dev server
cd 01_経営企画部/ConstructionExecutiveDashboard/frontend
npm run dev
```

`http://localhost:5173/` で開く。`/api` は `http://localhost:8000` (バックエンド) にプロキシされる。

## 共通 UI
- `@cdx/shared-ui` から PageHeader / DataTable などを利用予定 (Phase2)

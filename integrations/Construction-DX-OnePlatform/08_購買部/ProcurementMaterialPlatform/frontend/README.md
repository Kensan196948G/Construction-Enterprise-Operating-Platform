# cdx-proc-frontend — 購買・調達 Web

Vite + React 18 + TypeScript + Tailwind + recharts。`@cdx/shared-ui` をワークスペース経由で参照。

## ページ構成

| Path | 役割 |
|------|------|
| `/dashboard` | 発注 / 在庫 / 評価ランクの KPI |
| `/suppliers` | 協力会社一覧 (ランクバッジ表示) |
| `/suppliers/:id` | 詳細 + 評価実行 |
| `/requests` | 購買依頼 (作成 + 一覧) |
| `/approvals` | 承認待ち一覧 (ステップ可視化) |
| `/orders` | 発注一覧 |
| `/orders/new`, `/orders/:id` | 発注書編集 (明細 + 合計自動計算) |
| `/deliveries` | 納品検収 |
| `/inventory` | 在庫照会 + アラート |
| `/prices` | 価格推移 + 月次トレンド |

## セットアップ

ルート (`D:\Construction-DX-OnePlatform`) で npm workspaces を有効化している前提。

```bash
cd D:\Construction-DX-OnePlatform
npm install --workspaces --legacy-peer-deps
npm -w @cdx/shared-ui run build
npm -w cdx-proc-frontend run dev
```

dev server: <http://localhost:5174> (proxy: `/api` → <http://localhost:8000>)

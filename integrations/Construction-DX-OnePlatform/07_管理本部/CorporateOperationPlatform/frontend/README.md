# @cdx/corp-frontend (Corporate Operation Platform)

経理 / 原価 / 契約 / 法務 / 総務 / 人事 の管理本部統合 UI。

## ページ
- ダッシュボード (経営 KPI)
- 仕訳入力 + 試算表
- 工事原価 / EVM 分析
- インボイス管理 (適格請求書発行事業者番号検証バッジ付き)
- 買掛 / 売掛 / 督促
- 契約管理 / 法務案件
- 電帳法アーカイブ (改ざん検証 + 訂正履歴)

## セットアップ
```bash
cd 07_管理本部/CorporateOperationPlatform/frontend
npm install
npm run dev   # http://localhost:5174
```

API ベース URL: `VITE_API_BASE` (default: `http://localhost:8000/api/v1`)

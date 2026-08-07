# cdx-crm-api — 建設CRM・入札管理 API

Construction DX One Platform 営業本部の建設 CRM & 入札管理 API。

## 主要機能

- 顧客マスタ (与信ランク A/B/C/D/未評価, 関係性スコア, 取引履歴サマリ)
- 案件パイプライン (受注確度 / 受注予想金額 / 受注予想日)
- 入札情報 (公共 / 民間 双方サポート、総合評価点、競合分析)
- 見積 (バージョン管理 + 電帳法対応の PDF 保管 + sha256)
- 契約 (建設業法 19 条準拠の必須項目)
- 営業活動 (訪問/電話/メール/提案、フォローアップ管理)
- ダッシュボード集計 (受注見込 / 受注実績 / 失注分析)

## 起動

```bash
# 依存解決 (リポジトリルートで uv 推奨)
uv sync

# DB マイグレーション
cd 02_営業本部/ConstructionCRM-BidManagement/backend
uv run alembic upgrade head

# Dev server
uv run uvicorn crm_api.main:app --reload --port 8000
```

## テスト

```bash
cd 02_営業本部/ConstructionCRM-BidManagement/backend
uv run pytest -q
```

## 法令準拠

- 建設業法: 契約必須項目 / 与信管理
- 品確法: 入札情報の総合評価点記録
- 電帳法: 見積 PDF は不可変ファイル + sha256 + 10 年保管 (default)

## API プレフィクス

`/api/v1/...` (clients, opportunities, bids, quotations, contracts, activities, dashboard)

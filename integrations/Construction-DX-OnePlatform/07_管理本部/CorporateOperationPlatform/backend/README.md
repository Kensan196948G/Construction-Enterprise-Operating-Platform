# cdx-corp-api (Corporate Operation Platform API)

経理 / 原価 / 契約 / 法務 / 総務 / 人事 を統合する管理本部基盤。
電子帳簿保存法 / インボイス制度 / 建設業法 準拠。

## 機能ドメイン
- 仕訳・試算表・B/S/P/L (`accounting`)
- 工事原価 + EVM (PV/EV/AC, CV/SV/CPI/SPI) (`costs`)
- 請求書 + 適格請求書発行事業者番号検証 (`invoices`)
- 買掛 / 売掛 / 督促 (`payables`, `receivables`)
- 契約管理 (`contracts`)
- 法務案件 (`legal`)
- 電帳法アーカイブ (SHA-256 + タイムスタンプ + 訂正履歴) (`archives`)
- 経営 KPI ダッシュボード (`dashboard`)

## セットアップ
```bash
cd 07_管理本部/CorporateOperationPlatform/backend
uv sync  # または: pip install -e .[dev]
```

## 起動
```bash
uvicorn corp_api.main:app --reload --port 8000
```

開発用に認証はデフォルトでバイパス (`CORP_DISABLE_AUTH=1`)。
本番では Entra ID + HENNGE SSO の `cdx_auth` 経由で `Authorization: Bearer <jwt>` 必須。

## テスト
```bash
pytest
```

## DB マイグレーション
```bash
alembic upgrade head
```

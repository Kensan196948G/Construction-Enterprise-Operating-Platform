# Construction DX — Cross-department Mock Server

部門間 API の開発時スタブ。実 API がまだ立っていなくても、
01 経営ダッシュボードや 11 データ基盤の **aggregator** / **ingest** ロジックの動作確認ができる。

## エンドポイント (11 部門 + ヘルス)

- `GET /health`
- `GET /api/v1/exec/stats`         — 01 経営企画
- `GET /api/v1/crm/stats`          — 02 営業 (CRM・入札)
- `GET /api/v1/solution/stats`     — 03 ソリューション営業
- `GET /api/v1/construction/stats` — 04 施工
- `GET /api/v1/tech/stats`         — 05 技術 (BIM / ナレッジ)
- `GET /api/v1/safety/stats`       — 06 安全品質
- `GET /api/v1/corp/stats`         — 07 管理
- `GET /api/v1/proc/stats`         — 08 購買・調達
- `GET /api/v1/marine/stats`       — 09 船舶事業
- `GET /api/v1/itsm/stats`         — 10 IT-DX
- `GET /api/v1/data/stats`         — 11 統合データ基盤

## ローカル起動

```bash
# 単体
docker build -t cdx-mocks ./mocks
docker run --rm -p 8090:8090 cdx-mocks

# compose 経由 (profile=mocks を有効化)
docker compose --profile mocks up -d mocks
```

PowerShell の場合は以下のラッパースクリプトでも起動可能:

```powershell
./scripts/start-mocks.ps1
```

## 環境変数による切り替え (例)

01 経営 backend / 11 data backend が他部門 API を呼ぶ際は、
`EXEC_AGGREGATOR_BASE_URL=http://mocks:8090` のような形で各 backend に注入し、
実 API or mocks をスイッチできるよう設計することを推奨。

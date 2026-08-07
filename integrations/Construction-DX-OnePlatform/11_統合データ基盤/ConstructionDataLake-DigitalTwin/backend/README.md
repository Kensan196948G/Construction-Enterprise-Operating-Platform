# Construction DX — Integrated Data Lake & Digital Twin API (`cdx-data-api`)

統合データ基盤 (11 番領域) のバックエンド。各部門 (01-10) のデータを ETL で取り込み、
DataLake / AI / IoT / デジタルツイン の各 API を提供する。

## アーキテクチャ

```
[01..10 部門 API/DB]
       │ async httpx fetch
       ▼
   ETL Engine (Airflow DAG = services.etl_engine.run_etl)
       │ rename / drop / cast / filter
       ▼
   Data Lake (PostgreSQL: raw / curated / serving zones)
       │
       ├─► Analytics (dbt → t_analytics_dataset)
       ├─► AI Inference (sklearn / Azure OpenAI / forecast)
       ├─► Elasticsearch index (kuromoji)
       └─► Digital Twin scene builder (GeoJSON Feature for Cesium)

[現場センサー/ICT建機/船舶AIS] ── MQTT/HTTP ──► t_iot_telemetry (Timescale hypertable)
                                              ──► Digital Twin overlay
```

## ローカル起動

```bash
cd 11_統合データ基盤/ConstructionDataLake-DigitalTwin/backend
python -m venv .venv && source .venv/bin/activate  # PowerShell: .venv\Scripts\Activate.ps1
pip install -e ".[dev]"

# DB migration (要: PostgreSQL 16 + PostGIS + TimescaleDB)
alembic upgrade head

# dev server
uvicorn data_api.main:app --reload --port 8000

# tests
pytest -q
```

## 主要エンドポイント

| Path | 説明 |
|------|------|
| `GET /health` | ヘルスチェック |
| `GET /api/v1/sources` | 部門別データソース一覧 |
| `POST /api/v1/etl/jobs/{id}/run` | ETL ジョブ手動起動 (Background) |
| `GET /api/v1/lake/tables/{id}/sample` | DataLake サンプル取得 |
| `POST /api/v1/analytics/query` | 分析クエリ (識別子サニタイズ + パラメタライズ) |
| `POST /api/v1/ai/models/{id}/infer` | AI 推論 (sklearn / Azure OpenAI / forecast) |
| `POST /api/v1/iot/telemetry` | IoT テレメトリ受信 (HTTP) |
| `GET /api/v1/digital-twin/scene` | Cesium 用 GeoJSON シーン |
| `POST /api/v1/search` | 横断 ES 検索 (kuromoji) |
| `GET /api/v1/dashboard/summary` | プラットフォーム集約 KPI |

## 設定 (環境変数; `DATA_` プレフィックス)

| 変数 | デフォルト | 用途 |
|------|-----------|------|
| `DATA_DATABASE_URL` | `postgresql+psycopg2://datalake:datalake@localhost:5432/datalake` | DB |
| `DATA_ELASTICSEARCH_URL` | `http://localhost:9200` | 横断検索 |
| `DATA_AZURE_OPENAI_ENDPOINT` | `""` | 空なら mock 推論 |
| `DATA_CESIUM_ION_ACCESS_TOKEN` | `""` | 空なら OSM フォールバック |
| `DATA_MQTT_BROKER_HOST/PORT` | `localhost:1883` | IoT |

## 設計方針

- **ETL**: `services.etl_engine.run_etl` を Airflow DAG / FastAPI Background から
  共通呼び出し。テストは In-Memory Sink で並列実行可。
- **Digital Twin**: `services.digital_twin_builder` は DigitalTwinObject + IotDevice
  を **GeoJSON FeatureCollection** に統合。Cesium / Leaflet どちらでも消費可。
- **AI**: `services.ai_inferencer.dispatch` がモデルタイプで自動振り分け。
  バックエンド未設定時は `mock=true` で安全フォールバック。
- **検索**: `kuromoji_text_mapping()` で日本語フィールドに `ja_default` analyzer
  を全フィールド適用 (dynamic template)。
- **本番運用**: DataLake は将来 BigQuery / Snowflake へ移行可能な抽象を
  `services.etl_engine.Sink` で確保。

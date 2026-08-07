# Marine Fleet Management API (cdx-marine-api)

船舶運航管理プラットフォーム バックエンド (FastAPI + SQLAlchemy + PostGIS + TimescaleDB).
みらい建設の海上工事 (起重機船 / 浚渫船 / 曳船 / 作業船) 向け船隊運航・AIS 連携・燃費・乗組員管理を提供する。

## 主機能

- 船舶マスタ CRUD / 稼働率
- 運航計画 (planned / departed / in_transit / arrived) + ETA 計算 (Haversine + 海象補正)
- 船位履歴 (TimescaleDB hypertable) + 最新位置
- AIS AIVDM/AIVDO センテンス解析 (Type 1/2/3 Position Report)
- 海象データ (気象庁海上予報 stub)
- 燃料記録 + 燃費分析 (L/h, L/NM, CO2 排出量)
- 乗組員管理 + 船員労働法準拠チェック (連続乗船 30 日 / 週休 24h)
- 寄港記録 / 船舶 × 工事案件紐付
- 船隊ダッシュボード KPI

## ローカル開発

```bash
cd 09_船舶事業部/MarineFleetManagement/backend
uv venv && uv pip install -e ".[dev]"
uv run uvicorn marine_api.main:app --reload --port 8000
uv run pytest -q
```

## マイグレーション

```bash
uv run alembic upgrade head
```

TimescaleDB 拡張が有効化されていれば `t_marine_vessel_position` と `t_marine_weather` が
hypertable 化される (DO ブロックで判定)。

## ドメインロジック

| サービス | 役割 |
|---|---|
| `services/ais_receiver.py` | AIVDM 6bit ASCII → MMSI / 経緯度 / SOG / COG 解析 |
| `services/eta_calculator.py` | Haversine 大圏距離 + 波高補正 ETA |
| `services/fuel_efficiency.py` | L/h, L/NM, CO2 (A 重油 3.06 kg/L) |
| `services/weather_fetcher.py` | httpx で気象庁 API 取得 + フォールバック |
| `services/crew_compliance_checker.py` | 船員法準拠 (連続乗船 / 週休) |

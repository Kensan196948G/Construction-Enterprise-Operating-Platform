# cdx-sq-api (Safety & Quality Governance Platform API)

ISO 9001 / 14001 / 45001、労安法、i-Construction 2.0 準拠の安全品質ガバナンス API。

## 起動

```bash
cd backend
pip install -e ".[dev]"
export PYTHONPATH=$PWD/src
uvicorn sq_api.main:app --reload --port 8000
```

OpenAPI: http://localhost:8000/docs

## マイグレーション

```bash
alembic upgrade head
```

## テスト

```bash
PYTHONPATH=src pytest -q
```

## 主要エンドポイント

| パス | 機能 |
|------|------|
| `/api/v1/near-miss` | ヒヤリハット + 4M 分析 |
| `/api/v1/ky-activities` | KY 活動 |
| `/api/v1/accidents/stats` | 度数率 / 強度率 |
| `/api/v1/patrols` | 安全パトロール |
| `/api/v1/quality-records` | 品質記録 (規格上下限自動判定) |
| `/api/v1/nonconformity` | 不適合 + CAPA |
| `/api/v1/iso-audits` | ISO 監査 + テンプレ |
| `/api/v1/environmental/co2` | CO2 Scope1/2/3 集計 |
| `/api/v1/ai/predict-risk` | AI 危険予測 (Azure OpenAI stub) |

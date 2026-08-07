# Construction Executive Dashboard — Backend (`cdx-exec-api`)

経営層向けの統合 KPI / AI 予測 / 経営アラート / BCP / ESG / 取締役会報告書 API。

## アーキテクチャ
- FastAPI + SQLAlchemy 2.0 (async) + Alembic
- `cdx-shared-auth` (Entra ID + HENNGE SSO)
- `cdx-shared-db` (共通マスタ: Project / Branch / Department / Employee 等)
- 他部門 API (`/api/v1/{sales,construction,safety,corporate,procurement,itsm}/stats`) を httpx で集約
- Prophet (時系列予測) + scikit-learn (分類: 赤字案件 / 工期遅延 / 人材不足)

## セットアップ
```bash
# uv 推奨 (Python 3.12)
cd backend
uv sync --python 3.12

# テスト
uv run pytest -q

# 開発サーバ
uv run uvicorn exec_api.main:app --reload --port 8000
```

## Alembic
```bash
uv run alembic upgrade head
```

## 主要エンドポイント (`/api/v1` prefix)
| Path | 説明 |
|------|------|
| `GET /dashboard/summary` | 主指標一覧 + 期間集計 |
| `GET /kpi`, `POST /kpi` | KPI スナップショット CRUD |
| `GET /kpi/aggregate` | KPI 種別集計 |
| `POST /forecasts/timeseries` | Prophet による時系列予測 |
| `POST /forecasts/deficit` | 赤字案件予測 (GBR) |
| `POST /forecasts/delay` | 工期遅延予測 (RF) |
| `POST /forecasts/workforce` | 人材需給ギャップ |
| `GET /alerts`, `POST /alerts/evaluate` | 経営アラート評価 |
| `GET /bcp/status` | BCP 拠点別状況 |
| `GET /esg/metrics`, `POST /esg/scorecard` | ESG/SDGs 指標 |
| `POST /reports/generate` | 取締役会報告書生成 |

## RBAC
- 一般参照: 認証済みユーザー
- 書き込み (KPI/BCP/ESG/Reports): `EXECUTIVE` または `SYSTEM_ADMIN` ロール必須

## 集約サービス
- httpx + 5秒タイムアウト
- 失敗時: 直近のキャッシュ (TTL 5 分) -> プレースホルダ 0
- 環境変数 `SALES_API_BASE` 等で各サブシステム URL を指定

## AI 予測
- Prophet 未インストール時は naive 線形外挿にフォールバック (CI 環境向け)
- scikit-learn のラベル付き学習データが 10 件未満ならルールベースで採点
- Azure OpenAI (任意): `AZURE_OPENAI_*` を設定すると取締役会報告書 AI 要約を有効化 (skeleton)

# cdx-api-gateway

Construction DX One Platform の **統合APIゲートウェイ** (FastAPI)。
各部門API への統一エントリポイント・認証・レート制限・ログ集約・CORS・ヘルスチェック・Prometheus メトリクスを担います。

## 主な機能

- Entra ID (OIDC) 認証 — `cdx-shared-auth` の `EntraOIDCMiddleware` を利用
- slowapi による IP+ユーザー単位のレート制限 (デフォルト 600 req/min)
- structlog による JSON 構造化ログ (request_id / 処理時間 / ステータス)
- httpx を用いた各部門API へのリバースプロキシ
- `/health` (liveness), `/ready` (readiness: Postgres / Redis / Elasticsearch 到達確認)
- `/metrics` Prometheus エンドポイント
- 共通レスポンス / エラーフォーマット (cdx-shared-auth と整合)

## ルーティング表

| メソッド | パス | 転送先 |
|---|---|---|
| ANY | `/api/v1/construction/{path}` | `SITE_API_URL` |
| ANY | `/api/v1/safety/{path}` | `SAFETY_API_URL` |
| ANY | `/api/v1/itsm/{path}` | `ITSM_API_URL` |
| ANY | `/api/v1/procurement/{path}` | `PROCUREMENT_API_URL` |
| ANY | `/api/v1/sales/{path}` | `SALES_API_URL` |
| GET | `/health` | (自身, 認証不要) |
| GET | `/ready` | (自身, 認証不要) |
| GET | `/metrics` | (自身, 認証不要) |
| GET | `/docs`, `/openapi.json` | (自身, 認証不要) |

転送時に以下のヘッダーを付与します:

- `Authorization` (元リクエスト)
- `X-Request-ID` (なければ生成)
- `X-Department` (`construction` / `safety` / `itsm` / `procurement` / `sales`)
- `X-User-Oid` / `X-User-Sub` / `X-User-Email` (認証済みの場合)

## 共通レスポンスフォーマット

成功:

```json
{ "status": "success", "data": { ... }, "meta": { ... } }
```

失敗:

```json
{
  "status": "error",
  "error": {
    "code": "UPSTREAM_TIMEOUT",
    "message": "...",
    "details": [{ "field": "...", "issue": "..." }]
  }
}
```

## セットアップ (Windows 11 / PowerShell)

```powershell
# 1. リポジトリ直下から
cd D:\Construction-DX-OnePlatform\00_共通基盤\api-gateway

# 2. 仮想環境 (uv 推奨)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. 依存導入 (ローカルの shared-auth を editable で参照)
pip install -e ..\shared-auth
pip install -e ".[dev]"

# 4. 環境変数
Copy-Item .env.example .env

# 5. 起動
uvicorn cdx_gateway.main:app --host 0.0.0.0 --port 8080 --reload
```

開発時に認証を一時的にバイパスするには:

```powershell
$env:CDX_GATEWAY_DISABLE_AUTH = "1"
uvicorn cdx_gateway.main:app --reload
```

## テスト

```powershell
pytest -q
```

`tests/test_proxy.py` は `httpx.MockTransport` を用いて、実バックエンド無しで
プロキシ動作 / タイムアウト / 到達不可 / ヘッダー転送 を検証します。

## Docker

`shared-auth` を同時にコンテキストへ含める必要があるため、`00_共通基盤/` から
ビルドします。

```powershell
cd D:\Construction-DX-OnePlatform\00_共通基盤
docker build -f api-gateway\Dockerfile -t cdx-api-gateway:0.1.0 .
docker run --rm -p 8080:8080 --env-file api-gateway\.env cdx-api-gateway:0.1.0
```

## ディレクトリ構成

```
api-gateway/
├── pyproject.toml
├── Dockerfile
├── README.md
├── .env.example
├── src/cdx_gateway/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── openapi.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── logging.py
│   │   └── rate_limit.py
│   └── routes/
│       ├── __init__.py
│       ├── health.py
│       ├── proxy.py
│       └── metrics.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_health.py
    └── test_proxy.py
```

# cdx-site-api (施工管理システム API)

Construction DX One Platform — 施工本部の業務支援システム API (FastAPI)。

## 起動

```bash
cd backend
uv sync   # or: pip install -e .[dev]
alembic upgrade head
uvicorn site_api.main:app --reload --port 8000
```

ヘルスチェック: `GET http://localhost:8000/health`

## 構造

```
src/site_api/
  config.py
  main.py
  db/session.py           # cdx-shared-db のラッパー
  models/                 # SQLAlchemy モデル
  routes/                 # FastAPI ルーター
  services/
    sync_engine.py        # オフライン同期のコンフリクト解決
    ai_photo_classifier.py
    qr_token.py           # HMAC-SHA256 QRトークン
    hashing.py            # 電子黒板 SHA-256
  schemas/                # Pydantic
alembic/                  # マイグレーション
tests/                    # スモークテスト
```

## 認証

`cdx_auth.dependencies.get_current_user` を依存性として全エンドポイントで使用。
Bearer JWT (Entra ID) が必要。

## 同期 API

| パス | 説明 |
|------|------|
| POST /api/v1/sync/push | オフラインバッチ受領 |
| GET  /api/v1/sync/pull | 差分 pull |
| GET  /api/v1/sync/status | 同期履歴 |

# 🔐 shared-auth — 統合認証モジュール

> Construction DX One Platform の全部門APIで共有する **Entra ID + HENNGE SSO** 認証

## 機能

- ✅ Entra ID (Azure AD) OIDC ログイン
- ✅ HENNGE SSO (OIDC) 連携準備
- ✅ JWT (RS256) 検証 + JWKS自動取得・キャッシュ
- ✅ Entra IDグループ → アプリロール マッピング (RBAC)
- ✅ Redisセッションストア
- ✅ FastAPI 依存性 (`get_current_user`, `require_roles`)
- ✅ Starlette ミドルウェア (`EntraOIDCMiddleware`)

## 使い方

```python
from fastapi import FastAPI, Depends
from cdx_auth import get_current_user, require_roles, Role, AuthenticatedUser

app = FastAPI()

@app.get("/me")
async def me(user: AuthenticatedUser = Depends(get_current_user)):
    return user

@app.get("/admin", dependencies=[Depends(require_roles(Role.SYSTEM_ADMIN))])
async def admin_only():
    return {"ok": True}
```

## 設定 (.env)

`ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `REDIS_HOST` 等は
プロジェクトルートの `.env.example` を参照。

## テスト

```powershell
cd 00_共通基盤\shared-auth
pip install -e .[dev]
pytest
```

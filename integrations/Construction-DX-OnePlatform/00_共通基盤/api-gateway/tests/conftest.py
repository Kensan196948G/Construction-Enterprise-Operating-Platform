"""pytest 共通設定 (認証を無効化したテスト用 app).

api-gateway の test では認証ミドルウェアを bypass するが、依存先の
shared-auth (`cdx_auth.dependencies`) は module-level で
`_settings = AuthSettings()` を呼ぶため、env 変数 ENTRA_* / JWT_AUDIENCE
が未設定だと test collection 時点で ValidationError が発生する。
このため、テスト用ダミー値を `setdefault` で投入してから import を許可する。
本物の値は CI / 本番では deployment 側で上書きされる。
"""
from __future__ import annotations

import os

# 認証ミドルウェア自体は bypass
os.environ.setdefault("CDX_GATEWAY_DISABLE_AUTH", "1")

# shared-auth dependencies.py:25 の module-level AuthSettings() 構築用ダミー env
# (テスト時のみ、本物の Entra ID 通信は発生しない)
os.environ.setdefault("ENTRA_TENANT_ID", "test-tenant")
os.environ.setdefault("ENTRA_CLIENT_ID", "test-client")
os.environ.setdefault("ENTRA_CLIENT_SECRET", "test-secret")
os.environ.setdefault("JWT_AUDIENCE", "test-audience")

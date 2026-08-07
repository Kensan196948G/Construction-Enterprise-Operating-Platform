"""認証依存性 (cdx_auth ラッパー).

骨格段階では cdx_auth が AuthSettings の環境変数を要求するため、
import 解決に失敗した場合は no-op の依存に切り替える。
ENV `CORP_DISABLE_AUTH=1` でもバイパス可能。
"""
from __future__ import annotations

import os
from typing import Any

from fastapi import Header, HTTPException, status


def _bypass() -> bool:
    return os.environ.get("CORP_DISABLE_AUTH", "1") == "1"


try:  # pragma: no cover
    if _bypass():
        raise RuntimeError("auth disabled")
    from cdx_auth import get_current_user as _real_get_current_user  # type: ignore

    async def get_current_user(
        authorization: str | None = Header(default=None),
    ) -> Any:
        return await _real_get_current_user(authorization)  # type: ignore[arg-type]

except Exception:  # pragma: no cover

    async def get_current_user(
        authorization: str | None = Header(default=None),
    ) -> dict[str, Any]:
        """骨格用 no-op 認証. Bearer が無くても dev 用の仮ユーザーを返す."""
        if authorization and not authorization.lower().startswith("bearer "):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid_token")
        return {
            "sub": "dev-user",
            "upn": "dev@example.com",
            "name": "Dev User",
            "roles": ["corporate_admin"],
        }

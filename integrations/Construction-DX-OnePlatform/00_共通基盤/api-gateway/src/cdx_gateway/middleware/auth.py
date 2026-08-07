"""認証ミドルウェア (cdx_auth.EntraOIDCMiddleware を再エクスポート).

shared-auth の AuthSettings.public_paths() が動的解決方式 (default +
PUBLIC_PATHS_EXTRA 環境変数) へ移行したため、本モジュールはモジュール
レベル定数 PUBLIC_PATHS をもはや import しない。代わりに patch_public_paths()
を起動時に呼び、ゲートウェイ固有の追加パスを PUBLIC_PATHS_EXTRA に
マージする。
"""
from __future__ import annotations

import os

from cdx_auth.middleware import EntraOIDCMiddleware

GATEWAY_PUBLIC_PATHS: frozenset[str] = frozenset({"/", "/ready", "/metrics", "/redoc"})


def patch_public_paths() -> None:
    """ゲートウェイ固有の公開パスを PUBLIC_PATHS_EXTRA 環境変数にマージする.

    AuthSettings は読み込み時に PUBLIC_PATHS_EXTRA を参照するため、
    本関数は EntraOIDCMiddleware を ASGI app に追加する**前**に呼ぶ必要がある。
    既に PUBLIC_PATHS_EXTRA が設定されていれば、その値と GATEWAY_PUBLIC_PATHS
    を union してから書き戻す (べき等)。
    """
    existing = {
        p.strip()
        for p in os.environ.get("PUBLIC_PATHS_EXTRA", "").split(",")
        if p.strip()
    }
    merged = existing | GATEWAY_PUBLIC_PATHS
    os.environ["PUBLIC_PATHS_EXTRA"] = ",".join(sorted(merged))


__all__ = ["EntraOIDCMiddleware", "GATEWAY_PUBLIC_PATHS", "patch_public_paths"]

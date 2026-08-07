"""Construction DX One Platform — 統合認証モジュール.

Entra ID (Azure AD) + HENNGE SSO の OIDC 認証フローを FastAPI 用に提供する。
"""
from cdx_auth.config import AuthSettings
from cdx_auth.dependencies import get_current_user, require_roles
from cdx_auth.issuer_chain import IssuerChain
from cdx_auth.middleware import EntraOIDCMiddleware
from cdx_auth.models import AuthenticatedUser, Role
from cdx_auth.session import SessionStore

__all__ = [
    "AuthSettings",
    "AuthenticatedUser",
    "EntraOIDCMiddleware",
    "IssuerChain",
    "Role",
    "SessionStore",
    "get_current_user",
    "require_roles",
]

__version__ = "0.1.0"

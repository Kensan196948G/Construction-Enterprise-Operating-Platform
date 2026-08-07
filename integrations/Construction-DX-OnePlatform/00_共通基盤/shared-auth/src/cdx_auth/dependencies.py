"""FastAPI 依存性 — JWT検証・現在ユーザー取得・ロール要求.

Codex Review H2/M1/M2/L2 対応:
- JWKS取得障害を 401/503 に明示変換
- アルゴリズムはホワイトリストで強制 (config.py で検証済)
- 外部レスポンスは固定文言、詳細は秘匿ログに限定
- tid 必須化
"""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt

from cdx_auth.config import AuthSettings
from cdx_auth.issuer_chain import IssuerChain
from cdx_auth.jwks import AuthInfraError
from cdx_auth.models import AuthenticatedUser, Role
from cdx_auth.rbac import map_groups_to_roles

log = logging.getLogger(__name__)

_settings = AuthSettings()  # type: ignore[call-arg]
_issuer_chain = IssuerChain(_settings)

_INVALID_TOKEN = "invalid_token"
_INVALID_AUDIENCE = "invalid_token"
_AUTH_UNAVAILABLE = "auth_unavailable"


def _unauthorized() -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, _INVALID_TOKEN)


def _service_unavailable() -> HTTPException:
    return HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, _AUTH_UNAVAILABLE)


async def _verify_bearer(token: str) -> AuthenticatedUser:
    try:
        unverified_header = jwt.get_unverified_header(token)
        unverified_claims = jwt.get_unverified_claims(token)
    except JWTError as e:
        log.info("auth: invalid token: %s", e)
        raise _unauthorized() from e

    kid = unverified_header.get("kid")
    if not kid:
        log.info("auth: missing kid")
        raise _unauthorized()
    if unverified_header.get("alg") != _settings.jwt_algorithm:
        log.info("auth: unexpected alg=%r", unverified_header.get("alg"))
        raise _unauthorized()

    issuer = unverified_claims.get("iss")
    if not issuer or not _issuer_chain.is_trusted(issuer):
        log.info("auth: untrusted issuer=%r", issuer)
        raise _unauthorized()

    try:
        key = await _issuer_chain.get_key(issuer, kid)
    except AuthInfraError as e:
        log.error("auth: JWKS unavailable for issuer=%s: %s", issuer, e)
        raise _service_unavailable() from e
    if not key:
        log.info("auth: unknown kid=%s for issuer=%s", kid, issuer)
        raise _unauthorized()

    audience = _issuer_chain.audience_for(issuer)
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=[_settings.jwt_algorithm],
            audience=audience,
            issuer=issuer,
            options={"verify_at_hash": False, "require_iat": True, "require_exp": True},
        )
    except JWTError as e:
        log.info("auth: jwt validation failed for issuer=%s: %s", issuer, e)
        raise _unauthorized() from e

    is_entra = issuer == _settings.entra_issuer
    if is_entra:
        tid = claims.get("tid")
        if not tid:
            log.info("auth: missing tid claim (entra)")
            raise _unauthorized()
        if tid != _settings.entra_tenant_id:
            log.info("auth: tenant mismatch: tid=%s expected=%s", tid, _settings.entra_tenant_id)
            raise _unauthorized()
        tenant_id = tid
    else:
        # Codex 4回目 L-New-1: HENNGE 経由ユーザーが Entra tenant に紛れない様、
        # 明示の HENNGE_TENANT_ID > tid > issuer host の順で tenant を確定する。
        from urllib.parse import urlparse

        hennge_host = urlparse(issuer).hostname or issuer
        tenant_id = (
            claims.get("tid")
            or _settings.hennge_tenant_id
            or f"hennge:{hennge_host}"
        )

    log.info("audit: token accepted via issuer=%s sub=%s", issuer, claims.get("sub"))
    groups = claims.get("groups", []) or []
    return AuthenticatedUser(
        sub=claims.get("oid") or claims["sub"],
        upn=claims.get("upn") or claims.get("preferred_username", ""),
        name=claims.get("name", ""),
        email=claims.get("email"),
        department=claims.get("department"),
        groups=groups,
        roles=map_groups_to_roles(groups),
        tenant_id=tenant_id,
        issued_at=claims.get("iat", 0),
        expires_at=claims.get("exp", 0),
    )


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise _unauthorized()
    return await _verify_bearer(authorization.split(" ", 1)[1])


def require_roles(*roles: Role):
    """指定ロールのいずれかを持つことを要求する FastAPI 依存."""

    async def _dep(user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
        if not user.has_role(*roles):
            log.info("auth: insufficient role: user=%s required=%s", user.sub, [r.value for r in roles])
            raise HTTPException(status.HTTP_403_FORBIDDEN, "forbidden")
        return user

    return _dep

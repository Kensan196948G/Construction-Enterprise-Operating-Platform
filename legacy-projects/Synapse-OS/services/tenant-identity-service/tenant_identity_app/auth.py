"""JWT authentication utilities for tenant-identity-service."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt as _jwt
from jwt.exceptions import InvalidTokenError

SECRET_KEY = os.environ.get("JWT_SECRET", "synapse-dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

# Re-export so callers can catch JWTError without importing jwt directly.
JWTError = InvalidTokenError


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# Dev-only user store — replace with DB in production.
# Passwords are hashed at module load time to avoid storing plaintext.
_USERS: dict[str, dict[str, Any]] = {
    "admin@synapse.local": {
        "username": "admin@synapse.local",
        "hashed_password": _hash_password("admin1234"),
        "tenant_id": "ten_global_00000000_0001",
        "role": "admin",
    },
    "user@tenant-alpha.com": {
        "username": "user@tenant-alpha.com",
        "hashed_password": _hash_password("password123"),
        "tenant_id": "ten_tena_00000000_0001",
        "role": "user",
    },
}


def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    user = _USERS.get(username)
    if user and verify_password(password, user["hashed_password"]):
        return user
    return None


def create_access_token(data: dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(tz=timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return _jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate JWT. Raises jwt.exceptions.InvalidTokenError on failure."""
    return _jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

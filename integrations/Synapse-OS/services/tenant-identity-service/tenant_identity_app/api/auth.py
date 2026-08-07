"""Auth API: POST /auth/token, GET /auth/me."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pydantic import BaseModel

from ..auth import authenticate_user, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str
    tenant_id: str
    role: str


@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({
        "sub": user["username"],
        "tenant_id": user["tenant_id"],
        "role": user["role"],
    })
    return Token(access_token=token, token_type="bearer")


@router.get("/me", response_model=TokenData)
def get_me(token: str = Depends(oauth2_scheme)) -> TokenData:
    try:
        payload = decode_token(token)
        username: str = payload.get("sub", "")
        tenant_id: str = payload.get("tenant_id", "")
        role: str = payload.get("role", "user")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenData(username=username, tenant_id=tenant_id, role=role)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

"""tenant-identity-service entrypoint (Sprint 0).

起動例:
    uvicorn app.main:app --port 8001 --reload
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import auth as auth_api
from .api import identities as identities_api
from .api import tenants as tenants_api

app = FastAPI(
    title="Synapse-OS Tenant / Identity Service",
    version="0.0.2-mvp-rc",
    description=(
        "Sprint 0 minimum service. "
        "Read-Only Tenant/Identity API. "
        "JWT認証 (POST /auth/token, GET /auth/me) を追加。"
        "IdP連携、書き込み API は Sprint 1+。"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tenants_api.router)
app.include_router(identities_api.router)
app.include_router(auth_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "tenant-identity-service", "sprint": "0"}

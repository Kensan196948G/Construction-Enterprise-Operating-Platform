"""FastAPI entrypoint for Safety & Quality Governance Platform."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import (
    accidents,
    ai_risk_prediction,
    environment,
    iso_audit,
    ky,
    near_miss,
    nonconformity,
    patrol,
    quality,
)

app = FastAPI(title="Safety & Quality Governance Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.api_prefix
app.include_router(near_miss.router, prefix=f"{prefix}/near-miss", tags=["near-miss"])
app.include_router(ky.router, prefix=f"{prefix}/ky-activities", tags=["ky"])
app.include_router(accidents.router, prefix=f"{prefix}/accidents", tags=["accidents"])
app.include_router(patrol.router, prefix=f"{prefix}/patrols", tags=["patrol"])
app.include_router(quality.router, prefix=f"{prefix}/quality-records", tags=["quality"])
app.include_router(nonconformity.router, prefix=f"{prefix}/nonconformity", tags=["nonconformity"])
app.include_router(iso_audit.router, prefix=f"{prefix}/iso-audits", tags=["iso-audit"])
app.include_router(environment.router, prefix=f"{prefix}/environmental", tags=["environment"])
app.include_router(ai_risk_prediction.router, prefix=f"{prefix}/ai", tags=["ai"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}

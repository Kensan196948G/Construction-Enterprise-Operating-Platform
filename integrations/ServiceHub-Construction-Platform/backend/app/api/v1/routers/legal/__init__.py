"""Legal Tech API ルーターパッケージ"""

from fastapi import APIRouter

from app.api.v1.routers.legal.compliance import router as compliance_router
from app.api.v1.routers.legal.contracts import router as contracts_router
from app.api.v1.routers.legal.evidence import router as evidence_router

legal_router = APIRouter()
legal_router.include_router(contracts_router)
legal_router.include_router(evidence_router)
legal_router.include_router(compliance_router)

"""ダッシュボード KPI APIルーター"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import UserRole, require_roles
from app.db.base import get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.dashboard import DashboardKPI
from app.schemas.legal import LegalRiskDashboard
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["ダッシュボード"])


@router.get("/kpi", response_model=ApiResponse[DashboardKPI])
async def get_dashboard_kpi(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.PROJECT_MANAGER,
                UserRole.SITE_SUPERVISOR,
                UserRole.COST_MANAGER,
                UserRole.IT_OPERATOR,
                UserRole.VIEWER,
            )
        ),
    ],
):
    """ダッシュボード KPI 集約データを返す"""
    svc = DashboardService(db)
    kpi = await svc.get_kpi()
    return ApiResponse(data=kpi)


@router.get("/legal-risks", response_model=ApiResponse[LegalRiskDashboard])
async def get_legal_risk_dashboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)),
    ],
):
    """法的リスクサマリー KPI（契約リスク・コンプライアンス・期限切れ）を返す"""
    svc = DashboardService(db)
    result = await svc.get_legal_risk_summary()
    return ApiResponse(data=result)

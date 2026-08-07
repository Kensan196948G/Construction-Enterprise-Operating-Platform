"""
ダッシュボードサービス（KPI集約層）
各リポジトリから集計データを取得して統合
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import Integer, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cost import CostRecord
from app.models.daily_report import DailyReport
from app.models.itsm import Incident
from app.models.legal import ComplianceCheck, Contract
from app.models.photo import Photo
from app.models.project import Project
from app.models.user import User
from app.schemas.dashboard import (
    CostOverview,
    DashboardKPI,
    IncidentStats,
    ProjectStats,
)
from app.schemas.legal import LegalRiskDashboard, LegalRiskProjectEntry


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_kpi(self) -> DashboardKPI:
        projects = await self._project_stats()
        incidents = await self._incident_stats()
        cost = await self._cost_overview()
        daily_reports_count = await self._count_active(DailyReport)
        photos_count = await self._count_active(Photo)
        users_count = await self._count_active(User)

        return DashboardKPI(
            projects=projects,
            incidents=incidents,
            cost_overview=cost,
            daily_reports_count=daily_reports_count,
            photos_count=photos_count,
            users_count=users_count,
        )

    async def _project_stats(self) -> ProjectStats:
        result = await self.db.execute(
            select(Project.status, func.count())
            .where(Project.deleted_at.is_(None))
            .group_by(Project.status)
        )
        counts: dict[str, int] = {}
        total = 0
        for status, count in result.all():
            counts[status] = count
            total += count

        return ProjectStats(
            total=total,
            planning=counts.get("PLANNING", 0),
            in_progress=counts.get("IN_PROGRESS", 0),
            on_hold=counts.get("ON_HOLD", 0),
            completed=counts.get("COMPLETED", 0),
        )

    async def _incident_stats(self) -> IncidentStats:
        result = await self.db.execute(
            select(Incident.status, func.count())
            .where(Incident.deleted_at.is_(None))
            .group_by(Incident.status)
        )
        counts: dict[str, int] = {}
        total = 0
        for status, count in result.all():
            counts[status] = count
            total += count

        return IncidentStats(
            total=total,
            open=counts.get("OPEN", 0),
            in_progress=counts.get("IN_PROGRESS", 0),
            resolved=counts.get("RESOLVED", 0),
        )

    async def _cost_overview(self) -> CostOverview:
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(CostRecord.budgeted_amount), 0),
                func.coalesce(func.sum(CostRecord.actual_amount), 0),
            )
            .select_from(CostRecord)
            .where(CostRecord.deleted_at.is_(None))
        )
        row = result.one()
        budgeted = float(row[0])
        actual = float(row[1])
        variance = budgeted - actual
        rate = (variance / budgeted * 100) if budgeted else 0.0

        return CostOverview(
            total_budgeted=budgeted,
            total_actual=actual,
            variance=variance,
            variance_rate=round(rate, 2),
        )

    async def _count_active(self, model: type) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(model).where(model.deleted_at.is_(None))  # type: ignore[attr-defined]
        )
        return result.scalar_one()

    async def get_legal_risk_summary(self) -> LegalRiskDashboard:
        """法的リスクダッシュボードKPIを集計する."""
        now = datetime.now(tz=timezone.utc)
        d30 = (now + timedelta(days=30)).date()
        d60 = (now + timedelta(days=60)).date()

        # 契約リスクスコア別集計
        risk_rows = await self.db.execute(
            select(Contract.ai_risk_score, func.count()).group_by(
                Contract.ai_risk_score
            )
        )
        risk_counts: dict[str, int] = {}
        total_contracts = 0
        for score, cnt in risk_rows.all():
            risk_counts[score] = cnt
            total_contracts += cnt

        # コンプライアンスチェック失敗/警告件数（プロジェクト単位で最新1件のみ集計）
        compliance_rows = await self.db.execute(
            select(ComplianceCheck.status, func.count()).group_by(
                ComplianceCheck.status
            )
        )
        comp_counts: dict[str, int] = {}
        for status, cnt in compliance_rows.all():
            comp_counts[status] = cnt

        # 期限切れ間近の契約数
        expiring_30 = await self.db.execute(
            select(func.count())
            .select_from(Contract)
            .where(
                Contract.status == "ACTIVE",
                Contract.period_end.is_not(None),
                Contract.period_end <= d30,
            )
        )
        expiring_60 = await self.db.execute(
            select(func.count())
            .select_from(Contract)
            .where(
                Contract.status == "ACTIVE",
                Contract.period_end.is_not(None),
                Contract.period_end <= d60,
            )
        )

        # プロジェクト別リスク集計（最大20件）
        proj_rows = await self.db.execute(
            select(
                Project.id,
                Project.name,
                func.count(Contract.id).label("contracts_total"),
                func.sum(cast(Contract.ai_risk_score == "CRITICAL", Integer)).label(
                    "critical"
                ),
                func.sum(cast(Contract.ai_risk_score == "HIGH", Integer)).label("high"),
            )
            .select_from(Project)
            .outerjoin(
                Contract,
                Contract.project_id == Project.id,
            )
            .where(Project.deleted_at.is_(None))
            .group_by(Project.id, Project.name)
            .limit(20)
        )

        projects: list[LegalRiskProjectEntry] = []
        for row in proj_rows.all():
            critical_c = int(row.critical or 0)
            high_c = int(row.high or 0)
            if critical_c > 0:
                risk_lvl = "CRITICAL"
            elif high_c > 0:
                risk_lvl = "HIGH"
            elif int(row.contracts_total or 0) > 0:
                risk_lvl = "MEDIUM"
            else:
                risk_lvl = "NONE"

            # 30日以内期限切れ
            exp_cnt_row = await self.db.execute(
                select(func.count())
                .select_from(Contract)
                .where(
                    Contract.project_id == row.id,
                    Contract.status == "ACTIVE",
                    Contract.period_end.is_not(None),
                    Contract.period_end <= d30,
                )
            )
            exp_cnt = exp_cnt_row.scalar_one()

            # プロジェクトの最新コンプライアンス状態
            comp_status_row = await self.db.execute(
                select(ComplianceCheck.status)
                .where(
                    ComplianceCheck.project_id == row.id,
                )
                .order_by(ComplianceCheck.checked_at.desc())
                .limit(1)
            )
            comp_status = comp_status_row.scalar_one_or_none() or "NOT_CHECKED"

            projects.append(
                LegalRiskProjectEntry(
                    project_id=row.id,
                    project_name=row.name,
                    risk_level=risk_lvl,
                    contracts_total=int(row.contracts_total or 0),
                    contracts_critical=critical_c,
                    contracts_high=high_c,
                    compliance_status=comp_status,
                    expiring_in_30d=exp_cnt,
                )
            )

        return LegalRiskDashboard(
            total_contracts=total_contracts,
            critical_count=risk_counts.get("CRITICAL", 0),
            high_count=risk_counts.get("HIGH", 0),
            medium_count=risk_counts.get("MEDIUM", 0),
            low_count=risk_counts.get("LOW", 0),
            compliance_failures=comp_counts.get("FAIL", 0),
            compliance_warnings=comp_counts.get("WARNING", 0),
            expiring_30d=expiring_30.scalar_one(),
            expiring_60d=expiring_60.scalar_one(),
            projects=projects,
            evaluated_at=now,
        )

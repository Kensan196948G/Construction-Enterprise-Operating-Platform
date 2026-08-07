"""Legal Tech リポジトリ — Contract / LegalEvidence / ComplianceCheck DB 操作"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.legal import ComplianceCheck, Contract, LegalEvidence
from app.schemas.legal import (
    ComplianceCheckRequest,
    ContractCreate,
    ContractUpdate,
    LegalEvidenceCreate,
)


class ContractRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, contract_id: uuid.UUID) -> Contract | None:
        result = await self.db.execute(
            select(Contract).where(Contract.id == contract_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, contract_number: str) -> Contract | None:
        result = await self.db.execute(
            select(Contract).where(Contract.contract_number == contract_number)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        offset: int = 0,
        limit: int = 20,
        project_id: uuid.UUID | None = None,
        contract_type: str | None = None,
        status: str | None = None,
        risk_score: str | None = None,
        project_ids: list[uuid.UUID] | None = None,
    ) -> list[Contract]:
        q = select(Contract)
        if project_id:
            q = q.where(Contract.project_id == project_id)
        # IDOR 防止: 非 ADMIN のスコープ集合（空リストなら結果 0 件）
        if project_ids is not None:
            q = q.where(Contract.project_id.in_(project_ids))
        if contract_type:
            q = q.where(Contract.contract_type == contract_type)
        if status:
            q = q.where(Contract.status == status)
        if risk_score:
            q = q.where(Contract.ai_risk_score == risk_score)
        q = q.order_by(Contract.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def count(
        self,
        project_id: uuid.UUID | None = None,
        contract_type: str | None = None,
        status: str | None = None,
        risk_score: str | None = None,
        project_ids: list[uuid.UUID] | None = None,
    ) -> int:
        q = select(func.count()).select_from(Contract)
        if project_id:
            q = q.where(Contract.project_id == project_id)
        # IDOR 防止: 非 ADMIN のスコープ集合（空リストなら結果 0 件）
        if project_ids is not None:
            q = q.where(Contract.project_id.in_(project_ids))
        if contract_type:
            q = q.where(Contract.contract_type == contract_type)
        if status:
            q = q.where(Contract.status == status)
        if risk_score:
            q = q.where(Contract.ai_risk_score == risk_score)
        result = await self.db.execute(q)
        return result.scalar_one()

    async def list_by_project(self, project_id: uuid.UUID) -> list[Contract]:
        result = await self.db.execute(
            select(Contract)
            .where(Contract.project_id == project_id)
            .order_by(Contract.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_critical_by_project(self, project_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Contract)
            .where(
                Contract.project_id == project_id,
                Contract.ai_risk_score == "CRITICAL",
            )
        )
        return result.scalar_one()

    async def create(self, data: ContractCreate, created_by: uuid.UUID) -> Contract:
        contract = Contract(
            **data.model_dump(), created_by=created_by, updated_by=created_by
        )
        self.db.add(contract)
        await self.db.flush()
        await self.db.refresh(contract)
        return contract

    async def update(
        self, contract: Contract, data: ContractUpdate, updated_by: uuid.UUID
    ) -> Contract:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(contract, field, value)
        contract.updated_by = updated_by
        await self.db.flush()
        await self.db.refresh(contract)
        return contract

    async def update_ai_result(
        self,
        contract: Contract,
        risk_score: str,
        analysis_json: dict,
        analyzed_at,
    ) -> Contract:
        contract.ai_risk_score = risk_score
        contract.ai_analysis_json = analysis_json
        contract.ai_analyzed_at = analyzed_at
        await self.db.flush()
        await self.db.refresh(contract)
        return contract


# ---------------------------------------------------------------------------
# Phase 2: LegalEvidence Repository
# ---------------------------------------------------------------------------


class LegalEvidenceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, data: LegalEvidenceCreate, created_by: uuid.UUID
    ) -> LegalEvidence:
        evidence = LegalEvidence(**data.model_dump(), created_by=created_by)
        self.db.add(evidence)
        await self.db.flush()
        await self.db.refresh(evidence)
        return evidence

    async def get_timeline(
        self,
        project_id: uuid.UUID,
        source_type: str | None = None,
        limit: int = 100,
    ) -> list[LegalEvidence]:
        """証跡タイムライン取得（event_date 昇順）"""
        q = (
            select(LegalEvidence)
            .where(LegalEvidence.project_id == project_id)
            .order_by(LegalEvidence.event_date.asc(), LegalEvidence.created_at.asc())
            .limit(limit)
        )
        if source_type:
            q = q.where(LegalEvidence.source_type == source_type)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def count_by_project(self, project_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(LegalEvidence)
            .where(LegalEvidence.project_id == project_id)
        )
        return result.scalar_one()

    async def get_by_id(self, evidence_id: uuid.UUID) -> LegalEvidence | None:
        result = await self.db.execute(
            select(LegalEvidence).where(LegalEvidence.id == evidence_id)
        )
        return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Phase 2: ComplianceCheck Repository
# ---------------------------------------------------------------------------


class ComplianceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        project_id: uuid.UUID,
        data: ComplianceCheckRequest,
        status: str,
        score: int | None,
        violations: dict | None,
        recommendations: dict | None,
        ai_used: bool,
        created_by: uuid.UUID,
    ) -> ComplianceCheck:
        from datetime import datetime, timezone  # noqa: PLC0415

        check = ComplianceCheck(
            project_id=project_id,
            check_type=data.check_type,
            status=status,
            score=score,
            violations_json=violations,
            recommendations_json=recommendations,
            ai_used=ai_used,
            checked_at=datetime.now(timezone.utc),
            created_by=created_by,
        )
        self.db.add(check)
        await self.db.flush()
        await self.db.refresh(check)
        return check

    async def get_latest(self, project_id: uuid.UUID) -> ComplianceCheck | None:
        """最新のコンプライアンスチェック結果を取得"""
        result = await self.db.execute(
            select(ComplianceCheck)
            .where(ComplianceCheck.project_id == project_id)
            .order_by(ComplianceCheck.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_history(
        self,
        project_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> list[ComplianceCheck]:
        result = await self.db.execute(
            select(ComplianceCheck)
            .where(ComplianceCheck.project_id == project_id)
            .order_by(ComplianceCheck.checked_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_history(self, project_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(ComplianceCheck)
            .where(ComplianceCheck.project_id == project_id)
        )
        return result.scalar_one()

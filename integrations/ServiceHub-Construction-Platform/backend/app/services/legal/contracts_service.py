"""
契約 AI 解析サービス（建設業法・下請法対応）
Claude claude-opus-4-7 を使った法的リスク評価
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.repositories.legal import ContractRepository
from app.schemas.legal import (
    ContractAnalysisResult,
    ContractCreate,
    ContractResponse,
    ContractUpdate,
    LegalIssue,
)
from app.services.legal.anthropic_client import (
    CONSTRUCTION_LAW_SYSTEM_PROMPT,
    CONTRACT_ANALYSIS_TOOL,
    get_anthropic_client,
)

logger = logging.getLogger(__name__)

MODEL_LEGAL = "claude-opus-4-7"


class ContractNotFoundError(NotFoundError):
    detail = "契約が見つかりません"


class ContractDuplicateError(BadRequestError):
    detail = "同じ契約番号が既に登録されています"


class ContractsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ContractRepository(db)

    async def create_contract(
        self, data: ContractCreate, created_by: uuid.UUID
    ) -> ContractResponse:
        existing = await self.repo.get_by_number(data.contract_number)
        if existing:
            raise ContractDuplicateError("同じ契約番号が既に登録されています")
        contract = await self.repo.create(data, created_by=created_by)
        return ContractResponse.model_validate(contract)

    async def list_contracts(
        self,
        page: int,
        per_page: int,
        project_id: uuid.UUID | None = None,
        contract_type: str | None = None,
        status: str | None = None,
        risk_score: str | None = None,
        project_ids: list[uuid.UUID] | None = None,
    ) -> tuple[list[ContractResponse], int]:
        offset = (page - 1) * per_page
        total = await self.repo.count(
            project_id=project_id,
            contract_type=contract_type,
            status=status,
            risk_score=risk_score,
            project_ids=project_ids,
        )
        items = await self.repo.get_all(
            offset=offset,
            limit=per_page,
            project_id=project_id,
            contract_type=contract_type,
            status=status,
            risk_score=risk_score,
            project_ids=project_ids,
        )
        return [ContractResponse.model_validate(i) for i in items], total

    async def get_contract(self, contract_id: uuid.UUID) -> ContractResponse:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise ContractNotFoundError()
        return ContractResponse.model_validate(contract)

    async def update_contract(
        self,
        contract_id: uuid.UUID,
        data: ContractUpdate,
        updated_by: uuid.UUID,
    ) -> ContractResponse:
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise ContractNotFoundError()
        updated = await self.repo.update(contract, data, updated_by=updated_by)
        return ContractResponse.model_validate(updated)

    async def analyze_contract(
        self,
        contract_id: uuid.UUID,
        contract_text: str,
        contract_type: str,
    ) -> ContractAnalysisResult:
        """契約書テキストを Claude で解析してリスクスコアを付与する。
        ANTHROPIC_API_KEY 未設定時はモック結果を返す。
        """
        contract = await self.repo.get_by_id(contract_id)
        if not contract:
            raise ContractNotFoundError()

        client = get_anthropic_client()
        now = datetime.now(timezone.utc)

        if client is None:
            # API キー未設定: モック結果（テスト・開発環境対応）
            result = _build_mock_analysis(contract_type)
        else:
            result = await _call_claude_analysis(client, contract_text, contract_type)

        analysis_json = result.model_dump()
        await self.repo.update_ai_result(
            contract,
            risk_score=result.risk_score,
            analysis_json=analysis_json,
            analyzed_at=now,
        )

        return result


async def _call_claude_analysis(
    client, contract_text: str, contract_type: str
) -> ContractAnalysisResult:
    """Claude API を呼び出して契約書解析を実行する。"""
    _labels = {"PRIME": "元請契約", "SUB": "下請契約", "SECONDARY_SUB": "二次下請契約"}
    type_label = _labels.get(contract_type, "契約")
    user_message = (
        f"以下の建設工事{type_label}書を法的観点から解析してください。\n\n"
        f"```\n{contract_text[:50000]}\n```\n\n"
        "analyze_construction_contract ツールを使って結果を返してください。"
    )

    try:
        response = await client.messages.create(
            model=MODEL_LEGAL,
            max_tokens=4096,
            system=CONSTRUCTION_LAW_SYSTEM_PROMPT,
            tools=[CONTRACT_ANALYSIS_TOOL],
            tool_choice={"type": "tool", "name": "analyze_construction_contract"},
            messages=[{"role": "user", "content": user_message}],
        )

        tool_use = next(
            (b for b in response.content if b.type == "tool_use"),
            None,
        )
        if tool_use is None:
            logger.error("Claude did not return tool_use block")
            return _build_mock_analysis(contract_type)

        data = tool_use.input
        return ContractAnalysisResult(
            risk_score=data["risk_score"],
            summary=data["summary"],
            legal_issues=[
                LegalIssue(**issue) for issue in data.get("legal_issues", [])
            ],
            payment_term_days=data.get("payment_term_days"),
            has_required_items=data.get("has_required_items", True),
            checked_at=datetime.now(timezone.utc),
        )
    except Exception as exc:
        logger.error("Claude analysis failed: %s", exc)
        return _build_mock_analysis(contract_type)


def _build_mock_analysis(contract_type: str) -> ContractAnalysisResult:
    """ANTHROPIC_API_KEY 未設定時のモック解析結果。"""
    return ContractAnalysisResult(
        risk_score="PENDING",
        summary="AI 解析が利用できないため、手動による確認が必要です。",
        legal_issues=[],
        payment_term_days=None,
        has_required_items=True,
        checked_at=datetime.now(timezone.utc),
    )

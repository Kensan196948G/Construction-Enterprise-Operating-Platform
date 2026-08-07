"""契約 CRUD."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Client, Contract

router = APIRouter(prefix="/contracts", tags=["contracts"])


class ContractIn(BaseModel):
    contract_number: str
    client_id: int
    opportunity_id: int | None = None
    quotation_id: int | None = None
    project_name: str
    work_site: str | None = None
    contract_amount: Decimal = Decimal("0")
    contract_date: date | None = None
    work_start_date: date | None = None
    work_end_date: date | None = None
    status: str = "draft"
    payment_terms: str | None = None
    remarks: str | None = None


class ContractOut(ContractIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


@router.get("", response_model=list[ContractOut])
async def list_contracts(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ContractOut]:
    result = await session.execute(select(Contract))
    return [ContractOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=ContractOut, status_code=status.HTTP_201_CREATED)
async def create_contract(
    body: ContractIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ContractOut:
    # J-SOX 業務統制: 与信判定後の契約 — credit_rank D/未評価 または credit_limit 超過は受注禁止
    client = await session.get(Client, body.client_id)
    if client is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "client not found")
    if client.credit_rank in {"D", "未評価"}:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"与信NG: credit_rank={client.credit_rank} — 与信判定が完了していません",
        )
    if client.credit_limit is not None and body.contract_amount > client.credit_limit:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"与信NG: 契約金額 {body.contract_amount} が与信限度額 {client.credit_limit} を超過",
        )
    contract = Contract(**body.model_dump(exclude_none=True))
    session.add(contract)
    await session.flush()
    return ContractOut.model_validate(contract)


@router.get("/{contract_id}", response_model=ContractOut)
async def get_contract(
    contract_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ContractOut:
    contract = await session.get(Contract, contract_id)
    if contract is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "contract not found")
    return ContractOut.model_validate(contract)

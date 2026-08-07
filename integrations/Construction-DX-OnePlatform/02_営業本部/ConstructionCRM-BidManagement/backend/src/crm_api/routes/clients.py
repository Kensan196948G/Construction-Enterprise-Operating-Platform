"""顧客 CRUD + 与信評価エンドポイント."""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Literal

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Client

router = APIRouter(prefix="/clients", tags=["clients"])

CreditRank = Literal["A", "B", "C", "D", "未評価"]


class ClientIn(BaseModel):
    client_code: str
    client_name: str
    client_type: str = "private"
    industry: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    credit_rank: CreditRank = "未評価"
    credit_limit: Decimal | None = None
    relationship_score: Decimal = Decimal("0")
    notes: str | None = None


class ClientOut(ClientIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CreditAssessmentIn(BaseModel):
    credit_rank: CreditRank
    credit_limit: Decimal | None = None
    relationship_score: Decimal | None = None
    reason: str | None = None


@router.get("", response_model=list[ClientOut])
async def list_clients(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ClientOut]:
    result = await session.execute(select(Client))
    return [ClientOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ClientOut:
    client = Client(**body.model_dump(exclude_none=True))
    session.add(client)
    await session.flush()
    return ClientOut.model_validate(client)


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ClientOut:
    client = await session.get(Client, client_id)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "client not found")
    return ClientOut.model_validate(client)


@router.post("/{client_id}/credit-assessment", response_model=ClientOut)
async def assess_credit(
    client_id: int,
    body: CreditAssessmentIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ClientOut:
    """与信評価エンドポイント (建設業法の与信管理に基づく更新)."""
    client = await session.get(Client, client_id)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "client not found")
    client.credit_rank = body.credit_rank
    if body.credit_limit is not None:
        client.credit_limit = body.credit_limit
    if body.relationship_score is not None:
        client.relationship_score = body.relationship_score
    await session.flush()
    return ClientOut.model_validate(client)

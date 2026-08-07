"""施工プロジェクト CRUD."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import ConstructionProject

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectIn(BaseModel):
    project_code: str
    project_name: str
    site_address: str | None = None
    contract_amount: float | None = None
    start_date: str | None = None
    end_date: str | None = None
    status: str = "active"


class ProjectOut(ProjectIn):
    id: int


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ProjectOut]:
    result = await session.execute(select(ConstructionProject))
    return [ProjectOut.model_validate(p, from_attributes=True) for p in result.scalars().all()]


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProjectOut:
    project = ConstructionProject(**body.model_dump(exclude_none=True))
    session.add(project)
    await session.flush()
    return ProjectOut.model_validate(project, from_attributes=True)


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ProjectOut:
    project = await session.get(ConstructionProject, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "project not found")
    return ProjectOut.model_validate(project, from_attributes=True)

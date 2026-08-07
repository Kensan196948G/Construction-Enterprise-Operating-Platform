"""
写真・資料管理APIルーター
POST   /api/v1/projects/{id}/photos                    アップロード
GET    /api/v1/projects/{id}/photos                    一覧
GET    /api/v1/photos/{id}                             詳細 + プリサインドURL
PUT    /api/v1/photos/{id}                             メタデータ更新
DELETE /api/v1/photos/{id}                             論理削除
POST   /api/v1/projects/{id}/photos/{photo_id}/evidence 写真を法的証跡登録
GET    /api/v1/projects/{id}/photos/evidence           写真証跡一覧
"""

import math
import uuid
from typing import Annotated

import structlog
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.access_control import assert_project_access
from app.core.rbac import UserRole, require_roles
from app.db.base import get_db
from app.models.user import User
from app.schemas.common import ApiResponse, PaginatedResponse, PaginationMeta
from app.schemas.legal import (
    LegalEvidenceCreate,
    PhotoEvidenceCreate,
    PhotoEvidenceResponse,
)
from app.schemas.photo import PhotoResponse, PhotoUpdate
from app.services.legal.evidence_service import EvidenceService
from app.services.photo_service import PhotoService

router = APIRouter(tags=["写真・資料管理"])
logger = structlog.get_logger()


@router.post(
    "/projects/{project_id}/photos",
    response_model=ApiResponse[PhotoResponse],
    status_code=status.HTTP_201_CREATED,
)
async def upload_photo(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.SITE_SUPERVISOR
            )
        ),
    ],
    file: UploadFile = File(...),
    category: str = Form(default="GENERAL"),
    caption: str | None = Form(default=None),
    daily_report_id: uuid.UUID | None = Form(default=None),
):
    file_data = await file.read()
    svc = PhotoService(db)
    response_data = await svc.upload(
        project_id=project_id,
        file_data=file_data,
        filename=file.filename or "upload",
        content_type=file.content_type,
        category=category,
        caption=caption,
        daily_report_id=daily_report_id,
        created_by=current_user.id,
    )
    return ApiResponse(data=response_data)


@router.get(
    "/projects/{project_id}/photos", response_model=PaginatedResponse[PhotoResponse]
)
async def list_photos(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.PROJECT_MANAGER,
                UserRole.SITE_SUPERVISOR,
                UserRole.VIEWER,
            )
        ),
    ],
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    category: str | None = Query(default=None),
):
    svc = PhotoService(db)
    photos, total = await svc.list_photos(project_id, page, per_page, category)
    return PaginatedResponse(
        data=photos,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page) if total > 0 else 0,
        ),
    )


@router.get("/photos/{photo_id}", response_model=ApiResponse[PhotoResponse])
async def get_photo(
    photo_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN,
                UserRole.PROJECT_MANAGER,
                UserRole.SITE_SUPERVISOR,
                UserRole.VIEWER,
            )
        ),
    ],
):
    svc = PhotoService(db)
    response_data = await svc.get_photo(photo_id)
    return ApiResponse(data=response_data)


@router.put("/photos/{photo_id}", response_model=ApiResponse[PhotoResponse])
async def update_photo(
    photo_id: uuid.UUID,
    payload: PhotoUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.SITE_SUPERVISOR
            )
        ),
    ],
):
    svc = PhotoService(db)
    response_data = await svc.update_photo(photo_id, payload)
    return ApiResponse(data=response_data)


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User, Depends(require_roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER))
    ],
):
    svc = PhotoService(db)
    await svc.delete_photo(photo_id)
    return None


# ---------- Legal Evidence ----------


@router.post(
    "/projects/{project_id}/photos/{photo_id}/evidence",
    response_model=ApiResponse[PhotoEvidenceResponse],
    status_code=status.HTTP_201_CREATED,
)
async def register_photo_evidence(
    project_id: uuid.UUID,
    photo_id: uuid.UUID,
    payload: PhotoEvidenceCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(
            require_roles(
                UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.SITE_SUPERVISOR
            )
        ),
    ],
):
    """写真を法的証跡として登録する（SHA-256ハッシュ付き）。"""
    await assert_project_access(current_user, project_id, db)

    photo_svc = PhotoService(db)
    photo = await photo_svc.get_photo(photo_id)
    if photo.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された写真がこのプロジェクトに存在しません",
        )

    ev_svc = EvidenceService(db)
    evidence = await ev_svc.add_evidence(
        LegalEvidenceCreate(
            project_id=project_id,
            source_type="photo",
            source_id=photo_id,
            title=payload.title,
            description=payload.description,
            event_date=payload.event_date,
            metadata_json=payload.metadata_json,
        ),
        created_by=current_user.id,
    )

    return ApiResponse(
        data=PhotoEvidenceResponse(
            evidence_id=evidence.id,
            photo_id=photo_id,
            project_id=project_id,
            title=evidence.title,
            content_hash=evidence.content_hash or "",
            registered_at=evidence.created_at,
        ),
        message="写真を法的証跡として登録しました",
    )


@router.get(
    "/projects/{project_id}/photos/evidence",
    response_model=ApiResponse[list[PhotoEvidenceResponse]],
)
async def list_photo_evidence(
    project_id: uuid.UUID,
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
    limit: int = Query(default=100, ge=1, le=500),
):
    """プロジェクトの写真証跡一覧を返す（event_date 昇順）。"""
    await assert_project_access(current_user, project_id, db)

    ev_svc = EvidenceService(db)
    timeline = await ev_svc.get_timeline(
        project_id=project_id,
        source_type="photo",
        limit=limit,
    )

    items = [
        PhotoEvidenceResponse(
            evidence_id=e.id,
            photo_id=e.source_id or uuid.UUID(int=0),
            project_id=project_id,
            title=e.title,
            content_hash=e.content_hash or "",
            registered_at=e.created_at,
        )
        for e in timeline.entries
    ]

    return ApiResponse(data=items)

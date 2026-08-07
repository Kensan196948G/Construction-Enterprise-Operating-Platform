"""AI model registry + inference endpoint."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from data_api.db.session import get_db
from data_api.deps import get_current_user
from data_api.models.ai_model import AiModel
from data_api.schemas import AiModelCreate, AiModelRead, InferenceRequest, InferenceResponse
from data_api.services.ai_inferencer import dispatch

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.get("/models", response_model=list[AiModelRead])
def list_models(db: Session = Depends(get_db), user=Depends(get_current_user)) -> list[AiModel]:
    return list(db.execute(select(AiModel)).scalars().all())


@router.post("/models", response_model=AiModelRead, status_code=status.HTTP_201_CREATED)
def register_model(payload: AiModelCreate, db: Session = Depends(get_db), user=Depends(get_current_user)) -> AiModel:
    m = AiModel(**payload.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.get("/models/{model_id}", response_model=AiModelRead)
def get_model(model_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)) -> AiModel:
    m = db.get(AiModel, model_id)
    if not m:
        raise HTTPException(status_code=404, detail="model not found")
    return m


@router.post("/models/{model_id}/infer", response_model=InferenceResponse)
def run_inference(
    model_id: uuid.UUID,
    payload: InferenceRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> InferenceResponse:
    m = db.get(AiModel, model_id)
    if not m:
        raise HTTPException(status_code=404, detail="model not found")
    result = dispatch(
        m.model_type,
        inputs=payload.inputs,
        artifact_uri=m.artifact_uri,
        framework=m.framework,
    )
    elapsed = result.pop("elapsed_ms", 0.0)
    return InferenceResponse(model_id=model_id, outputs=result, elapsed_ms=elapsed)

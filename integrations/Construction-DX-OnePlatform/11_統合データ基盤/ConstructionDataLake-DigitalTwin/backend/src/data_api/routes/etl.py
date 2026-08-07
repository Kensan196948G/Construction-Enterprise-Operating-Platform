"""ETL job CRUD + manual trigger + run history."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from data_api.db.session import SessionLocal, get_db
from data_api.deps import get_current_user
from data_api.models.etl_job import EtlJob, EtlJobStatus
from data_api.models.etl_run import EtlRun, EtlRunStatus
from data_api.schemas import EtlJobCreate, EtlJobRead, EtlRunRead

router = APIRouter(prefix="/api/v1/etl", tags=["etl"])


@router.get("/jobs", response_model=list[EtlJobRead])
def list_jobs(db: Session = Depends(get_db), user=Depends(get_current_user)) -> list[EtlJob]:
    return list(db.execute(select(EtlJob)).scalars().all())


@router.post("/jobs", response_model=EtlJobRead, status_code=status.HTTP_201_CREATED)
def create_job(payload: EtlJobCreate, db: Session = Depends(get_db), user=Depends(get_current_user)) -> EtlJob:
    job = EtlJob(**payload.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs/{job_id}", response_model=EtlJobRead)
def get_job(job_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)) -> EtlJob:
    job = db.get(EtlJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return job


def _execute_job(job_id: uuid.UUID) -> None:
    """Skeleton background ETL execution (writes a run history row)."""
    db = SessionLocal()
    try:
        job = db.get(EtlJob, job_id)
        if not job:
            return
        run = EtlRun(job_id=job.job_id, status=EtlRunStatus.RUNNING.value)
        db.add(run)
        job.status = EtlJobStatus.RUNNING.value
        db.commit()
        db.refresh(run)
        # In production we would call services.etl_engine.run_etl(...) here.
        run.status = EtlRunStatus.SUCCESS.value
        run.finished_at = datetime.now(UTC)
        run.rows_in = 0
        run.rows_out = 0
        job.status = EtlJobStatus.SUCCESS.value
        job.last_run_at = run.finished_at
        db.commit()
    finally:
        db.close()


@router.post("/jobs/{job_id}/run", status_code=202)
def trigger_job(
    job_id: uuid.UUID,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict:
    job = db.get(EtlJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    background.add_task(_execute_job, job_id)
    return {"job_id": str(job_id), "status": "queued"}


@router.get("/runs", response_model=list[EtlRunRead])
def list_runs(
    job_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[EtlRun]:
    stmt = select(EtlRun).order_by(desc(EtlRun.started_at)).limit(limit)
    if job_id:
        stmt = select(EtlRun).where(EtlRun.job_id == job_id).order_by(desc(EtlRun.started_at)).limit(limit)
    return list(db.execute(stmt).scalars().all())

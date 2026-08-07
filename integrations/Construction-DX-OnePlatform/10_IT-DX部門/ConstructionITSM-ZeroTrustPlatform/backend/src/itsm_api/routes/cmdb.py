"""CMDB CI + Relation + Topology."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from itsm_api.db.session import get_db
from itsm_api.deps import get_current_user
from itsm_api.models.cmdb_ci import CmdbCi
from itsm_api.models.cmdb_relation import CmdbRelation
from itsm_api.schemas import (
    CiCreate,
    CiRead,
    RelationCreate,
    RelationRead,
    TopologyEdge,
    TopologyGraph,
    TopologyNode,
)

router = APIRouter(prefix="/api/v1/cmdb", tags=["cmdb"])


@router.get("", response_model=list[CiRead])
def list_cis(
    ci_type: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> list[CmdbCi]:
    stmt = select(CmdbCi)
    if ci_type:
        stmt = stmt.where(CmdbCi.ci_type == ci_type)
    return list(db.execute(stmt).scalars().all())


@router.post("", response_model=CiRead, status_code=status.HTTP_201_CREATED)
def create_ci(
    payload: CiCreate, db: Session = Depends(get_db), user=Depends(get_current_user)
) -> CmdbCi:
    ci = CmdbCi(**payload.model_dump())
    db.add(ci)
    db.commit()
    db.refresh(ci)
    return ci


@router.get("/topology", response_model=TopologyGraph)
def topology(
    db: Session = Depends(get_db), user=Depends(get_current_user)
) -> TopologyGraph:
    cis = db.execute(select(CmdbCi)).scalars().all()
    rels = db.execute(select(CmdbRelation)).scalars().all()
    nodes = [
        TopologyNode(
            id=str(c.ci_id),
            label=c.name,
            type=c.ci_type,
            status=c.lifecycle_status,
        )
        for c in cis
    ]
    edges = [
        TopologyEdge(
            id=str(r.relation_id),
            source=str(r.source_ci_id),
            target=str(r.target_ci_id),
            type=r.relation_type.value,
        )
        for r in rels
    ]
    return TopologyGraph(nodes=nodes, edges=edges)


@router.get("/{ci_id}", response_model=CiRead)
def get_ci(ci_id: uuid.UUID, db: Session = Depends(get_db), user=Depends(get_current_user)) -> CmdbCi:
    ci = db.get(CmdbCi, ci_id)
    if not ci:
        raise HTTPException(status_code=404, detail="ci not found")
    return ci


@router.post("/relations", response_model=RelationRead, status_code=201)
def create_relation(
    payload: RelationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)
) -> CmdbRelation:
    r = CmdbRelation(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

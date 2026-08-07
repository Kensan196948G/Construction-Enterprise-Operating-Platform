"""Document API (BL-007 / Sprint 2).

Endpoints:
    POST /documents          : Document を生成し Policy 評価 + Audit 送出までを一連で行う
    GET  /documents          : tenant_id フィルタ付きで一覧
    GET  /documents/{id}     : 単発取得

Acceptance 3 (Document Governance) のうち本 endpoint で固定するもの:
    1. Document に Classification が付く          -> DocumentCreateRequest.classification 必須
    2. Confidential 以上は DLP 判定対象になる      -> Policy Engine の DLP-003 が mask_required を返す
    3. Restricted は外部 AI 送信されない           -> DLP-004 が deny を返す -> 403 + Audit に残す
    4. Retention Policy が Document に紐づく       -> retention_class 必須

object-service の責務境界 (SERVICE_RESPONSIBILITY_MODEL.md):
    - Policy 最終判断は持たない -> PolicyClient へ委譲 (Engine 側の DLP-003/004 がそのまま発火する)
    - Audit 生成は持たない -> AuditClient へ委譲
    - Lineage (Acceptance 3 #5) は BL-011 (Knowledge Service) で扱う -- ここでは object_id の発行のみ

承認迂回の固定:
    Approval API と同様、Policy が deny を返した場合でも DocumentCreated Audit は積む。
    "迂回しようとした事実" を消さず、ただし Document 本体は QUARANTINED 状態で生成される
    (= 状態だけ示し外部送信は実体接続側で抑制される; 物理的に reject したい場合は
    後段の AI Gateway 側で拒否する形を Sprint 2 BL-006 で連結する)。
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status
from synapse_shared.enums import ObjectType, PolicyDecisionType

from ..clients.audit_client import (
    AuditClient,
    HttpAuditClient,
    StubAuditClient,
)
from ..clients.policy_client import (
    HttpPolicyClient,
    PolicyClient,
    StubPolicyClient,
)
from ..schemas.document import Document, DocumentCreateRequest, DocumentStatus
from ..storage.document_repository import DocumentRepository, get_repository

router = APIRouter(prefix="/documents", tags=["documents"])


@lru_cache(maxsize=1)
def get_policy_client() -> PolicyClient:
    base_url = os.environ.get("POLICY_BASE_URL")
    if base_url:
        return HttpPolicyClient(base_url=base_url)
    return StubPolicyClient()


@lru_cache(maxsize=1)
def get_audit_client() -> AuditClient:
    base_url = os.environ.get("AUDIT_BASE_URL")
    if base_url:
        return HttpAuditClient(base_url=base_url)
    return StubAuditClient()


def _initial_status(final_decision: str) -> DocumentStatus:
    """Policy Decision から Document の初期 status を導出する.

    - deny       -> QUARANTINED   (DLP-004: Restricted を外部に出そうとした等。物理隔離扱い)
    - allow      -> DRAFT         (作業中。Public/Internal で問題なし)
    - その他      -> REVIEW_REQUIRED  (mask_required / approval_required / local_llm_required 等。
                                       Confidential を外部送信しようとして DLP-003 が masked にした
                                       場合などはここに落ちる -- 後続 Workflow で処理する)
    """

    if final_decision == PolicyDecisionType.DENY.value:
        return DocumentStatus.QUARANTINED
    if final_decision == PolicyDecisionType.ALLOW.value:
        return DocumentStatus.DRAFT
    return DocumentStatus.REVIEW_REQUIRED


def _build_policy_input(
    *, payload: DocumentCreateRequest, document_id: str
) -> dict[str, str | float | bool]:
    """PolicyDecisionInput と互換な dict を組み立てる.

    object_type=DOCUMENT で渡すが、Engine の DLP rule は classification+data_destination で
    判定するため Document 専用 rule は不要。既存 DLP-001/003/004 がそのまま適用される。
    """

    return {
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "tenant_id": payload.tenant_id,
        "object_type": ObjectType.DOCUMENT.value,
        "object_id": document_id,
        "classification": payload.classification.value,
        "action": payload.requested_action,
        "data_destination": payload.data_destination,
        "model_provider": payload.model_provider,
        "risk_score": payload.risk_score,
        "approval_state": "none",
        "is_state_change": True,
    }


def _build_audit_ingress(
    *,
    payload: DocumentCreateRequest,
    document: Document,
    decision: dict[str, object],
) -> dict[str, object]:
    """AuditEventIngress と互換な dict を組み立てる.

    correlation_id = document_id とすることで Document 軸で Timeline を引ける
    (BL-011 Lineage 拡張時に同じ correlation_id でリネージ event を積み増せる)。

    after_state には retention_class を含める -- Acceptance 3 #4 が
    "Document に Retention Policy が紐づくこと" を要求しているため、
    Audit 側にも記録して Audit Timeline 単独で説明可能にする。
    """

    return {
        "event_type": "DocumentCreated",
        "tenant_id": payload.tenant_id,
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "action": payload.requested_action,
        "object_id": document.object_id,
        "object_type": ObjectType.DOCUMENT.value,
        "correlation_id": document.object_id,
        "policy_decision_ref": decision.get("policy_decision_id"),
        "policy_result": decision.get("final_decision"),
        "after_state": {
            "status": document.status.value,
            "classification": document.classification.value,
            "retention_class": document.retention_class.value,
            "title": document.title,
            "data_destination": payload.data_destination,
        },
    }


@router.post(
    "",
    response_model=Document,
    status_code=status.HTTP_201_CREATED,
    summary="Document を生成する (Policy 評価 + Audit 送出を含む)",
)
def create_document(
    payload: DocumentCreateRequest,
    repo: DocumentRepository = Depends(get_repository),
    policy_client: PolicyClient = Depends(get_policy_client),
    audit_client: AuditClient = Depends(get_audit_client),
) -> Document:
    document_id = repo.document_id(tenant_id=payload.tenant_id)

    decision = policy_client.evaluate(
        _build_policy_input(payload=payload, document_id=document_id)
    )
    final_decision = str(decision.get("final_decision", PolicyDecisionType.DENY.value))
    decision_id = decision.get("policy_decision_id")

    document = Document(
        object_id=document_id,
        tenant_id=payload.tenant_id,
        owner_id=payload.owner_id,
        classification=payload.classification,
        title=payload.title,
        content_uri=payload.content_uri,
        retention_class=payload.retention_class,
        status=_initial_status(final_decision),
        requested_action=payload.requested_action,
        policy_result_ref=decision_id,
    )
    repo.save(document)

    stored = audit_client.append(
        _build_audit_ingress(payload=payload, document=document, decision=decision)
    )
    audit_event_id = stored.get("audit_event_id")
    if audit_event_id:
        document.audit_event_refs.append(str(audit_event_id))
        document.updated_at = datetime.now(tz=timezone.utc)
        repo.save(document)
    return document


@router.get(
    "/{document_id}",
    response_model=Document,
    summary="Document を ID で取得する",
)
def get_document(
    document_id: str,
    repo: DocumentRepository = Depends(get_repository),
) -> Document:
    document = repo.get(document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"document_id not found: {document_id}",
        )
    return document


@router.get(
    "",
    response_model=list[Document],
    summary="Document を tenant_id でフィルタする",
)
def list_documents(
    tenant_id: str | None = Query(default=None),
    repo: DocumentRepository = Depends(get_repository),
) -> list[Document]:
    return repo.list(tenant_id=tenant_id)

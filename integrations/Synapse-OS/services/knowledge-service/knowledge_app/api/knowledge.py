"""Knowledge Items API (BL-011 / Sprint 2).

Endpoints:
    POST   /knowledge-items                    : Knowledge Ingest (Policy 評価 + Audit 発行)
    GET    /knowledge-items/{id}               : 単発取得
    GET    /knowledge-items                    : tenant_id / retention_class / status filter
    GET    /knowledge-items/{id}/lineage       : Lineage graph traversal (depth 制限付き)
    POST   /knowledge-items/{id}/legal-hold    : Legal Hold 設定 (Audit 発行)
    DELETE /knowledge-items/{id}               : Controlled Delete (legal_hold / federation 由来は拒否)

実装上の固定点:
    - DLP 最終判断は Policy Service に委譲 (本サービスでは行わない)
    - AI 由来 Knowledge は schema validator で ai_action_id 必須を担保 (= 422)
    - Legal Hold 中の DELETE は 409 Conflict
    - federation_event_id を持つ Knowledge は片側削除禁止 (= 409)
    - Retention 設定済みかつ retain_until 未到達なら DELETE 拒否 (= 409)
    - すべての state-change 操作は Audit Event を correlation_id=knowledge_id で append する (ADR-003)
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
from ..schemas.knowledge import (
    KnowledgeItem,
    KnowledgeItemCreateRequest,
    KnowledgeStatus,
    LegalHoldRequest,
    LineageNode,
)
from ..storage.knowledge_repository import (
    KnowledgeRepository,
    get_repository,
)

router = APIRouter(prefix="/knowledge-items", tags=["knowledge-items"])


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


def _build_policy_input(
    *, payload: KnowledgeItemCreateRequest, knowledge_id: str
) -> dict[str, str | float | bool]:
    """Knowledge Ingest 用 Policy 入力.

    DLP / mask / quarantine の最終判断を Policy Service に委譲する経路。
    object_type=KNOWLEDGE_ITEM で評価することで、Policy Engine 側の
    Knowledge rule (classification x retention_class x ai 由来) が発火する。
    """

    return {
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "tenant_id": payload.tenant_id,
        "object_type": ObjectType.KNOWLEDGE_ITEM.value,
        "object_id": knowledge_id,
        "classification": payload.classification.value,
        "action": payload.requested_action,
        "data_destination": "knowledge_store",
        "transformation_type": payload.transformation_type.value,
        "retention_class": payload.retention_class.value,
        "lineage_edge_count": len(payload.lineage_edges),
        "approval_state": "none",
        "is_state_change": True,
    }


def _compute_trust_score(
    *,
    payload: KnowledgeItemCreateRequest,
    final_decision: str,
) -> float:
    """Lineage 充足度 + Policy 結果から 0.0-1.0 信頼度を出す簡易計算.

    KNOWLEDGE_GRAPH_MODEL.md "Graph は AI 判断の根拠基盤である" を満たすため、
    Sprint 2 段階でも何らかの数値根拠を Knowledge に付与する。Sprint 3+ で
    Lineage 深度 / Approval 経路 / Federation 経路を考慮した本格スコアに差し替える。
    """

    score = 0.5

    if payload.lineage_edges:
        score += 0.2
    if any(e.audit_event_ref for e in payload.lineage_edges):
        score += 0.1
    if any(e.policy_decision_ref for e in payload.lineage_edges):
        score += 0.1
    if final_decision == PolicyDecisionType.ALLOW.value:
        score += 0.1
    elif final_decision in {
        PolicyDecisionType.QUARANTINE.value,
        PolicyDecisionType.DENY.value,
    }:
        score = max(0.0, score - 0.3)

    return min(1.0, max(0.0, score))


def _resolve_status(final_decision: str) -> KnowledgeStatus:
    """Policy Decision -> 初期 KnowledgeStatus."""

    if final_decision in {
        PolicyDecisionType.QUARANTINE.value,
        PolicyDecisionType.DENY.value,
    }:
        return KnowledgeStatus.QUARANTINED
    return KnowledgeStatus.ACTIVE


def _build_audit_ingress(
    *,
    knowledge: KnowledgeItem,
    actor_id: str,
    actor_type: str,
    action: str,
    event_type: str,
    decision: dict[str, object] | None,
    extra_after: dict[str, object] | None = None,
) -> dict[str, object]:
    """KnowledgeIngested / LegalHoldApplied / KnowledgeDeleted 共通の AuditEventIngress 互換 dict.

    correlation_id = knowledge_id とすることで Audit Timeline 上で
    Lineage を辿った先と同じ Knowledge を引ける。
    """

    after_state: dict[str, object] = {
        "status": knowledge.status.value,
        "classification": knowledge.classification.value,
        "transformation_type": knowledge.transformation_type.value,
        "retention_class": knowledge.retention_class.value,
        "legal_hold": knowledge.legal_hold,
        "trust_score": knowledge.trust_score,
        "federation_event_id": knowledge.federation_event_id,
        "lineage_edge_count": len(knowledge.lineage_edges),
    }
    if extra_after:
        after_state.update(extra_after)

    return {
        "event_type": event_type,
        "tenant_id": knowledge.tenant_id,
        "actor_id": actor_id,
        "actor_type": actor_type,
        "action": action,
        "object_id": knowledge.object_id,
        "object_type": ObjectType.KNOWLEDGE_ITEM.value,
        "correlation_id": knowledge.object_id,
        "policy_decision_ref": (decision or {}).get("policy_decision_id"),
        "policy_result": (decision or {}).get("final_decision"),
        "after_state": after_state,
    }


@router.post(
    "",
    response_model=KnowledgeItem,
    status_code=status.HTTP_201_CREATED,
    summary="Knowledge Item を ingest する (Policy 評価 + Lineage 確認 + Audit 発行)",
)
def create_knowledge_item(
    payload: KnowledgeItemCreateRequest,
    repo: KnowledgeRepository = Depends(get_repository),
    policy_client: PolicyClient = Depends(get_policy_client),
    audit_client: AuditClient = Depends(get_audit_client),
) -> KnowledgeItem:
    knowledge_id = repo.knowledge_id(tenant_id=payload.tenant_id)

    decision = policy_client.evaluate(
        _build_policy_input(payload=payload, knowledge_id=knowledge_id)
    )
    final_decision = str(decision.get("final_decision", PolicyDecisionType.ALLOW.value))
    decision_id = decision.get("policy_decision_id")

    item_status = _resolve_status(final_decision)
    trust = _compute_trust_score(payload=payload, final_decision=final_decision)

    knowledge = KnowledgeItem(
        object_id=knowledge_id,
        tenant_id=payload.tenant_id,
        owner_id=payload.owner_id,
        classification=payload.classification,
        title=payload.title,
        summary=payload.summary,
        transformation_type=payload.transformation_type,
        lineage_edges=payload.lineage_edges,
        retention_class=payload.retention_class,
        retain_until=payload.retain_until,
        federation_event_id=payload.federation_event_id,
        status=item_status,
        trust_score=trust,
        policy_result_ref=decision_id if decision_id is None else str(decision_id),
    )
    repo.save(knowledge)

    stored = audit_client.append(
        _build_audit_ingress(
            knowledge=knowledge,
            actor_id=payload.actor_id,
            actor_type=payload.actor_type,
            action=payload.requested_action,
            event_type="KnowledgeIngested",
            decision=decision,
        )
    )
    if (aid := stored.get("audit_event_id")):
        knowledge.audit_event_refs.append(str(aid))
        knowledge.updated_at = datetime.now(tz=timezone.utc)
        repo.save(knowledge)
    return knowledge


@router.get(
    "/{knowledge_id}",
    response_model=KnowledgeItem,
    summary="Knowledge Item を ID で取得する",
)
def get_knowledge_item(
    knowledge_id: str,
    repo: KnowledgeRepository = Depends(get_repository),
) -> KnowledgeItem:
    item = repo.get(knowledge_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"knowledge_id not found: {knowledge_id}",
        )
    return item


@router.get(
    "",
    response_model=list[KnowledgeItem],
    summary="Knowledge Item を tenant_id / retention_class / status で filter する",
)
def list_knowledge_items(
    tenant_id: str | None = Query(default=None),
    retention_class: str | None = Query(default=None),
    status_: str | None = Query(default=None, alias="status"),
    repo: KnowledgeRepository = Depends(get_repository),
) -> list[KnowledgeItem]:
    return repo.list(
        tenant_id=tenant_id,
        retention_class=retention_class,
        status=status_,
    )


@router.get(
    "/{knowledge_id}/lineage",
    response_model=list[LineageNode],
    summary="Knowledge Item の Lineage Graph を depth 制限付きで返す",
)
def get_lineage(
    knowledge_id: str,
    max_depth: int = Query(default=2, ge=1, le=5),
    repo: KnowledgeRepository = Depends(get_repository),
) -> list[LineageNode]:
    """Sprint 2 simple traversal:

    - 起点 Knowledge の lineage_edges を直接列挙 (depth=1)
    - source_object_type=KNOWLEDGE_ITEM の edge は同 repo を再帰的に展開 (depth<=max_depth)
    - 他種 (DOCUMENT / AI_ACTION / WORKFLOW_INSTANCE) は cross-service 解決はせず
      depth=1 ノードとして返すだけ (Sprint 3+ で各 Service への問い合わせに拡張)
    """

    root = repo.get(knowledge_id)
    if root is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"knowledge_id not found: {knowledge_id}",
        )

    nodes: list[LineageNode] = []
    visited: set[str] = {knowledge_id}

    def _visit(item: KnowledgeItem, depth: int) -> None:
        if depth > max_depth:
            return
        for edge in item.lineage_edges:
            if edge.source_object_id in visited:
                continue
            visited.add(edge.source_object_id)
            nodes.append(
                LineageNode(
                    object_id=edge.source_object_id,
                    object_type=edge.source_object_type,
                    transformation_type=edge.transformation_type,
                    depth=depth,
                    ai_action_id=edge.ai_action_id,
                    workflow_id=edge.workflow_id,
                )
            )
            if edge.source_object_type == ObjectType.KNOWLEDGE_ITEM:
                child = repo.get(edge.source_object_id)
                if child is not None:
                    _visit(child, depth + 1)

    _visit(root, depth=1)
    return nodes


@router.post(
    "/{knowledge_id}/legal-hold",
    response_model=KnowledgeItem,
    summary="Legal Hold を Knowledge Item に設定する (RETENTION_MODEL.md: Legal Hold 中削除不可)",
)
def apply_legal_hold(
    knowledge_id: str,
    payload: LegalHoldRequest,
    repo: KnowledgeRepository = Depends(get_repository),
    audit_client: AuditClient = Depends(get_audit_client),
) -> KnowledgeItem:
    item = repo.get(knowledge_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"knowledge_id not found: {knowledge_id}",
        )

    item.legal_hold = True
    item.updated_at = datetime.now(tz=timezone.utc)
    repo.save(item)

    stored = audit_client.append(
        _build_audit_ingress(
            knowledge=item,
            actor_id=payload.actor_id,
            actor_type=payload.actor_type,
            action="knowledge.legal_hold",
            event_type="LegalHoldApplied",
            decision=None,
            extra_after={"legal_hold_reason": payload.reason},
        )
    )
    if (aid := stored.get("audit_event_id")):
        item.audit_event_refs.append(str(aid))
        repo.save(item)
    return item


@router.delete(
    "/{knowledge_id}",
    response_model=KnowledgeItem,
    summary="Knowledge Item を Controlled Delete する (Legal Hold / Federation 由来 / Retention 未到達は拒否)",
)
def delete_knowledge_item(
    knowledge_id: str,
    actor_id: str = Query(...),
    actor_type: str = Query(default="human"),
    repo: KnowledgeRepository = Depends(get_repository),
    audit_client: AuditClient = Depends(get_audit_client),
) -> KnowledgeItem:
    item = repo.get(knowledge_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"knowledge_id not found: {knowledge_id}",
        )

    if item.legal_hold:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Knowledge under legal hold cannot be deleted (RETENTION_MODEL.md)",
        )
    if item.federation_event_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Federation-derived knowledge cannot be deleted unilaterally "
                "(RETENTION_MODEL.md: Federation Log は片側削除で証跡を消せない)"
            ),
        )
    if item.retain_until is not None:
        now = datetime.now(tz=timezone.utc)
        if now < item.retain_until:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Knowledge retain_until={item.retain_until.isoformat()} not yet reached",
            )

    item.status = KnowledgeStatus.DELETED
    item.updated_at = datetime.now(tz=timezone.utc)
    repo.save(item)

    stored = audit_client.append(
        _build_audit_ingress(
            knowledge=item,
            actor_id=actor_id,
            actor_type=actor_type,
            action="knowledge.delete",
            event_type="KnowledgeDeleted",
            decision=None,
        )
    )
    if (aid := stored.get("audit_event_id")):
        item.audit_event_refs.append(str(aid))
        repo.save(item)
    return item


__all__ = [
    "router",
    "get_policy_client",
    "get_audit_client",
]

"""Federation Demo API — Sprint 7 G4.

GET /federation-demo/scenario
    3社間デモシナリオを返す静的エンドポイント。
    フロントエンド開発・デモプレゼン用。Live backend がなくても動作する。

シナリオ:
    A → B : APPROVED  (L3_REGULATED trust, shared audit)
    A → C : BLOCKED   (L1_INTERNAL trust insufficient, source_only audit)
    B → C : REVIEW_REQUIRED (L2_PARTNER trust, federation council 待ち)

ADR-002 準拠: このエンドポイントは読み取り専用 (GET)。
cross-tenant 書き込みは必ず POST /federation-events を通ること。
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/federation-demo", tags=["demo"])

_FIXED_TS_A = "2026-05-27T10:00:00Z"
_FIXED_TS_B = "2026-05-27T10:05:00Z"
_FIXED_TS_C = "2026-05-27T10:10:00Z"


def _event(
    *,
    object_id: str,
    source_tenant: str,
    target_tenant: str,
    trust_level: str,
    status: str,
    audit_boundary: str,
    reasoning_summary: str,
    created_at: str,
) -> dict[str, Any]:
    """Demo FederationEvent dict — field names match backend FederationEvent schema."""
    return {
        "object_id": object_id,
        "tenant_id": source_tenant,
        "object_type": "federation_event",
        "owner_id": f"usr_{source_tenant}_admin",
        "actor_id": f"usr_{source_tenant}_admin",
        "actor_type": "human",
        "classification": "internal",
        "source_tenant": source_tenant,
        "target_tenant": target_tenant,
        "shared_object_id": f"iss_{source_tenant}_{target_tenant}_001",
        "shared_object_type": "issue",
        "trust_level": trust_level,
        "policy_binding": "default-federation",
        "audit_boundary": audit_boundary,
        "risk_score": 15.0 if status == "approved" else (85.0 if status == "blocked" else 45.0),
        "status": status,
        "reasoning_summary": reasoning_summary,
        "requested_action": "federation.share",
        "created_at": created_at,
        "updated_at": created_at,
    }


DEMO_SCENARIO: list[dict[str, Any]] = [
    _event(
        object_id="fed_demo_a_to_b_00000000000001",
        source_tenant="ten_company_a",
        target_tenant="ten_company_b",
        trust_level="l3_regulated",
        status="approved",
        audit_boundary="shared",
        reasoning_summary="A→B: L3 規制準拠パートナー。Policy allow。双方 Shared Audit に記録済み。",
        created_at=_FIXED_TS_A,
    ),
    _event(
        object_id="fed_demo_a_to_c_00000000000002",
        source_tenant="ten_company_a",
        target_tenant="ten_company_c",
        trust_level="l1_internal",
        status="blocked",
        audit_boundary="source_only",
        reasoning_summary="A→C: L1 Internal trust は cross-tenant 共有禁止。Policy deny。Source のみに記録。",
        created_at=_FIXED_TS_B,
    ),
    _event(
        object_id="fed_demo_b_to_c_00000000000003",
        source_tenant="ten_company_b",
        target_tenant="ten_company_c",
        trust_level="l2_partner",
        status="review_required",
        audit_boundary="shared",
        reasoning_summary="B→C: L2 Partner。Federation Council の双方承認待ち (approval_required)。",
        created_at=_FIXED_TS_C,
    ),
]


@router.get("/scenario", summary="3社間 Federation Demo シナリオ")
def get_demo_scenario() -> list[dict[str, Any]]:
    """3社間 Federation Demo シナリオを返す (静的データ / 副作用なし).

    Returns:
        list of FederationEvent-compatible dicts:
          - A→B: APPROVED  (L3 規制準拠)
          - A→C: BLOCKED   (L1 trust 不足)
          - B→C: REVIEW_REQUIRED (L2 Partner / 双方承認待ち)
    """
    return DEMO_SCENARIO

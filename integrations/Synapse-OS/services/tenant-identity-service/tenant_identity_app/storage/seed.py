"""Sprint 0 in-memory seed for Tenants and Identities.

Sprint 0 は永続化層を持たない。Read-Only API はこの seed を返す。
DB 化は Sprint 1+ で行う（ADR-009 候補）。
"""

from __future__ import annotations

from datetime import date

from synapse_shared.enums import ActorType, Classification, IdentityKind, TenantCode, TrustLevel

from ..schemas.identity import Identity
from ..schemas.tenant import Tenant

_SEED_DATE = date(2026, 5, 2)


def _tid(code: TenantCode, seq: int) -> str:
    return f"ten_global_{_SEED_DATE.strftime('%Y%m%d')}_{seq:04d}"


def _idn(scope: str, seq: int) -> str:
    return f"idn_{scope}_{_SEED_DATE.strftime('%Y%m%d')}_{seq:04d}"


SEED_TENANTS: list[Tenant] = [
    Tenant(
        tenant_id=_tid(TenantCode.TENA, 1),
        tenant_code=TenantCode.TENA,
        display_name="A 社 (tena)",
        default_classification=Classification.INTERNAL,
        default_trust_level=TrustLevel.L1_INTERNAL,
    ),
    Tenant(
        tenant_id=_tid(TenantCode.TENB, 2),
        tenant_code=TenantCode.TENB,
        display_name="B 社 (tenb)",
        default_classification=Classification.INTERNAL,
        default_trust_level=TrustLevel.L1_INTERNAL,
    ),
    Tenant(
        tenant_id=_tid(TenantCode.TENC, 3),
        tenant_code=TenantCode.TENC,
        display_name="C 社 (tenc)",
        default_classification=Classification.INTERNAL,
        default_trust_level=TrustLevel.L1_INTERNAL,
    ),
    Tenant(
        tenant_id=_tid(TenantCode.GLOBAL, 4),
        tenant_code=TenantCode.GLOBAL,
        display_name="Cross Tenant (global)",
        default_classification=Classification.INTERNAL,
        default_trust_level=TrustLevel.L3_JOINT,
    ),
]


def _tenant_id_of(code: TenantCode) -> str:
    for t in SEED_TENANTS:
        if t.tenant_code == code:
            return t.tenant_id
    raise KeyError(code)


SEED_IDENTITIES: list[Identity] = [
    Identity(
        identity_id=_idn("tena", 1),
        tenant_id=_tenant_id_of(TenantCode.TENA),
        actor_type=ActorType.HUMAN,
        identity_kind=IdentityKind.HUMAN,
        display_name="Sprint0 Approver (A社)",
        email="approver@tena.example.local",
    ),
    Identity(
        identity_id=_idn("tena", 2),
        tenant_id=_tenant_id_of(TenantCode.TENA),
        actor_type=ActorType.AI_AGENT,
        identity_kind=IdentityKind.AI_AGENT,
        display_name="Sprint0 AI Agent (A社)",
        service_principal="agent.policy_assistant",
    ),
    Identity(
        identity_id=_idn("tena", 3),
        tenant_id=_tenant_id_of(TenantCode.TENA),
        actor_type=ActorType.WORKFLOW,
        identity_kind=IdentityKind.WORKFLOW,
        display_name="Sprint0 Approval Workflow (A社)",
        service_principal="workflow.approval_chain",
    ),
    Identity(
        identity_id=_idn("tenb", 1),
        tenant_id=_tenant_id_of(TenantCode.TENB),
        actor_type=ActorType.HUMAN,
        identity_kind=IdentityKind.HUMAN,
        display_name="Sprint0 Approver (B社)",
        email="approver@tenb.example.local",
    ),
    Identity(
        identity_id=_idn("tenc", 1),
        tenant_id=_tenant_id_of(TenantCode.TENC),
        actor_type=ActorType.HUMAN,
        identity_kind=IdentityKind.HUMAN,
        display_name="Sprint0 Approver (C社)",
        email="approver@tenc.example.local",
    ),
]

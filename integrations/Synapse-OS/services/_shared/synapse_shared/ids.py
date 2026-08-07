"""Synapse-OS ID 規約.

形式: {prefix}_{tenant_or_scope}_{yyyymmdd}_{sequence}
- prefix       : 3文字 Entity 種別
- tenant_or_scope : tena / tenb / tenc / global
- yyyymmdd     : 作成日
- sequence     : 4桁以上の連番

正本: docs/12_Design_Review_Readiness/G1_ID_ENUM_FINALIZATION.md
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

from .enums import ObjectType, TenantCode

ID_PREFIXES: dict[str, str] = {
    "tenant": "ten",
    "identity": "idn",
    "issue": "iss",
    "approval": "app",
    "workflow_instance": "wfi",
    "document": "doc",
    "knowledge_item": "kno",
    "ai_action": "aia",
    "policy_decision": "pde",
    "audit_event": "aud",
    "federation_event": "fed",
}

OBJECT_TYPE_TO_PREFIX: dict[ObjectType, str] = {
    ObjectType.ISSUE: ID_PREFIXES["issue"],
    ObjectType.APPROVAL: ID_PREFIXES["approval"],
    ObjectType.WORKFLOW_INSTANCE: ID_PREFIXES["workflow_instance"],
    ObjectType.DOCUMENT: ID_PREFIXES["document"],
    ObjectType.KNOWLEDGE_ITEM: ID_PREFIXES["knowledge_item"],
    ObjectType.AI_ACTION: ID_PREFIXES["ai_action"],
    ObjectType.POLICY_DECISION: ID_PREFIXES["policy_decision"],
    ObjectType.AUDIT_EVENT: ID_PREFIXES["audit_event"],
    ObjectType.FEDERATION_EVENT: ID_PREFIXES["federation_event"],
}

VALID_TENANTS = {t.value for t in TenantCode}
ID_REGEX = re.compile(
    r"^(?P<prefix>[a-z]{3})_(?P<scope>tena|tenb|tenc|global)_(?P<date>\d{8})_(?P<seq>\d{4,})$"
)


@dataclass(frozen=True, slots=True)
class ParsedId:
    prefix: str
    scope: str
    date: str
    sequence: str

    @property
    def sequence_int(self) -> int:
        return int(self.sequence)


def build_id(prefix: str, tenant_or_scope: str, on_date: date, sequence: int) -> str:
    """Synapse-OS 規約に従って ID を組み立てる.

    Sprint 0 では sequence の払い出しは各 Service の内部実装に委譲する。
    ここではフォーマットの正準化のみを担う。
    """
    if prefix not in ID_PREFIXES.values():
        raise ValueError(f"Unknown ID prefix: {prefix!r}")
    if tenant_or_scope not in VALID_TENANTS:
        raise ValueError(f"Unknown tenant/scope: {tenant_or_scope!r}")
    if sequence < 1:
        raise ValueError("sequence must be >= 1")
    return f"{prefix}_{tenant_or_scope}_{on_date.strftime('%Y%m%d')}_{sequence:04d}"


def parse_id(value: str) -> ParsedId:
    m = ID_REGEX.match(value)
    if not m:
        raise ValueError(f"Invalid Synapse ID: {value!r}")
    if m.group("prefix") not in ID_PREFIXES.values():
        raise ValueError(f"Unknown prefix in id: {value!r}")
    return ParsedId(
        prefix=m.group("prefix"),
        scope=m.group("scope"),
        date=m.group("date"),
        sequence=m.group("seq"),
    )


def is_valid_id(value: str) -> bool:
    try:
        parse_id(value)
    except ValueError:
        return False
    return True

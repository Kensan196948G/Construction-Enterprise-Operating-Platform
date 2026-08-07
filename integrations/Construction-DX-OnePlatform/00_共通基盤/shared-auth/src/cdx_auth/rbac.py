"""Entra ID グループ → アプリロール マッピング.

Codex Review H4 対応:
- Entra ID の groups claim は実際には GUID (Object ID) を含むため、写像キーも GUID にする
- 設定は ``CDX_GROUP_ROLE_MAP`` 環境変数 (JSON) で動的にロード可能
- 設定変更は監査ログに記録 (本モジュール内では logging を介して出力)
- Object ID 形式の検証を行い、未登録 GUID は無視 (既定拒否)
"""
from __future__ import annotations

import json
import logging
import os
import re
from typing import Final

from cdx_auth.models import Role

log = logging.getLogger(__name__)

_OBJECT_ID_RE: Final = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


def _load_group_map() -> dict[str, Role]:
    """``CDX_GROUP_ROLE_MAP`` (JSON: ``{"<entra-group-oid>": "<role-name>", ...}``) から構築する.

    未設定なら **空辞書** (全グループに対して既定拒否)。
    """
    raw = os.getenv("CDX_GROUP_ROLE_MAP")
    if not raw:
        log.warning(
            "CDX_GROUP_ROLE_MAP is not set; RBAC will deny all role assignments. "
            "Set the env var to a JSON object {group_oid: role_name}."
        )
        return {}

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        log.error("CDX_GROUP_ROLE_MAP is not valid JSON: %s", e)
        return {}

    mapping: dict[str, Role] = {}
    for group_oid, role_name in data.items():
        if not _OBJECT_ID_RE.match(str(group_oid)):
            log.error("audit: rbac config rejected non-GUID group key %r", group_oid)
            continue
        try:
            mapping[group_oid.lower()] = Role(role_name)
        except ValueError:
            log.error(
                "audit: rbac config rejected unknown role %r for group %s", role_name, group_oid
            )
            continue
        log.info("audit: rbac config accepts group=%s -> role=%s", group_oid, role_name)
    return mapping


GROUP_TO_ROLE: dict[str, Role] = _load_group_map()


def map_groups_to_roles(groups: list[str]) -> list[Role]:
    """Entra ID groups claim (GUID リスト) を Role に写像する.

    未登録 GUID および GUID 形式でない値は無視する (既定拒否)。
    """
    seen: set[Role] = set()
    for g in groups:
        if not isinstance(g, str) or not _OBJECT_ID_RE.match(g):
            continue
        role = GROUP_TO_ROLE.get(g.lower())
        if role:
            seen.add(role)
    return sorted(seen, key=lambda r: r.value)


def reload_group_map() -> None:
    """設定環境変数の変更を取り込んで写像を再構築する (運用ホットリロード用)."""
    global GROUP_TO_ROLE
    GROUP_TO_ROLE = _load_group_map()

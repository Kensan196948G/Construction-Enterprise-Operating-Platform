"""RBAC tests — Codex H4 対応後 (Object ID 形式キー)."""
from __future__ import annotations

import json

import pytest
from cdx_auth import rbac
from cdx_auth.models import Role

OID_SITE_MANAGER = "11111111-1111-1111-1111-111111111111"
OID_SAFETY = "22222222-2222-2222-2222-222222222222"
OID_UNKNOWN = "33333333-3333-3333-3333-333333333333"


@pytest.fixture(autouse=True)
def _reset_map(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv(
        "CDX_GROUP_ROLE_MAP",
        json.dumps(
            {
                OID_SITE_MANAGER: Role.SITE_MANAGER.value,
                OID_SAFETY: Role.SAFETY_OFFICER.value,
            }
        ),
    )
    rbac.reload_group_map()
    yield
    monkeypatch.delenv("CDX_GROUP_ROLE_MAP", raising=False)
    rbac.reload_group_map()


def test_map_known_object_id():
    assert Role.SITE_MANAGER in rbac.map_groups_to_roles([OID_SITE_MANAGER])


def test_map_unknown_object_id_returns_empty():
    assert rbac.map_groups_to_roles([OID_UNKNOWN]) == []


def test_map_non_guid_rejected():
    # 旧形式の名前風キーは拒否される (既定拒否)
    assert rbac.map_groups_to_roles(["g-cdx-site-manager"]) == []


def test_map_duplicates_deduped():
    roles = rbac.map_groups_to_roles([OID_SITE_MANAGER, OID_SITE_MANAGER])
    assert roles.count(Role.SITE_MANAGER) == 1


def test_map_multiple_groups():
    roles = rbac.map_groups_to_roles([OID_SITE_MANAGER, OID_SAFETY])
    assert Role.SITE_MANAGER in roles
    assert Role.SAFETY_OFFICER in roles


def test_map_empty_env_denies_all(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("CDX_GROUP_ROLE_MAP", raising=False)
    rbac.reload_group_map()
    assert rbac.map_groups_to_roles([OID_SITE_MANAGER]) == []


def test_map_invalid_json_denies_all(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("CDX_GROUP_ROLE_MAP", "not-a-json")
    rbac.reload_group_map()
    assert rbac.map_groups_to_roles([OID_SITE_MANAGER]) == []


def test_case_insensitive_guid():
    assert Role.SITE_MANAGER in rbac.map_groups_to_roles([OID_SITE_MANAGER.upper()])

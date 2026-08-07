"""tenant-identity-service Sprint 0 tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

from tenant_identity_app.main import app

client = TestClient(app)


def test_healthz_ok() -> None:
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_list_tenants_includes_three_companies_and_global() -> None:
    r = client.get("/tenants")
    assert r.status_code == 200
    codes = {t["tenant_code"] for t in r.json()}
    assert codes == {"tena", "tenb", "tenc", "global"}


def test_tenant_id_format_is_synapse_style() -> None:
    r = client.get("/tenants")
    for t in r.json():
        assert t["tenant_id"].startswith("ten_global_")
        # 形式: ten_{scope}_{yyyymmdd}_{seq}
        parts = t["tenant_id"].split("_")
        assert len(parts) == 4
        assert len(parts[2]) == 8 and parts[2].isdigit()
        assert len(parts[3]) >= 4 and parts[3].isdigit()


def test_get_tenant_404_for_unknown() -> None:
    r = client.get("/tenants/ten_global_20260101_9999")
    assert r.status_code == 404


def test_list_identities_supports_tenant_filter() -> None:
    tena = next(
        t
        for t in client.get("/tenants").json()
        if t["tenant_code"] == "tena"
    )
    r = client.get("/identities", params={"tenant_id": tena["tenant_id"]})
    assert r.status_code == 200
    rows = r.json()
    assert rows, "A 社 Identity seed が空"
    assert all(row["tenant_id"] == tena["tenant_id"] for row in rows)


def test_identity_actor_types_cover_human_ai_workflow() -> None:
    r = client.get("/identities")
    assert r.status_code == 200
    actor_types = {i["actor_type"] for i in r.json()}
    # Sprint 0 は最低限 human / ai_agent / workflow を含む
    assert {"human", "ai_agent", "workflow"} <= actor_types

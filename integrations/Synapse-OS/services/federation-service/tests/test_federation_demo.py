"""Federation Demo API tests — Sprint 7 G4.

Tests for GET /federation-demo/scenario endpoint.
Verifies:
- 3-company scenario structure (A→B allow, A→C deny, B→C review_required)
- Field names match backend FederationEvent schema (source_tenant, target_tenant, etc.)
- Status values are valid FederationEventStatus enum values
- ADR-002: no dlp_triggered field (not in schema)
- audit_boundary values are correct per status
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from federation_app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


class TestFederationDemoScenario:
    """GET /federation-demo/scenario."""

    def test_returns_200(self, client: TestClient) -> None:
        resp = client.get("/federation-demo/scenario")
        assert resp.status_code == 200

    def test_returns_three_events(self, client: TestClient) -> None:
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        assert isinstance(events, list)
        assert len(events) == 3

    def test_field_names_match_backend_schema(self, client: TestClient) -> None:
        """Must use source_tenant / target_tenant, NOT source_tenant_id / target_tenant_id."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            # ADR-002 compliant field names
            assert "source_tenant" in ev, "Must have source_tenant (not source_tenant_id)"
            assert "target_tenant" in ev, "Must have target_tenant (not target_tenant_id)"
            assert "source_tenant_id" not in ev, "Old field source_tenant_id must not exist"
            assert "target_tenant_id" not in ev, "Old field target_tenant_id must not exist"
            # dlp_triggered was removed from schema — must not appear
            assert "dlp_triggered" not in ev, "dlp_triggered is not part of FederationEvent schema"
            # Required fields
            assert "object_id" in ev
            assert "status" in ev
            assert "trust_level" in ev
            assert "audit_boundary" in ev
            assert "reasoning_summary" in ev

    def test_cross_tenant_constraint(self, client: TestClient) -> None:
        """ADR-002: source_tenant != target_tenant."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            assert ev["source_tenant"] != ev["target_tenant"], (
                f"ADR-002 violated: source_tenant == target_tenant for event {ev['object_id']}"
            )

    def test_statuses_cover_all_three_cases(self, client: TestClient) -> None:
        """Scenario must include all three status outcomes."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        statuses = {ev["status"] for ev in events}
        assert "approved" in statuses, "Scenario must include APPROVED case (A→B)"
        assert "blocked" in statuses, "Scenario must include BLOCKED case (A→C)"
        assert "review_required" in statuses, "Scenario must include REVIEW_REQUIRED case (B→C)"

    def test_valid_status_values(self, client: TestClient) -> None:
        """All statuses must be valid FederationEventStatus values."""
        valid = {"approved", "review_required", "blocked"}
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            assert ev["status"] in valid, f"Invalid status: {ev['status']}"

    def test_valid_audit_boundary_values(self, client: TestClient) -> None:
        """audit_boundary must be 'shared' or 'source_only'."""
        valid = {"shared", "source_only"}
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            assert ev["audit_boundary"] in valid, f"Invalid audit_boundary: {ev['audit_boundary']}"

    def test_blocked_uses_source_only_audit(self, client: TestClient) -> None:
        """BLOCKED events must use source_only audit boundary (privacy protection)."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            if ev["status"] == "blocked":
                assert ev["audit_boundary"] == "source_only", (
                    "BLOCKED events must use source_only audit boundary"
                )

    def test_approved_uses_shared_audit(self, client: TestClient) -> None:
        """APPROVED events must use shared audit boundary."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            if ev["status"] == "approved":
                assert ev["audit_boundary"] == "shared", (
                    "APPROVED events must use shared audit boundary"
                )

    def test_scenario_company_a_to_b(self, client: TestClient) -> None:
        """A→B must be APPROVED."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        a_to_b = [
            ev for ev in events
            if ev["source_tenant"] == "ten_company_a" and ev["target_tenant"] == "ten_company_b"
        ]
        assert len(a_to_b) == 1, "Scenario must include A→B event"
        assert a_to_b[0]["status"] == "approved"

    def test_scenario_company_a_to_c(self, client: TestClient) -> None:
        """A→C must be BLOCKED."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        a_to_c = [
            ev for ev in events
            if ev["source_tenant"] == "ten_company_a" and ev["target_tenant"] == "ten_company_c"
        ]
        assert len(a_to_c) == 1, "Scenario must include A→C event"
        assert a_to_c[0]["status"] == "blocked"

    def test_scenario_company_b_to_c(self, client: TestClient) -> None:
        """B→C must be REVIEW_REQUIRED."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        b_to_c = [
            ev for ev in events
            if ev["source_tenant"] == "ten_company_b" and ev["target_tenant"] == "ten_company_c"
        ]
        assert len(b_to_c) == 1, "Scenario must include B→C event"
        assert b_to_c[0]["status"] == "review_required"

    def test_reasoning_summary_not_none(self, client: TestClient) -> None:
        """All demo events must have a reasoning_summary for UI display."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            assert ev["reasoning_summary"] is not None, (
                f"reasoning_summary must be set for demo event {ev['object_id']}"
            )
            assert len(ev["reasoning_summary"]) > 10, "reasoning_summary must be descriptive"

    def test_idempotent_response(self, client: TestClient) -> None:
        """GET /federation-demo/scenario is stateless — same response every call."""
        resp1 = client.get("/federation-demo/scenario")
        resp2 = client.get("/federation-demo/scenario")
        assert resp1.json() == resp2.json(), "Demo scenario must be idempotent (static data)"

    def test_trust_level_values(self, client: TestClient) -> None:
        """Trust levels must be valid and cover L1/L2/L3 in the 3-company scenario."""
        valid_trust = {"l1_internal", "l2_partner", "l3_regulated", "l4_public", "l5_federated"}
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            assert ev["trust_level"] in valid_trust, f"Invalid trust_level: {ev['trust_level']}"

    def test_a_to_b_trust_l3_regulated(self, client: TestClient) -> None:
        """A→B: L3_REGULATED means fully compliant regulated partner."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        a_to_b = next(
            ev for ev in events
            if ev["source_tenant"] == "ten_company_a" and ev["target_tenant"] == "ten_company_b"
        )
        assert a_to_b["trust_level"] == "l3_regulated"

    def test_a_to_c_trust_l1_internal(self, client: TestClient) -> None:
        """A→C: L1_INTERNAL trust is insufficient for cross-tenant sharing — should be BLOCKED."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        a_to_c = next(
            ev for ev in events
            if ev["source_tenant"] == "ten_company_a" and ev["target_tenant"] == "ten_company_c"
        )
        assert a_to_c["trust_level"] == "l1_internal"
        assert a_to_c["status"] == "blocked", "L1 trust must always result in blocked"

    def test_risk_score_blocked_higher_than_approved(self, client: TestClient) -> None:
        """BLOCKED events must have higher risk_score than APPROVED events (Policy rationale)."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        approved_scores = [ev["risk_score"] for ev in events if ev["status"] == "approved"]
        blocked_scores = [ev["risk_score"] for ev in events if ev["status"] == "blocked"]
        assert approved_scores and blocked_scores
        assert max(blocked_scores) > max(approved_scores), (
            "BLOCKED events must have higher risk_score than APPROVED"
        )

    def test_shared_object_fields_present(self, client: TestClient) -> None:
        """shared_object_id and shared_object_type must be set on all events."""
        resp = client.get("/federation-demo/scenario")
        events = resp.json()
        for ev in events:
            assert "shared_object_id" in ev, "shared_object_id is required"
            assert "shared_object_type" in ev, "shared_object_type is required"
            assert ev["shared_object_id"], "shared_object_id must be non-empty"
            assert ev["shared_object_type"], "shared_object_type must be non-empty"

    def test_content_type_is_json(self, client: TestClient) -> None:
        """Response Content-Type must be application/json."""
        resp = client.get("/federation-demo/scenario")
        assert "application/json" in resp.headers.get("content-type", ""), (
            "Demo scenario must return JSON content-type"
        )

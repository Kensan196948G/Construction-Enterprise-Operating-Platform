"""G6 Audit Evidence Export テスト.

GET /audit-events/export?format=csv&tenant_id=xxx
GET /audit-events/export?format=json&tenant_id=xxx

確認事項:
- CSV: Content-Type=text/csv, ヘッダ行 + データ行, hash_ref 含有
- JSON: Content-Type=application/json, リスト形式, hash_ref 含有
- format=csv|json 両形式でエクスポートが機能する
- tenant フィルタ: 指定テナントのイベントのみ返す
- Content-Disposition ヘッダ: attachment; filename=... が設定される
"""

from __future__ import annotations

import csv
import io
import json


def _ingest(client, tenant_id: str, event_type: str = "PolicyEvaluated") -> None:
    payload = {
        "event_type": event_type,
        "tenant_id": tenant_id,
        "actor_id": "idn_tena_20260502_0001",
        "actor_type": "human",
        "action": "policy.evaluate",
        "object_id": "pde_tena_20260502_0001",
        "object_type": "policy_decision",
        "correlation_id": "corr-export-test",
        "policy_decision_ref": "pde_tena_20260502_0001",
        "policy_result": "allow",
    }
    res = client.post("/audit-events", json=payload)
    assert res.status_code == 201, res.text


class TestAuditExportCSV:
    def test_csv_content_type(self, client, base_ingress) -> None:
        client.post("/audit-events", json=base_ingress)
        res = client.get(
            f"/audit-events/export?format=csv&tenant_id={base_ingress['tenant_id']}"
        )
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]

    def test_csv_has_header_and_data_rows(self, client, base_ingress) -> None:
        client.post("/audit-events", json=base_ingress)
        res = client.get(
            f"/audit-events/export?format=csv&tenant_id={base_ingress['tenant_id']}"
        )
        reader = csv.DictReader(io.StringIO(res.text))
        rows = list(reader)
        assert len(rows) >= 1
        assert "audit_event_id" in reader.fieldnames
        assert "hash_ref" in reader.fieldnames
        assert "previous_hash_ref" in reader.fieldnames

    def test_csv_hash_ref_populated(self, client, base_ingress) -> None:
        client.post("/audit-events", json=base_ingress)
        res = client.get(
            f"/audit-events/export?format=csv&tenant_id={base_ingress['tenant_id']}"
        )
        rows = list(csv.DictReader(io.StringIO(res.text)))
        assert rows[0]["hash_ref"].startswith("sha256:")

    def test_csv_content_disposition(self, client, base_ingress) -> None:
        client.post("/audit-events", json=base_ingress)
        res = client.get(
            f"/audit-events/export?format=csv&tenant_id={base_ingress['tenant_id']}"
        )
        disposition = res.headers.get("content-disposition", "")
        assert "attachment" in disposition
        assert ".csv" in disposition

    def test_csv_tenant_isolation(self, client) -> None:
        _ingest(client, "ten_tena_20260502_0001")
        _ingest(client, "ten_tenb_20260502_0001")
        res = client.get(
            "/audit-events/export?format=csv&tenant_id=ten_tena_20260502_0001"
        )
        rows = list(csv.DictReader(io.StringIO(res.text)))
        assert len(rows) >= 1
        assert all(r["tenant_id"] == "ten_tena_20260502_0001" for r in rows)


class TestAuditExportJSON:
    def test_json_content_type(self, client, base_ingress) -> None:
        client.post("/audit-events", json=base_ingress)
        res = client.get(
            f"/audit-events/export?format=json&tenant_id={base_ingress['tenant_id']}"
        )
        assert res.status_code == 200
        assert "application/json" in res.headers["content-type"]

    def test_json_is_list(self, client, base_ingress) -> None:
        client.post("/audit-events", json=base_ingress)
        res = client.get(
            f"/audit-events/export?format=json&tenant_id={base_ingress['tenant_id']}"
        )
        data = json.loads(res.text)
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_json_has_required_fields(self, client, base_ingress) -> None:
        client.post("/audit-events", json=base_ingress)
        res = client.get(
            f"/audit-events/export?format=json&tenant_id={base_ingress['tenant_id']}"
        )
        item = json.loads(res.text)[0]
        for field in (
            "audit_event_id",
            "event_type",
            "occurred_at",
            "tenant_id",
            "actor_id",
            "hash_ref",
            "previous_hash_ref",
        ):
            assert field in item, f"Missing field: {field}"

    def test_json_content_disposition(self, client, base_ingress) -> None:
        client.post("/audit-events", json=base_ingress)
        res = client.get(
            f"/audit-events/export?format=json&tenant_id={base_ingress['tenant_id']}"
        )
        disposition = res.headers.get("content-disposition", "")
        assert "attachment" in disposition
        assert ".json" in disposition

    def test_json_default_format(self, client, base_ingress) -> None:
        """format パラメータ省略時は JSON を返す。"""
        client.post("/audit-events", json=base_ingress)
        res = client.get(f"/audit-events/export?tenant_id={base_ingress['tenant_id']}")
        assert res.status_code == 200
        assert isinstance(json.loads(res.text), list)

"""audit-service (BL-005).

Sprint 0 範囲:
- POST /audit-events: Audit Event 受信 + JSON 永続化
- GET /audit-events: 取得（フィルタ: tenant_id / correlation_id / event_type）
- GET /audit-events/{id}

Sprint 0 非対象:
- WORM (MinIO Object Lock)
- Hash chain 検証 (previous_hash_ref を必須化)
- Audit Event の生成側（Issue/Policy/AI/Federation 由来）
"""

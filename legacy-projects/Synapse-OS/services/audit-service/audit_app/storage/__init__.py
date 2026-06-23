"""audit-service 永続化レイヤー (Sprint 0).

- in-memory dict: 直近の Event を ID で参照
- JSONL (Append Only): var/audit_events.jsonl に追記

Sprint 1 で MinIO + Object Lock (WORM) に置換する。インタフェースは AuditEventStore
を介して切り替え可能にしておく。
"""

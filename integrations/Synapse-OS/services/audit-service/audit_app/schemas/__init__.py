"""audit-service request/response schemas.

Audit Event 本体のスキーマは synapse_shared.audit_base.AuditEvent を再利用する。
ここでは API 入力としての差分（id 自動払い出し / hash_ref 自動付与のオプション）
を表現する。
"""

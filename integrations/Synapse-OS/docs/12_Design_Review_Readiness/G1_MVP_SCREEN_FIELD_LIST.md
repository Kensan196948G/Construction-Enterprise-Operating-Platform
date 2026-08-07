# G1_MVP_SCREEN_FIELD_LIST

## 目的

この文書は、GAP-005「MVP画面項目の最小セット」をCloseするための画面項目最終一覧である。

## Gap Status

| Gap | Status | 判定 |
|---|---|---|
| GAP-005 MVP画面項目の最小セット | Closed | MVP画面の最小表示項目を確定 |

## 共通表示項目

| Field | 表示対象 |
|---|---|
| tenant_badge | 全画面 |
| object_id | Object詳細 |
| status | Object詳細 |
| classification | Issue / Document / Knowledge / AI |
| policy_result | Governance Panel |
| audit_link | 重要操作 |
| correlation_id | Audit Timeline |

## Dashboard

| Area | 必須項目 |
|---|---|
| Enterprise Health | open_issue_count, pending_approval_count, critical_audit_count |
| AI Activity | ai_action_count, high_ai_risk_count, external_ai_block_count |
| DLP Alerts | dlp_violation_count, restricted_document_count |
| Federation | pending_federation_request_count, trust_warning_count |
| Navigation | Issues, Approvals, Knowledge, AI Governance, Federation, Audit |

## Issue Detail

| Area | 必須項目 |
|---|---|
| Header | issue_id, title, tenant_badge, status, priority, classification |
| Main | description, requester, owner, created_at |
| Governance Panel | policy_result, risk_score, approval_state, dlp_state |
| AI Panel | ai_recommendation_summary, confidence, explanation_link |
| Timeline | IssueCreated, PolicyEvaluated, AIPromptExecuted, ApprovalDecided |

## Approval Detail

| Area | 必須項目 |
|---|---|
| Header | approval_id, target_object_id, decision, approver |
| Context | request_summary, policy_result, risk_score, classification |
| Action | approve, reject, delegate, return |
| Reason | decision_reason |
| Audit Preview | actor, action, object_id, policy_result, timestamp |

## AI Explainability

| Area | 必須項目 |
|---|---|
| Header | ai_action_id, actor_id, model_provider, model_name |
| Prompt Audit | prompt_audit_ref, context_source_refs, dlp_result |
| Explanation | reasoning_summary, confidence, risk_score |
| Source | knowledge_refs, document_lineage_ref |
| Audit | audit_event_id, model_route_decision |

## Federation View

| Area | 必須項目 |
|---|---|
| Header | federation_event_id, source_tenant, target_tenant, status |
| Trust | trust_level, trust_factors, trust_evaluated_at |
| DLP | classification, dlp_result, mask_required |
| Approval | source_approval_state, target_approval_state |
| Audit | shared_audit_refs, correlation_id |

## Audit Timeline

| Area | 必須項目 |
|---|---|
| Event | audit_event_id, event_type, occurred_at |
| Actor | actor_id, actor_type, tenant_id |
| Target | object_id, object_type |
| Decision | policy_result, decision_reason |
| Integrity | hash_ref, retention_policy_ref |
| Trace | correlation_id, related_events |

## 設計判断

- MVP画面は美観より、状態、判断、証跡の可視化を優先する。
- AI出力の近くに必ずExplainability Linkを置く。
- Federation画面ではSource/Target Tenantを常時表示する。
- Audit Timelineは管理者専用ではなく、承認者・監査者が参照できる中核画面とする。


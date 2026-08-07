# API_CONTRACT_DETAIL

## 目的

API Contract Detail は、実装前にAPIの責務、入力、出力、Policy判定、Audit要件を整理する文書である。ここでは具体的なコードやOpenAPI定義ではなく、Domain間の契約を設計する。

## API設計原則

| 原則 | 内容 |
|---|---|
| Policy First | 重要操作はAPI内でPolicy評価を要求する |
| Audit Required | 状態変更APIはAudit Eventを生成する |
| Tenant Aware | すべてのAPIはTenant境界を明示する |
| AI Gateway Mandatory | AI関連APIはAI Gateway以外からModelへ接続しない |
| Federation Explicit | Cross Tenant操作はFederation APIとして分離する |
| Explainability Linked | AI応答は説明情報参照を持つ |

## API Groups

| API Group | 主責務 | 対象Domain |
|---|---|---|
| Object API | Issue、Approval、Document等のObject操作 | Object Domain |
| Workflow API | 状態遷移、承認要求、差戻し | Workflow Domain |
| Policy API | Policy評価、Decision取得 | Policy Domain |
| Authority API | 権限確認、Actor解決 | Authority Domain |
| AI Gateway API | Prompt実行、Model Routing、Explainability | AI Governance Domain |
| Federation API | Cross Tenant要求、Trust評価 | Federation Domain |
| Audit API | Audit記録、Timeline、eDiscovery | Audit Domain |
| Knowledge API | Knowledge参照、Lineage、Graph接続 | Knowledge Domain |
| Integration API | Teams/MailからのIssue化 | Integration Domain |

## Object API Contract

| 操作 | 入力 | 出力 | 必須Policy | 必須Audit |
|---|---|---|---|---|
| Issue作成 | tenant_id, title, description, classification | issue_id, status | AUTHORITY_POLICY | IssueCreated |
| Issue更新 | issue_id, update_fields | updated_issue | AUTHORITY_POLICY | IssueUpdated |
| Document登録 | file_ref, classification, owner | document_id | DLP_POLICY | DocumentRegistered |
| Object参照 | object_id, tenant_id | object_view | AUTHORITY_POLICY | 条件付き |

## Workflow API Contract

| 操作 | 入力 | 出力 | 必須Policy | 必須Audit |
|---|---|---|---|---|
| 承認要求 | target_object_id, approver_id | approval_id | APPROVAL_POLICY | ApprovalRequested |
| 承認判断 | approval_id, decision, reason | approval_state | APPROVAL_POLICY | ApprovalDecided |
| 差戻し | workflow_id, reason | workflow_state | WORKFLOW_POLICY | WorkflowReturned |
| Workflow進行 | workflow_id, next_state | workflow_state | WORKFLOW_POLICY | WorkflowAdvanced |

## AI Gateway API Contract

| 操作 | 入力 | 出力 | 必須Policy | 必須Audit |
|---|---|---|---|---|
| AI実行要求 | prompt_ref, context_refs, purpose | ai_action_id | AI_EXECUTION_POLICY, DLP_POLICY | AIPromptExecuted |
| Risk分析 | object_id, context_refs | risk_score, summary | AI_EXECUTION_POLICY | AIRiskAnalyzed |
| Explainability取得 | ai_action_id | explanation_view | AUTHORITY_POLICY | 条件付き |
| Model Routing判定 | classification, purpose | route_decision | AI_POLICY | ModelRouteDecided |

## Federation API Contract

| 操作 | 入力 | 出力 | 必須Policy | 必須Audit |
|---|---|---|---|---|
| 共有要求 | source_tenant, target_tenant, object_id | federation_event_id | FEDERATION_POLICY, DLP_POLICY | FederationAccessRequested |
| Trust評価 | source_tenant, target_tenant, context | trust_level | TRUST_POLICY | TrustEvaluated |
| 共有承認 | federation_event_id, decision | share_state | FEDERATION_POLICY | FederationApprovalDecided |
| 共有停止 | federation_event_id, reason | revoked_state | FEDERATION_POLICY | FederationShareRevoked |

## 標準レスポンス

| Field | 内容 |
|---|---|
| request_id | 要求ID |
| tenant_id | 実行Tenant |
| actor_id | 実行主体 |
| policy_result | Policy判定 |
| audit_event_id | Audit参照 |
| risk_score | 条件付きRisk |
| explanation_ref | AI説明参照 |
| correlation_id | Event追跡ID |

## API禁止事項

- `admin override` のようなPolicy迂回APIを設計しない
- AI Providerへ直接接続するAPIを作らない
- Cross Tenant共有をObject APIの通常更新として扱わない
- Audit保存が任意の状態変更APIを作らない


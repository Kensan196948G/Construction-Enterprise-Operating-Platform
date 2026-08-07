# DATA_CONTRACT_MODEL

## 目的

Data Contract Model は、Enterprise ObjectがDomain間で受け渡される際の必須属性、状態、参照、監査要件を定義する。これはDB物理設計ではなく、設計段階の契約である。

## Contract共通原則

| 原則 | 内容 |
|---|---|
| Tenant Required | すべてのObjectはTenant境界を持つ |
| Audit Required | 重要状態変更はAudit参照を持つ |
| Policy Bound | 重要操作はPolicy Decisionを持つ |
| Explainable AI | AI Actionは説明情報を持つ |
| Lineage Traceable | KnowledgeとDocumentは出所を追跡できる |

## Common Object Contract

| Field | 必須 | 内容 |
|---|---|---|
| object_id | Yes | 一意ID |
| object_type | Yes | Object種別 |
| tenant_id | Yes | 所属Tenant |
| owner_id | Yes | 責任者 |
| status | Yes | 状態 |
| classification | Yes | 情報分類 |
| created_at | Yes | 作成日時 |
| updated_at | Yes | 更新日時 |
| policy_result_ref | Conditional | 直近Policy判定 |
| audit_event_refs | Yes | 監査Event参照 |
| federation_scope | Conditional | 共有範囲 |

## Issue Contract

| Field | 必須 | 内容 |
|---|---|---|
| issue_id | Yes | Issue ID |
| issue_type | Yes | request / incident / change / approval / security |
| title | Yes | 件名 |
| description | Yes | 内容 |
| priority | Yes | P1-P4 |
| requester_id | Yes | 起票者 |
| assignee_id | Conditional | 担当 |
| workflow_id | Yes | 関連Workflow |
| risk_score | Conditional | AIまたはSecurityリスク |
| approval_state | Yes | none / required / approved / rejected |

## Approval Contract

| Field | 必須 | 内容 |
|---|---|---|
| approval_id | Yes | 承認ID |
| target_object_id | Yes | 対象Object |
| requester_id | Yes | 申請者 |
| approver_id | Yes | 承認者 |
| approval_policy_ref | Yes | 適用Policy |
| decision | Yes | pending / approved / rejected / delegated |
| decision_reason | Conditional | 判断理由 |
| ai_recommendation_ref | Conditional | AI提案 |
| audit_event_ref | Yes | 監査証跡 |

## AI Action Contract

| Field | 必須 | 内容 |
|---|---|---|
| ai_action_id | Yes | AI操作ID |
| actor_id | Yes | HumanまたはAI Agent |
| model_provider | Yes | Provider |
| model_name | Yes | Model |
| prompt_audit_ref | Yes | Prompt監査参照 |
| context_source_refs | Yes | 参照Knowledge |
| dlp_result_ref | Yes | DLP判定 |
| reasoning_summary | Yes | 推論要約 |
| confidence | Conditional | 信頼度 |
| risk_score | Yes | リスク |
| output_ref | Conditional | 出力参照 |
| audit_event_ref | Yes | AI Audit |

## Federation Event Contract

| Field | 必須 | 内容 |
|---|---|---|
| federation_event_id | Yes | Federation Event ID |
| source_tenant_id | Yes | 起点Tenant |
| target_tenant_id | Yes | 対象Tenant |
| shared_object_id | Yes | 共有Object |
| trust_level | Yes | Trust Level |
| federation_policy_ref | Yes | 適用Policy |
| dlp_result_ref | Conditional | DLP判定 |
| approval_refs | Yes | 双方承認 |
| audit_event_refs | Yes | 双方Audit |

## Document / Knowledge Contract

| Field | 必須 | 内容 |
|---|---|---|
| document_id / knowledge_id | Yes | ID |
| source_type | Yes | file / mail / teams / git / ai_generated |
| classification | Yes | Public / Internal / Confidential / Restricted |
| retention_policy_ref | Yes | 保持Policy |
| lineage_ref | Yes | Data Lineage |
| dlp_state | Yes | clean / masked / blocked / review_required |
| knowledge_graph_refs | Conditional | Graph参照 |

## Contract未確定事項

- ID採番規則
- Versioning方式
- External IdP属性Mapping
- Data Masking表現
- eDiscovery検索属性


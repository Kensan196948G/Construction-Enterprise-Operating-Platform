# G1_AUDIT_EVENT_SCHEMA_FINALIZATION

## 目的

この文書は、GAP-004「Audit Event必須属性」をCloseするためのAudit Event Schema最終定義である。

## Gap Status

| Gap | Status | 判定 |
|---|---|---|
| GAP-004 Audit Event必須属性 | Closed | MVP実装に必要なAudit必須属性を確定 |

## Audit Event基本原則

| 原則 | 内容 |
|---|---|
| Immutable | 監査Eventは更新ではなく追記 |
| Correlatable | 関連EventをCorrelation IDで追跡可能 |
| Actor Explicit | Human / AI Agent / Workflowを明示 |
| Policy Linked | Policy Decisionと接続 |
| Explainable AI | AI Eventは説明情報と接続 |

## Audit Event Schema

| Field | 必須 | 内容 |
|---|---|---|
| audit_event_id | Yes | `aud_{tenant}_{yyyymmdd}_{sequence}` |
| occurred_at | Yes | 発生日時 |
| tenant_id | Yes | 起点Tenant |
| actor_id | Yes | 実行主体ID |
| actor_type | Yes | human / ai_agent / workflow / system / external_partner |
| action | Yes | 実行操作 |
| object_id | Yes | 対象Object |
| object_type | Yes | 対象Object種別 |
| policy_decision_ref | Conditional | Policy Decision参照 |
| policy_result | Conditional | allow / deny / approval_required等 |
| correlation_id | Yes | 関連Event追跡ID |
| request_id | Conditional | API要求ID |
| source_ip_or_device | Conditional | 端末・接続元 |
| explanation_ref | Conditional | AI説明参照 |
| before_state | Conditional | 変更前状態 |
| after_state | Conditional | 変更後状態 |
| hash_ref | Yes | 改ざん検知Hash参照 |
| retention_policy_ref | Yes | 保持Policy |

## Audit Event Type

| Event Type | 対象 |
|---|---|
| IssueCreated | Issue作成 |
| IssueUpdated | Issue更新 |
| PolicyEvaluated | Policy判定 |
| ApprovalRequested | 承認要求 |
| ApprovalDecided | 承認判断 |
| AIPromptExecuted | AI実行 |
| ModelRouteDecided | Model Routing |
| AIRiskAnalyzed | AI Risk分析 |
| DocumentClassified | 文書分類 |
| DLPViolationDetected | DLP違反 |
| FederationAccessRequested | Federation共有要求 |
| FederationShared | Federation共有完了 |
| TrustEvaluated | Trust評価 |

## Hash / Retention

| 項目 | MVP方針 |
|---|---|
| hash_ref | Audit Event正規化後のHash参照 |
| previous_hash_ref | MVPでは推奨、Pilot前に必須化 |
| retention_policy_ref | audit_default_long |
| deletion | 直接削除不可。Retention/Legal Hold経由 |

## AI Audit追加属性

| Field | 必須 | 内容 |
|---|---|---|
| prompt_audit_ref | Yes | Prompt監査参照 |
| model_provider | Yes | AI Provider |
| model_name | Yes | Model名 |
| context_source_refs | Yes | 参照Knowledge |
| dlp_result_ref | Yes | DLP判定 |
| reasoning_summary_ref | Yes | Reasoning Summary |
| confidence | Conditional | 信頼度 |
| risk_score | Yes | AI Risk |

## 設計判断

- MVPでもAudit Eventは任意ログではなく必須Contractとする。
- AI、Approval、Federationは必ずAudit Eventを生成する。
- Hashの具体実装方式は後続設計でよいが、`hash_ref`は必須属性として固定する。
- RetentionはMVPでは `audit_default_long` を既定とする。


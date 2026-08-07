# API_CONTRACT_MODEL

## 目的

API Contract Model は、Enterprise Object、Workflow、AI Gateway、Federation、Auditを安全に接続するためのAPI契約を定義する。

## API原則

| 原則 | 内容 |
|---|---|
| Policy Enforced | API GatewayでPolicy判定 |
| Tenant Aware | すべてのAPIにTenant境界を持たせる |
| Audit Required | 重要操作はAudit Eventを生成 |
| Idempotent | Event再送に耐える |
| Explainable | AI応答は説明情報を含む |
| Versioned | Contractを明示Version管理 |

## Contract対象

| API | 内容 |
|---|---|
| Object API | Issue、Approval、Document等 |
| Workflow API | BPM、承認、CAB |
| AI Gateway API | Prompt、Model Routing、Explainability |
| Federation API | Cross Tenant要求 |
| Audit API | 証跡参照、eDiscovery |
| Policy API | Policy評価 |

## 標準レスポンス属性

- request_id
- tenant_id
- policy_result
- audit_event_id
- risk_score
- explanation_ref
- correlation_id

## 原則

- APIは便利な裏口にしない
- UI、Agent、外部連携は同じPolicy Contractを通過する
- Cross Org APIはTrust ModelとDLPを必須にする


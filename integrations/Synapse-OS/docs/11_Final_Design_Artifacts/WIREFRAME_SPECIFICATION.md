# WIREFRAME_SPECIFICATION

## 目的

Wireframe Specification は、実装前にMVP画面の情報配置、表示責務、操作導線を定義する。これはUIコードや詳細ビジュアルではなく、Enterprise Control Roomとして必要な画面構造である。

## 共通画面レイアウト

```text
┌──────────────────────────────────────────────┐
│ Top Status Bar: Tenant / User / Alerts / AI  │
├───────────────┬──────────────────────┬───────┤
│ Global Nav    │ Main Object Area     │ Right │
│ - Dashboard   │                      │ Panel │
│ - Issues      │                      │       │
│ - Approvals   │                      │       │
│ - Knowledge   │                      │       │
│ - AI          │                      │       │
│ - Federation  │                      │       │
│ - Audit       │                      │       │
├───────────────┴──────────────────────┴───────┤
│ Timeline / Audit Trail                       │
└──────────────────────────────────────────────┘
```

## Dashboard

| Area | 表示項目 | 操作 |
|---|---|---|
| Enterprise Health | Open Issues, Pending Approvals, DLP Alerts | 各一覧へ遷移 |
| AI Activity | AI Actions, High Risk, Explainability Missing | AI Action Viewへ遷移 |
| Federation | Pending Shares, Trust Warnings | Federation Viewへ遷移 |
| Audit | Audit Exceptions, Recent Critical Events | Audit Timelineへ遷移 |

## Issue Detail

| Area | 表示項目 |
|---|---|
| Header | Issue ID, Title, Tenant, Status, Priority, Classification |
| Main | Description, Linked Document, Comments |
| Governance Panel | Policy Result, Risk Score, Approval State |
| AI Panel | AI Recommendation, Confidence, Explanation Link |
| Timeline | IssueCreated, PolicyEvaluated, AIPromptExecuted, ApprovalDecided |

## Approval Detail

| Area | 表示項目 |
|---|---|
| Header | Approval ID, Target Object, Approver, Decision |
| Decision Context | Request Summary, Policy Result, AI Risk |
| Action Area | Approve, Reject, Delegate, Return |
| Required Reason | Decision Reason |
| Audit Preview | 保存されるAudit項目 |

## AI Explainability View

| Area | 表示項目 |
|---|---|
| Header | AI Action ID, Model, Actor, Purpose |
| Prompt Audit | Prompt Ref, Context Sources, DLP Result |
| Explanation | Reasoning Summary, Confidence, Risk Score |
| Source | Knowledge References, Document Lineage |
| Audit | AIPromptExecuted, ModelRouteDecided |

## Federation View

| Area | 表示項目 |
|---|---|
| Header | Federation Event ID, Source Tenant, Target Tenant |
| Trust | Trust Level, Trust Factors |
| DLP | Classification, Mask Required, Block Reason |
| Approval | Source Approval, Target Approval |
| Shared Audit | 双方Audit Event |

## Wireframe原則

- 承認操作の近くにAI Risk、Policy Result、Audit Previewを置く
- AI出力単体の画面を作らず、必ずExplainabilityとSourceを併置する
- Federation ViewではSource/Target Tenantを常時表示する
- Timelineはコメント欄ではなく、EventとAuditの公式履歴として扱う


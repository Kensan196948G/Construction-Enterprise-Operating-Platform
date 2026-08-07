# TEST_STRATEGY

## 目的

Test Strategy は、MVP実装前に、Enterprise OSとして守るべき統制、監査、AI、Federation境界をどう検証するかを定義する。ここでは具体的なテストコードではなく、検証観点と合格条件を整理する。

## Test Layers

| Layer | 目的 |
|---|---|
| Contract Test | API/Data Contractが守られるか |
| Policy Test | Policy Decisionが期待通りか |
| Workflow Test | 状態遷移と禁止遷移が守られるか |
| AI Governance Test | AI Gateway、DLP、Explainabilityが必須化されるか |
| Federation Test | Tenant境界とTrust評価が守られるか |
| Audit Test | 重要操作がAuditに残るか |
| UX Acceptance Test | DashboardからObject、AI説明、Auditへ辿れるか |

## Critical Test Scenarios

| Scenario | 合格条件 |
|---|---|
| Issue作成 | IssueCreated Auditが生成される |
| Approval判断 | ApprovalDecided AuditとDecision Reasonが保存される |
| AI Risk分析 | Prompt Audit、DLP、Model Routing、Reasoning Summaryが揃う |
| Restricted文書AI要約 | 外部AI送信がdenyまたはlocal_llm_requiredになる |
| Federation共有 | Trust、DLP、双方Approval、Shared Auditが揃う |
| 承認迂回 | submitted -> approved の直接遷移が拒否される |
| AI直接接続 | Gateway外のAI実行経路が存在しない |

## Policy Test Matrix

| 条件 | 期待Decision |
|---|---|
| Internal文書の社内AI要約 | allow |
| Confidential文書の外部AI要約 | local_llm_required |
| Restricted文書の外部AI送信 | deny |
| Cross Tenant共有 + DLP未判定 | federation_review_required |
| 本番変更 + AI Agent単独実行 | approval_required |

## Audit Test Matrix

| 操作 | 必須Audit |
|---|---|
| Issue作成 | IssueCreated |
| Policy判定 | PolicyEvaluated |
| AI実行 | AIPromptExecuted |
| Model Routing | ModelRouteDecided |
| 承認判断 | ApprovalDecided |
| Federation共有 | FederationShared |
| DLP違反 | DLPViolationDetected |

## Non Goals Guard Test

| Guard | 確認内容 |
|---|---|
| GitHub clone化防止 | Repository/PR中心の設計になっていない |
| ERP化防止 | 会計・販売など基幹ERP機能をMVPに入れていない |
| Direct AI Access防止 | AI Gateway外のAI導線がない |
| Monolith防止 | Service責務が分離されている |
| AI Black Box防止 | Explainabilityが必須である |

## MVP合格基準

```text
MVP Test Ready:
- Critical Test Scenariosが定義済み
- Policy Test Matrixが定義済み
- Audit Test Matrixが定義済み
- Non Goals Guard Testが定義済み
- 実装前に受け入れ条件へ接続できる
```


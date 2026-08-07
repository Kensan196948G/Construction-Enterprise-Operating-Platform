# DESIGN_REVIEW_CHECKLIST

## 目的

Design Review Checklist は、AI Native Enterprise OS の設計が、Constitution、Object、Policy、AI Gateway、Federation、Audit、MVP Scopeから逸脱していないかを確認するためのレビュー項目である。

## Review判定

| 判定 | 意味 |
|---|---|
| Pass | 設計として満たしている |
| Partial | 方向性はあるが具体化が不足 |
| Fail | 原則違反または未定義 |
| N/A | 現時点のMVP対象外 |

## Constitution Review

| 項目 | 判定観点 |
|---|---|
| Governance First | 機能よりPolicyとAuditが先に定義されている |
| Federation Native | A社/B社/C社を中央統合せずTenant境界で扱っている |
| AI Gateway Mandatory | AI利用がGateway経由として定義されている |
| Auditability | 重要操作がAudit Eventに接続している |
| Explainability | AI Actionに説明根拠が接続している |
| Non Goals | GitHub clone、ERP clone、Direct AI Accessを避けている |

## Object / Policy Review

| 項目 | 判定観点 |
|---|---|
| Core Object | Issue、Approval、Workflow、Knowledge、Audit、AI Action、Federation Eventが定義済み |
| Object Relation | Object間の参照、承認、監査、共有関係が定義済み |
| Event Model | 状態変化がEventとして定義済み |
| Policy Decision | allow / deny / approval_required等が定義済み |
| Forbidden Transition | 承認迂回やAI直実行などの禁止遷移が定義済み |

## AI Governance Review

| 項目 | 判定観点 |
|---|---|
| Prompt Audit | Prompt、Context、Modelが監査対象 |
| DLP Integration | AI入力前にDLP判定がある |
| Model Routing | 機密分類に応じたRoutingがある |
| Explainability | Reasoning Summary、Source、Riskがある |
| AI Agent Identity | AI Agentが実行主体として扱われる |

## Federation Review

| 項目 | 判定観点 |
|---|---|
| Tenant Isolation | Tenant境界がData、UI、APIに現れる |
| Trust Model | Trust Levelと評価要素がある |
| Cross Org Workflow | 双方承認とShared Auditがある |
| Federation Event | Cross Tenant操作が独立Objectである |
| DLP on Sharing | 共有前DLPが必須である |

## MVP Review

| 項目 | 判定観点 |
|---|---|
| Scope限定 | Issue + Approval、AI Audit、Document Governance、Federation Authに絞られている |
| Pilot Scenario | 代表シナリオと失敗条件がある |
| Acceptance Criteria | MVP合格条件が明文化されている |
| Backlog接続 | P1 BacklogがAcceptanceに接続している |
| Test Strategy | Policy、Audit、AI、Federationの検証観点がある |

## 現時点のレビュー結論

```text
Review Status: Partial Pass
Reason:
- Enterprise OSとしての上位原則、Object、Policy、AI、Federation、Auditは整理済み。
- 実装開始前に、Gap Closure対象の未確定事項を潰す必要がある。
```


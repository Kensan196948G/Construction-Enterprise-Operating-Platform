# TRACEABILITY_MATRIX

## 目的

Traceability Matrix は、Constitutionの原則が、Object、Policy、API、UI、MVP Acceptanceのどこで満たされているかを追跡するための対応表である。

## 原則対応表

| Constitution原則 | Object | Policy / API | UI | Acceptance |
|---|---|---|---|---|
| Governance First | Policy、Approval | Policy API、Workflow API | Policy Result表示 | ApprovalとPolicy判定が必須 |
| Federation Native | Federation Event | Federation API | Tenant Badge、Federation View | Cross Tenant共有がFederation Eventになる |
| AI Gateway Mandatory | AI Action | AI Gateway API | AI Action View | AI利用はGateway経由 |
| Auditability | Audit | Audit API、全状態変更API | Audit Timeline | 承認/AI/FederationがAuditに残る |
| Explainability | AI Action、Knowledge | Explainability取得 | Explainability Panel | Reasoning Summaryと参照Knowledgeが確認可能 |
| Knowledge Centered | Knowledge、Document | Knowledge API | Knowledge Detail | Document Lineageが確認可能 |
| Policy Based | Policy | Policy API | Governance Panel | Policy Resultが確認可能 |
| Event Driven | Event | Event Contract | Timeline | 状態変化が追跡可能 |
| Zero Trust | Identity、Federation Event | Authority API、Trust評価 | Trust Level表示 | Tenant境界とTrustが見える |

## MVP機能対応表

| MVP機能 | 関連Object | 関連Service | 関連画面 | 監査Event |
|---|---|---|---|---|
| Issue + Approval | Issue、Approval | Object、Workflow、Policy | Issue Detail、Approval Detail | IssueCreated、ApprovalDecided |
| AI Audit | AI Action | AI Gateway、Audit | AI Action View | AIPromptExecuted |
| Document Governance | Document、Knowledge | Object、Knowledge、Policy | Document View | DocumentClassified |
| Federation Auth | Identity、Federation Event | Authority、Federation | Federation View | FederationAccessRequested |
| Teams/Mail統合 | Issue、Knowledge | Integration、Object | Issue Create、Timeline | ExternalMessageCaptured |

## Gap確認

| Gap | 現在状態 | 次アクション |
|---|---|---|
| API詳細の粒度 | Contractレベル | 実装前にOpenAPI相当へ落とす |
| Data型定義 | 論理Contract | ID、Enum、Versioningを確定する |
| UI詳細 | 情報設計レベル | Wireframe前に画面単位の項目表を作る |
| Security | Threat Matrix | Controlごとの検証観点を作る |
| Pilot | シナリオ候補 | 実施手順と判定表を作る |

## Traceability原則

- Constitutionにない機能をMVPへ入れない
- MVP Acceptanceにない実装を優先しない
- APIはObject、Policy、Auditのどれかに必ず紐づく
- UIは状態、判断、証跡を隠さない


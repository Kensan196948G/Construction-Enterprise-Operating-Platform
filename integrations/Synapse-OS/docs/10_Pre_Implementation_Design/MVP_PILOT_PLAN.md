# MVP_PILOT_PLAN

## 目的

MVP Pilot Plan は、実装前にA社/B社/C社を想定した検証シナリオ、判定観点、成功条件を定義する。これは開発計画ではなく、Enterprise OSとして何を実証するかの計画である。

## Pilot方針

| 方針 | 内容 |
|---|---|
| Small but Real | 小さくても実務に近いシナリオにする |
| Governance First | 統制、承認、監査を省略しない |
| Federation Visible | A社/B社/C社の境界を必ず検証する |
| AI Explainable | AI出力だけでなく根拠を確認する |
| Non Goals Guard | ERP化、GitHub clone化、AI直結を避ける |

## Pilot Scenario 1: A社 Issue + Approval

| 項目 | 内容 |
|---|---|
| 目的 | Issue + Approvalを企業活動の起点として検証 |
| Actor | A社社員、A社上長、AI Risk Agent |
| 対象Object | Issue、Approval、AI Action、Audit |
| 成功条件 | AI Riskを参照し、人間承認し、Auditに残る |
| 失敗条件 | AIが最終承認者になる、Auditが残らない |

## Pilot Scenario 2: Confidential Document AI Summary

| 項目 | 内容 |
|---|---|
| 目的 | DLPとModel Routingを検証 |
| Actor | A社社員、AI Gateway、DLP Policy |
| 対象Object | Document、AI Action、Policy、Audit |
| 成功条件 | Confidential文書が外部AIへ送信されず、Local LLMへRoutingされる |
| 失敗条件 | DLPなしで外部AIに送信される |

## Pilot Scenario 3: A社からB社へのKnowledge共有

| 項目 | 内容 |
|---|---|
| 目的 | Federation共有とTrust評価を検証 |
| Actor | A社担当、B社承認者、Federation Service |
| 対象Object | Knowledge、Federation Event、Approval、Audit |
| 成功条件 | Trust、DLP、双方承認、Shared Auditが残る |
| 失敗条件 | Tenant境界を越えて無承認共有される |

## Pilot Scenario 4: Teams MessageからIssue化

| 項目 | 内容 |
|---|---|
| 目的 | 実務コミュニケーションをEnterprise Object化 |
| Actor | Teams利用者、Integration Service、Object Service |
| 対象Object | Issue、Knowledge、Audit |
| 成功条件 | Teams文脈がIssue化され、元Message参照とAuditが残る |
| 失敗条件 | IntegrationがPolicyを迂回してWorkflowを進める |

## Pilot判定表

| 判定観点 | Pass条件 |
|---|---|
| Governance | Policy Resultが表示・保存される |
| Authority | Actor権限が確認される |
| Audit | 重要操作がTimelineに残る |
| AI | Prompt、Model、Reasoning Summaryが確認できる |
| DLP | Classificationに応じた制御が働く |
| Federation | Tenant、Trust、双方承認が確認できる |
| UX | Dashboardから対象Objectへ到達できる |

## Pilot終了条件

```text
Pilot Design Ready:
- 4つのPilot Scenarioが説明可能
- 各ScenarioがAcceptance Criteriaに接続
- 失敗条件が定義済み
- Security Threat Modelとの対応が確認済み
- Non Goalsを破っていない
```


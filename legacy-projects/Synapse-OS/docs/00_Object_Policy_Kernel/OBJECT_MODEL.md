# OBJECT_MODEL

## 目的

Object Model は、AI Native Enterprise OS が扱う企業活動を、共通の Enterprise Object として定義する。これはDB設計ではなく、Workflow、Policy、Audit、AI、Federationを接続するための意味モデルである。

## Core Enterprise Objects

| Object | 役割 | 最初のMVP対象 |
|---|---|---|
| Issue | 企業活動の起点。課題、依頼、稟議、変更、障害を表す | Yes |
| Approval | 承認、稟議、CAB、人間監督を表す | Yes |
| Workflow | 業務進行、状態遷移、SLAを表す | Yes |
| Knowledge | 文書、議事録、Runbook、FAQ、設計知識を表す | Yes |
| Document | ファイル、契約、Excel、PDF、Teams添付を表す | Yes |
| Audit | 操作、判断、Policy評価、AI根拠の証跡を表す | Yes |
| Asset | CMDB、システム、SaaS、AI System、端末を表す | Later |
| AI Action | Prompt、AI推論、AI出力、AI Agent操作を表す | Yes |
| Federation Event | Tenant境界を越えた操作を表す | Yes |
| Policy | 判断条件、禁止、承認要件、DLP条件を表す | Yes |
| Identity | Human、AI Agent、Workflow、外部Partnerを表す | Yes |

## Object共通属性

| 属性 | 内容 |
|---|---|
| object_id | Enterprise OS全体で一意なID |
| object_type | Issue、Approval、AI Actionなど |
| tenant_id | 所属Tenant |
| owner | 責任者または責任組織 |
| status | 現在状態 |
| classification | 情報分類 |
| policy_bindings | 適用Policy |
| audit_trail | 関連Audit Event |
| federation_scope | 共有範囲 |
| created_by | Human / AI Agent / Workflow |

## Object原則

- すべての重要な企業活動はObjectとして表現する
- Objectの状態変化はEventとして記録する
- ObjectはPolicy、Authority、Auditと必ず接続する
- AI Actionは補助ログではなく正式なEnterprise Objectとする


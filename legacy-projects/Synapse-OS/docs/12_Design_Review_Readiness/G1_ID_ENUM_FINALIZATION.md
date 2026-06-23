# G1_ID_ENUM_FINALIZATION

## 目的

この文書は、GAP-001「ID採番規則の詳細」とGAP-002「Enum最終一覧」をCloseするための最終定義である。

## Gap Status

| Gap | Status | 判定 |
|---|---|---|
| GAP-001 ID採番規則の詳細 | Closed | MVP実装に必要なID規則を確定 |
| GAP-002 Enum最終一覧 | Closed | MVP実装に必要なEnumを確定 |

## ID基本規則

| 項目 | 規則 |
|---|---|
| 形式 | `{prefix}_{tenant_or_scope}_{yyyymmdd}_{sequence}` |
| prefix | Entity種別を表す3文字 |
| tenant_or_scope | Tenant IDまたはglobal |
| yyyymmdd | 作成日 |
| sequence | 4桁以上の連番 |
| 外部ID | `external_refs` として別管理 |

## ID Prefix

| Entity | Prefix | 例 |
|---|---|---|
| Tenant | ten | ten_global_20260502_0001 |
| Identity | idn | idn_tena_20260502_0001 |
| Issue | iss | iss_tena_20260502_0001 |
| Approval | app | app_tena_20260502_0001 |
| WorkflowInstance | wfi | wfi_tena_20260502_0001 |
| Document | doc | doc_tena_20260502_0001 |
| KnowledgeItem | kno | kno_tena_20260502_0001 |
| AIAction | aia | aia_tena_20260502_0001 |
| PolicyDecision | pde | pde_tena_20260502_0001 |
| AuditEvent | aud | aud_tena_20260502_0001 |
| FederationEvent | fed | fed_global_20260502_0001 |

## Tenant Code

| Tenant | Code | 用途 |
|---|---|---|
| A社 | tena | A社Tenant |
| B社 | tenb | B社Tenant |
| C社 | tenc | C社Tenant |
| Cross Tenant | global | Federation / Shared Audit |

## Core Enum: ObjectType

| Value | 意味 |
|---|---|
| issue | Issue |
| approval | Approval |
| workflow_instance | WorkflowInstance |
| document | Document |
| knowledge_item | KnowledgeItem |
| ai_action | AIAction |
| policy_decision | PolicyDecision |
| audit_event | AuditEvent |
| federation_event | FederationEvent |

## Core Enum: Classification

| Value | AI利用 | Federation共有 |
|---|---|---|
| public | 外部AI可 | 可 |
| internal | Gateway経由 | 条件付き |
| confidential | Local LLM優先 | DLP/承認必須 |
| restricted | 外部AI禁止 | 原則禁止 |

## Core Enum: ActorType

| Value | 意味 |
|---|---|
| human | 人間 |
| ai_agent | AI Agent |
| workflow | Workflow |
| system | System |
| external_partner | 外部Partner |

## Core Enum: PolicyDecisionType

| Value | 意味 |
|---|---|
| allow | 許可 |
| deny | 禁止 |
| approval_required | 承認必須 |
| mask_required | Mask必須 |
| local_llm_required | Local LLM必須 |
| federation_review_required | Federation審査必須 |
| quarantine | 隔離 |

## Core Enum: IssueStatus

| Value | 意味 |
|---|---|
| draft | 下書き |
| submitted | 提出済み |
| policy_checking | Policy判定中 |
| ai_reviewing | AI分析中 |
| approval_required | 承認待ち |
| approved | 承認済み |
| rejected | 却下 |
| executing | 実行中 |
| audited | 監査済み |
| closed | 完了 |

## Core Enum: ApprovalDecision

| Value | 意味 |
|---|---|
| pending | 未判断 |
| approved | 承認 |
| rejected | 却下 |
| delegated | 委任 |
| returned | 差戻し |

## Core Enum: TrustLevel

| Value | 意味 |
|---|---|
| l1_internal | 同一Tenant |
| l2_group | グループ会社 |
| l3_joint | JV/共同事業 |
| l4_partner | SI/Partner |
| l5_public | 外部公開 |

## 設計判断

- IDはMVPでは人間可読性を優先し、Prefix + Tenant + Date + Sequenceとする。
- 外部IDやIdP IDは主IDへ混ぜず、`external_refs` で保持する。
- Federation Eventは複数Tenantに跨るため、scopeを`global`にする。
- EnumはMVPの安定性を優先し、過剰に細分化しない。


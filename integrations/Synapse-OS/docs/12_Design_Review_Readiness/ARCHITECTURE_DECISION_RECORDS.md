# ARCHITECTURE_DECISION_RECORDS

## 目的

Architecture Decision Records は、Enterprise OS設計における重要判断を後から追跡可能にするための記録である。

## ADR一覧

| ADR | Decision | Status |
|---|---|---|
| ADR-001 | AI Gatewayを必須経路にする | Accepted |
| ADR-002 | Federation Eventを独立Entityにする | Accepted |
| ADR-003 | Audit Eventを横断Entityにする | Accepted |
| ADR-004 | Issueを企業活動の起点にする | Accepted |
| ADR-005 | ApprovalをCommentではなくObjectにする | Accepted |
| ADR-006 | AI Actionを独立Objectにする | Accepted |
| ADR-007 | MVPはIssue + Approval中心に絞る | Accepted |
| ADR-008 | BackendをPython + FastAPIに固定する | Accepted |

## ADR-001: AI Gateway Mandatory

| 項目 | 内容 |
|---|---|
| Context | 複数LLM、AI Agent、Prompt監査、DLPが必要 |
| Decision | すべてのAI利用をAI Gateway経由にする |
| Consequence | Direct AI Accessは禁止。Model RoutingとPrompt Auditが必須 |

## ADR-002: Federation Event as Entity

| 項目 | 内容 |
|---|---|
| Context | A社/B社/C社を中央統合せず連携させる |
| Decision | Cross Tenant操作をFederation Eventとして独立Entity化 |
| Consequence | 共有、Trust、DLP、双方承認、Shared Auditを追跡可能 |

## ADR-003: Audit Event as Cross-Cutting Entity

| 項目 | 内容 |
|---|---|
| Context | 人間、AI、Workflow、Federationの判断を追跡する必要 |
| Decision | Audit Eventを横断Entityとして全重要操作に紐づける |
| Consequence | Auditは後付けログではなく設計契約になる |

## ADR-004: Issue as Enterprise Activity Entry Point

| 項目 | 内容 |
|---|---|
| Context | 稟議、依頼、変更、障害、AI Reviewの起点が必要 |
| Decision | Issueを企業活動の起点Objectにする |
| Consequence | GitHub cloneではなく、Enterprise Objectとして再定義する |

## ADR-005: Approval as Object

| 項目 | 内容 |
|---|---|
| Context | 日本企業文化では承認が業務判断の核 |
| Decision | Approvalをコメントや状態ではなく独立Objectにする |
| Consequence | 承認理由、Policy、AI提案、Auditを保持できる |

## ADR-006: AI Action as Object

| 項目 | 内容 |
|---|---|
| Context | AI操作の説明責任と監査が必要 |
| Decision | AI Actionを独立Objectにする |
| Consequence | Prompt、Model、Context、Reasoning、Riskを追跡できる |

## ADR-007: MVP Scope

| 項目 | 内容 |
|---|---|
| Context | Enterprise OS構想は巨大化しやすい |
| Decision | MVPはIssue + Approval、AI Audit、Document Governance、Federation Auth、Teams/Mail統合に絞る |
| Consequence | ERP、完全ITSM、完全Knowledge GraphはMVP対象外 |

## ADR-008: Backend Stack as Python + FastAPI

| 項目 | 内容 |
|---|---|
| Context | CLAUDE.mdではBackendを「FastAPIまたはGo」として未確定にしていた。Sprint 0着手にあたり、Object/Policy/Audit/Federationの各Data ContractをSchema駆動で固定する必要があり、実装言語と型定義基盤の選定を先送りできない。 |
| Decision | BackendスタックをPython 3.12+とFastAPIに固定する。Schema表現はPydantic v2を正本とし、API Contract（OpenAPI）はFastAPIの自動生成を一次ソースとする。 |
| Rationale | (1) 設計文書はすべて日本語＋型契約優先で書かれており、PydanticのSchema駆動はObject Modelの厳密な転写と相性が良い。(2) Policy Engine、Audit Schema、AI ActionはいずれもValidationが核であり、Pydanticのバリデーションをそのまま責務として使える。(3) AI Gateway層でLiteLLM等のPython ecosystemと直結できる。(4) Sprint 0は明確さと監査可能性を最優先し、Goの性能優位はMVP段階では非クリティカル。 |
| Consequence | (a) すべての新規Service（tenant-identity-service、policy-service、audit-service、object-service、ai-gateway-service、federation-service）はFastAPIで実装する。(b) API Contract DetailはOpenAPI生成物を正本とし、設計文書側は責務契約を担う。(c) パフォーマンスCriticalな経路（例: Audit hash chain、Federation Event高頻度処理）が顕在化した場合、ADR追加の上で部分的にGoまたはRustへ切り出す余地は残す。(d) Frontend（Next.js）とは型同期にOpenAPIまたはJSON Schemaを使用する。 |
| Decided By | CTO (autonomous decision under full delegation, 2026-05-02) |
| Supersedes | なし |

## ADR運用

- Architectureに影響するGapはADRへ昇格する
- ADRはAccepted、Superseded、Deprecatedの状態を持つ
- ADR変更はChange/Approval/Audit対象にする


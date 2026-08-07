# Origin Notes Index

## このフォルダの位置づけ

`docs/_origin/` は、AI統制型 Enterprise Operating Platform の **構想初期に作成された原典ノート群** を保管するアーカイブである。形式化済みの正式設計（`docs/01_Constitution/` 〜 `docs/12_Design_Review_Readiness/`）が完成する前段階で、設計動機・思想・全体像を語った文書をここに集約している。

正式版設計と内容が重複する箇所は多いが、原典ノートは以下の点で価値を持つ：

- なぜその設計に至ったかという **動機の記録**
- 各 Phase の **位置づけと相互依存** の俯瞰
- 当時のコード名「SynapseOS」を含む **歴史的記録**

> 設計仕様の正本（Source of Truth）はあくまで `docs/00_Object_Policy_Kernel/` 〜 `docs/12_Design_Review_Readiness/` 配下である。実装判断・レビュー・ADR の根拠としては正式版を参照すること。本フォルダは **読み物・原典参照用** に限定する。

## 命名規則

- ファイル名先頭の `00_` 〜 `10_` は **原典執筆時の Phase 順** を示す
- ルート直下にあった emoji 付きファイルからリネーム済み
- Phase 番号は当時の構想に基づくため、現在の `docs/00_Object_Policy_Kernel` 〜 `docs/12_Design_Review_Readiness` の番号体系とは **必ずしも一致しない**

## 原典ノートと正式設計の対応表

| # | 原典ノート | 主題 | 対応する正式設計フォルダ / 文書 |
|---:|---|---|---|
| 00 | [`00_VISION_ENTERPRISE_OS.md`](00_VISION_ENTERPRISE_OS.md) | Enterprise OS の存在意義 | [`../README.md`](../README.md), [`../01_Constitution/ENTERPRISE_OS_CHARTER.md`](../01_Constitution/ENTERPRISE_OS_CHARTER.md) |
| 01 | [`01_ARCHITECTURE_PHASES_OVERVIEW.md`](01_ARCHITECTURE_PHASES_OVERVIEW.md) | 全 Phase 俯瞰 | [`../DOCUMENTATION_MAP.md`](../DOCUMENTATION_MAP.md), [`../DESIGN_COMPLETION_GATE.md`](../DESIGN_COMPLETION_GATE.md) |
| 02 | [`02_PHASE1_CONSTITUTION_LAYER.md`](02_PHASE1_CONSTITUTION_LAYER.md) | Constitution Layer | [`../01_Constitution/`](../01_Constitution) |
| 03 | [`03_PHASE2_ENTERPRISE_OBJECT_MODEL.md`](03_PHASE2_ENTERPRISE_OBJECT_MODEL.md) | Enterprise Object Model | [`../00_Object_Policy_Kernel/`](../00_Object_Policy_Kernel) |
| 04 | [`04_PHASE4_GOVERNANCE_AUTHORITY.md`](04_PHASE4_GOVERNANCE_AUTHORITY.md) | Governance & Authority | [`../01_Constitution/GOVERNANCE_MODEL.md`](../01_Constitution/GOVERNANCE_MODEL.md), [`../01_Constitution/AUTHORITY_MODEL.md`](../01_Constitution/AUTHORITY_MODEL.md), [`../00_Object_Policy_Kernel/POLICY_ENGINE_MODEL.md`](../00_Object_Policy_Kernel/POLICY_ENGINE_MODEL.md) |
| 05 | [`05_PHASE5_AUDIT_COMPLIANCE.md`](05_PHASE5_AUDIT_COMPLIANCE.md) | Audit & Compliance | [`../01_Constitution/AUDIT_MODEL.md`](../01_Constitution/AUDIT_MODEL.md), [`../04_AI_Governance/AI_EXPLAINABILITY_MODEL.md`](../04_AI_Governance/AI_EXPLAINABILITY_MODEL.md) |
| 06 | [`06_PHASE6_FEDERATION.md`](06_PHASE6_FEDERATION.md) | Federation Architecture | [`../02_Federation/`](../02_Federation) |
| 07 | [`07_PHASE7_ENTERPRISE_KNOWLEDGE.md`](07_PHASE7_ENTERPRISE_KNOWLEDGE.md) | Enterprise Knowledge | [`../03_Enterprise_Knowledge/`](../03_Enterprise_Knowledge) |
| 08 | [`08_PHASE8_PLATFORM.md`](08_PHASE8_PLATFORM.md) | Platform Architecture | [`../05_Platform/`](../05_Platform), [`../04_AI_Governance/AI_GATEWAY_MODEL.md`](../04_AI_Governance/AI_GATEWAY_MODEL.md) |
| 09 | [`09_PHASE9_UX_UI.md`](09_PHASE9_UX_UI.md) | UX / UI Constitution | [`../06_UX_UI/`](../06_UX_UI) |
| 10 | [`10_PHASE10_MVP.md`](10_PHASE10_MVP.md) | MVP Development | [`../07_MVP/`](../07_MVP), [`../09_Design_Refinement/MVP_ACCEPTANCE_CRITERIA.md`](../09_Design_Refinement/MVP_ACCEPTANCE_CRITERIA.md), [`../12_Design_Review_Readiness/MVP_CODING_START_DECISION.md`](../12_Design_Review_Readiness/MVP_CODING_START_DECISION.md) |

## 旧ファイル名との対応（ルート直下に存在していた原典）

| 旧ファイル名（ルート直下、emoji 付き） | 新ファイル名（本フォルダ内） |
|---|---|
| `🧠 AI統制型 Enterprise Operating Platform.md` | `00_VISION_ENTERPRISE_OS.md` |
| `🧠 SynapseOS Enterprise Architecture Phase.md` | `01_ARCHITECTURE_PHASES_OVERVIEW.md` |
| `🧠 SynapseOS Constitution Layer 詳細設計.md` | `02_PHASE1_CONSTITUTION_LAYER.md` |
| `🧠 SynapseOS Enterprise Object Model（EOM）設計.md` | `03_PHASE2_ENTERPRISE_OBJECT_MODEL.md` |
| `🧠 SynapseOS Governance & Authority Architecture.md` | `04_PHASE4_GOVERNANCE_AUTHORITY.md` |
| `🏛 Phase 5 Audit & Compliance Architecture.md` | `05_PHASE5_AUDIT_COMPLIANCE.md` |
| `🌐 Phase 6 Federation Architecture.md` | `06_PHASE6_FEDERATION.md` |
| `🧠 Phase 7 Enterprise Knowledge Architecture.md` | `07_PHASE7_ENTERPRISE_KNOWLEDGE.md` |
| `🏗 Phase 8 Platform Architecture.md` | `08_PHASE8_PLATFORM.md` |
| `🎨 Phase 9 UX  UI Constitution.md` | `09_PHASE9_UX_UI.md` |
| `🚀 Phase 10 MVP Development.md` | `10_PHASE10_MVP.md` |

## 各原典ノートの先頭にあるバナー

すべての原典ノートには、先頭に下記の構成のバナーが付与されている：

- 原典ノートである旨の明示
- 旧コード名「SynapseOS」が本文中に残存していることの注釈
- 対応する正式設計（`docs/<該当フォルダ>/...`）への相対リンク

本文（バナー以下）は **原典の表現を尊重して原則無加工**で保存している（句読点・章立て・図解を含めて当時のままを保持）。

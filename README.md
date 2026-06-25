# 🏗️ Construction Enterprise Operating Platform

建設会社の **業務ポータル・現場/端末 OS・統制/AI ガバナンス** を統合する上位基盤（coordination layer）です。
個別の業務アプリを吸収せず、**共通ドメイン・統制ゲート・監査証跡** を一元的に提供します。

---

## 📌 概要

| 項目       | 内容                                                                   |
| ---------- | ---------------------------------------------------------------------- |
| 役割       | 統制・ガバナンス・共通ワークフローの調整基盤                           |
| 言語       | TypeScript（strict / `noUncheckedIndexedAccess` / 例外を投げない設計） |
| ランタイム | Node.js v22.6+（ネイティブ TS 実行・ビルトインテストランナー）         |
| 依存方針   | コア実装は **ランタイム依存ゼロ**（検証用に typescript / eslint のみ） |
| パッケージ | pnpm                                                                   |

---

## 🧱 アーキテクチャ

```
src/
├── domain/        … 8 つのコアドメイン（プラットフォームの語彙）
│   ├── organization · user · role · device
│   ├── application · workflow · policy · audit-event
│   └── common      … Result 型・ブランド型・バリデーション基盤
├── governance/    … Governance Core（統制ゲート）
│   ├── policy-engine … アクセス決定（deny-overrides）
│   └── audit-log     … 追記専用・改ざん検知付き監査ログ
├── dashboard/     … ロールベースのリードモデル（アクセス制御付き集計）
│   └── buildDashboard … governance / app health / device / pending approvals
├── adapters/      … 連携ポート（CMDB/ITSM/IMS/LegalOps/BCP/Document）
│   └── in-memory-document-adapter … Document Control 参照実装
└── index.ts       … 公開 API（domain / governance / dashboard / adapters)
```

### 🗂️ プラットフォーム 8 ドメイン

| ドメイン       | 役割                                 | 主な不変条件（型/検証で保証）  |
| -------------- | ------------------------------------ | ------------------------------ |
| `organization` | 本社・支店・現場・協力会社の組織階層 | headquarters は親を持たない    |
| `user`         | 利用者と所属・ロール・状態           | email 形式・状態列挙           |
| `role`         | 権限の束（`resource:action` 形式）   | 最低 1 権限・トークン形式検証  |
| `device`       | 現場端末（タブレット/センサー等）    | retired 端末は利用者に割当不可 |
| `application`  | 連携アプリと健全性（dashboard 用）   | key は kebab-case・health 列挙 |
| `workflow`     | 承認・通知・タスクの定義             | ステップキー重複不可           |
| `policy`       | 統制ルール（RBAC + 属性条件 ABAC）   | effect=allow/deny・対象必須    |
| `audit-event`  | 監査証跡の 1 レコード                | 不可変・outcome 列挙           |

### 🔐 Governance Core

| コンポーネント   | 機能                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `evaluateAccess` | アクセス決定。優先順位 **明示 deny > 明示 allow > RBAC 付与 > 既定 deny**（安全側既定） |
| `AuditLog`       | 追記専用ログ。SHA-256 ハッシュチェーンで改ざんを検知（`verify()` が破断位置を特定）     |

`★ 設計意図`: 「許可リストに無ければ拒否」「証跡は不可変」という建設業統制の監査要件を、
型と暗号学的連鎖でコードに固定しています。

### 📊 ロールベースダッシュボード（read model）

`buildDashboard()` は viewer の権限を Governance Core で評価し、**閲覧可能なリソースだけ**に絞った
集計ビュー（governance status / app health / device status / pending approvals）を返す純粋関数です。

| 特性         | 内容                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| アクセス制御 | `read` 権限の無いリソースは除外。`hidden` に除外件数を明示（黙殺しない） |
| 決定論       | `generatedAt` を引数化した純粋関数（副作用なし・テスト容易）             |
| 再利用性     | UI / API / CLI のどの表層からも同一ロジックを使用可                      |

### 🔌 連携ポート（adapters）

業務システムは **port interface** 経由で連携し、中核へ吸収しません（ヘキサゴナル）。

| ポート                                              | 対象                           | 状態         |
| --------------------------------------------------- | ------------------------------ | ------------ |
| `DocumentPort`                                      | 規程・手順・監査証跡の文書生成 | 参照実装あり |
| `CmdbPort`                                          | 構成アイテム台帳               | 契約定義済   |
| `ItsmPort` / `ImsPort` / `LegalOpsPort` / `BcpPort` | ITSM / 統合管理 / 法務 / BCP   | 契約定義済   |

---

## 🚀 開発・検証

```bash
pnpm install        # 検証用 devDependencies のみ
pnpm run typecheck  # tsc --noEmit（strict）
pnpm run lint       # eslint（flat config + typescript-eslint）
pnpm run test       # node:test（ビルトインテストランナー）
pnpm run build      # dist へ JS + .d.ts 出力（import 拡張子を自動書換）
pnpm run verify     # typecheck + lint + test 一括
```

### 📊 現在の品質状態

| ゲート    | 状態      | 備考                                       |
| --------- | --------- | ------------------------------------------ |
| typecheck | ✅ pass   | strict・0 error                            |
| lint      | ✅ pass   | 0 warning                                  |
| test      | ✅ 30/30  | domain + governance + dashboard + adapters |
| build     | ✅ pass   | `dist/` に型定義付き出力                   |
| CI        | ⏳ 準備済 | `.github/workflows/ci.yml`（要 remote）    |

---

## 🧩 統合元（legacy 参照）

| 旧プロジェクト                               | 位置付け                                          |
| -------------------------------------------- | ------------------------------------------------- |
| `legacy-projects/Synapse-OS`                 | 統制・Federation・AI Governance・監査ゲートの中核 |
| `legacy-projects/Construction-Enterprise-OS` | 業務ポータル・統合画面の正本候補                  |
| `legacy-projects/Construction-DX-OS`         | 現場端末・標準クライアント・オフライン運用の参照  |

> `legacy-projects` は設計の参照元です。正本化した仕様のみ本基盤へ移植し、移植済み範囲を記録します。

---

## 🗺️ ロードマップ

| フェーズ | 対象                                                                |
| -------- | ------------------------------------------------------------------- |
| ✅ M1    | 8 ドメイン定義 + Governance Core                                    |
| ✅ M2    | ロールベースダッシュボード（governance/app health/device/approval)  |
| 🔄 M3    | アダプタ契約定義済（CMDB/ITSM/IMS/LegalOps/BCP）+ Document 参照実装 |
| ⬜ M4    | 各ポートの本実装・永続化層・API ゲートウェイ・統合テスト            |

---

## ⚖️ 原則

- 業務アプリを直接吸収しない（連携=アダプタ）
- セキュリティ・統制・監査・承認を **後付けにしない**
- 実シークレット・本番資格情報・顧客データを含めない

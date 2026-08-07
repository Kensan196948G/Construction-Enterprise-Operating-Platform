# CEOP 総合評価（v0.6.0 Production Readiness）

日付: 2026-08-06
責任者: CTO（主任エージェント）
対象: `Kensan196948G/Construction-Enterprise-Operating-Platform`

## 1. 現状サマリ

| 項目 | 状態 |
|---|---|
| 実装本体 | `feat/platform-foundation`（M1〜M16）→ 本作業ブランチ `feat/production-hardening` で v0.6.0 化 |
| main | v0.6.2 統合済み（PR #2〜#9）・タグ v0.6.2・GHCR イメージ・GitHub Release 作成済み |
| テスト | 263/263 pass（ローカル + GitHub Actions 検証済み） |
| typecheck / lint / build | 全パス |
| 依存監査 | `pnpm audit --audit-level=high` → 0 vulnerabilities（override で解消） |
| CI | グリーン（main: typecheck/lint/test/build/security/Docker 全成功） |
| セキュリティ | 単一パスレビュー実施（`reports/security/report.md`）。P0/P1 の修正済み項目は本リリースに含む |
| ライセンス | なし → `LICENSE.md`（Proprietary / UNLICENSED）を追加、OpenAPI の MIT 表記を修正 |
| 本番 | https://ceop.mirai-dx-platform.com 稼働中（`docker run` + Cloudflare Tunnel、v0.6.2。2026-08-07 デプロイ・スモーク検証済み） |

## 2. 強み

- ランタイム依存ゼロの TypeScript（node:http / node:sqlite / node:test）で監査可能な構成
- 認証（HMAC API key + HS256 JWT）、レート制限、CSP、1 MiB ボディ制限、改ざん検知監査ログ、ABAC/RBAC ポリシーエンジンを標準装備
- マイグレーションランナー（冪等・トランザクション・FK 検査）と API キープロビジョニング CLI
- Docker multi-stage / non-root / HEALTHCHECK / 本番 Compose 定義（bind mount、ログローテーション、read_only・cap_drop・リソース制限。ただし実機は `docker run` 起動のため未適用 — G-19）
- OpenAPI 3.1 生成スクリプトと CI（typecheck / lint / test / build / security audit / Docker）

## 3. 弱み・ギャップ（優先度順）

| ID | 優先度 | 内容 | 状態 |
|---|---|---|---|
| G-01 | P1 | CRUD・認証イベントが監査ログ未記録（監査基盤として致命的） | ✅ v0.6.0 で全 mutation を監査記録化 |
| G-02 | P1 | 本番マイグレーションに FK 制約・workflows/revoked_jtis が未収録（スキーマ漂流） | ✅ migration 004 + テスト |
| G-03 | P1 | `pnpm audit` が high 7 件（devDependencies） | ✅ override + lockfile 更新で 0 件 |
| G-04 | P1 | main が空・PR #1 未統合（本番リリース不可） | ✅ PR #2 で統合、main CI（Docker 含む）グリーン |
| G-04b | P1 | 組織スコープ未強制（テナント横断アクセス） | ✅ テナント分離を実装（entity + dashboard フィルタ、404 非公開化） |
| G-04c | P1 | `user:write`/`role:write` による権限昇格 | ✅ anti-escalation チェックを実装 |
| G-05 | P2 | バージョン表記の分散（package.json 0.1.0 / info 0.5.0 / UI 0.1.0） | ✅ 一元化 + 回帰テスト |
| G-06 | P2 | JWT 失効 API なし | ✅ `/api/v1/auth/revoke` 実装 |
| G-07 | P2 | JWT が `iat >= exp` を受容 | ✅ 拒否に変更 |
| G-08 | P2 | API JSON 応答にセキュリティヘッダなし | ✅ 全応答に付与 |
| G-09 | P2 | グローバルレート制限なし（auth のみ） | ✅ `/api/v1/*` に per-IP 制限 |
| G-10 | P2 | readiness プローブなし（health は liveness のみ） | ✅ `/health/ready` |
| G-11 | P2 | 監査ログ取得に offset なし | ✅ `offset` 追加 |
| G-12 | P2 | バックアップ/復元・監視・運用台帳・Runbook 未整備 | ✅ docs/operations + backup script |
| G-13 | P2 | ブランチ保護・Actions 権限絞り込み・CI 必須チェック未設定 | ✅ main ブランチ保護（必須チェック 3 件・force push/delete 禁止）+ Actions 権限 selected |
| G-14 | P3 | CSP が `unsafe-inline`（SSR テンプレートのインライン JS） | バックログ（nonce/hash 化） |
| G-15 | P3 | リクエスト ID・相関 ID なし | バックログ |
| G-16 | P3 | `node:sqlite` は実験的 API（Node 22） | 運用方針として許容・文書化 |
| G-17 | P3 | 本番 TLS 終端の設定例（nginx）がプラットフォーム側にない | バックログ（プロキシ側で実施） |
| G-18 | P1 | 監査ログにテナント境界がなく、組織スコープ資格情報 + `audit:read` で他テナントの actor/resource/metadata が閲覧可能。dashboard の監査カウンタも全テナント合算 | ✅ 解消（2026-08-07）。`AUDIT_ORG_KEY` を metadata に付与し、監査一覧と dashboard カウンタを自組織へ絞込み。回帰テスト 5 件（mutation 検証済み） |
| G-19 | P1 | `docker-compose.prod.yml` が実運用（`docker run` 起動）と乖離。named volume・`latest` タグ・`container_name: ceop-platform-prod`・`0.0.0.0` 公開のため、Runbook どおりに `docker compose stop` しても実機は止まらず（no-op）、`up -d` すると空 DB の 2 台目が LAN 公開で起動する | ✅ 解消（2026-08-07）。compose を実トポロジ（bind mount・`container_name: ceop-platform`・loopback bind・`CEOP_IMAGE` 必須）へ整合。実機が compose 管理外である事実と既知の差分を RUNBOOK §6 に明記 |
| G-20 | P1 | GitHub Release のノート抽出が v0.6.0 以降一度も機能せず、全リリースが fallback 文字列のみ（タグ `vX.Y.Z` と CHANGELOG 見出し `## [X.Y.Z]` の不一致） | ✅ 解消（v0.6.2）。プレフィックス除去 + `index()` 一致 + 空検出時のビルド失敗。v0.6.2 Release 本文で実地確認済み |
| G-21 | P2 | バックアップ cron がバージョン固定タグ（`ceop-platform:v0.6.1`）を参照。旧イメージ prune で静かに失敗する | ✅ 解消（2026-08-07）。可動エイリアス `ceop-platform:current` へ変更し、cron コマンドを実行して検証 |
| G-22 | P2 | 本番応答に HSTS（`strict-transport-security`）が無い。Cloudflare エッジ側の設定 | バックログ（Cloudflare ダッシュボードでの設定。§17 Approval PR 対象） |
| G-23 | P2 | 本番 `docker run` に `read_only` / `cap_drop` / `no-new-privileges` / リソース制限 / ログローテーションが未適用 | 受容中（compose 切替まで）。差分は RUNBOOK §6「既知の差分」に列挙。ハードニング構成は v0.6.2 イメージで実機起動検証済み |
| G-24 | P3 | バックアップの世代自動削除が未実装・オフサイトコピー無し | 運用台帳で手動管理（BACKUP_RESTORE.md）。ホスト障害時はバックアップも同時消失 |
| G-25 | P3 | 全トラフィックが Tunnel 経由で loopback から届くため、per-IP レート制限が実質単一バケット | バックログ（`CF-Connecting-IP` を信頼境界付きで採用する設計が必要） |
| G-26 | P2 | 監査証跡を監査人へ引き渡す手段が無く、ハッシュ連鎖のオフライン再検証ができなかった（legacy-gap-analysis L-01） | ✅ 解消（2026-08-07）。`GET /api/v1/governance/audit/export` を追加。`audit:export` 権限分離・拒否の監査記録・スナップショット順序・チェーン列同梱・CSV 数式インジェクション対策を 20 テスト（変異検証済み）で固定 |
| G-27 | P2 | `Router.#match` が HTTP メソッドを厳密一致で照合するため、HEAD が `/health` を含む**全ルートで 404**。多くの死活監視・ロードバランサは既定で HEAD をプローブに使うため、正常稼働中のサービスが停止と誤判定されうる（GET 200 / HEAD 404 を実測） | ✅ 解消（2026-08-07）。`#match` に HEAD→GET フォールバックを追加。`node:http` が HEAD 応答のボディのみ抑制しヘッダを維持するため全ハンドラ無改修。認可は GET ルートの `requiresAuth` を継承。6 テスト（変異 3 種検証済み）。ルータ層に初のテストを設置 |
| G-28 | P2 | 監視ドキュメントと実態の乖離。MONITORING.md は「本番の一意特定が可能になった時点でアラートルールをデプロイ」と記載するが本番は既に一意特定済み。「30 秒間隔・3 回失敗でアラート」は Docker HEALTHCHECK の検知条件としては正しいが**誰にも通知されない**（`unless-stopped` はコンテナ終了時のみ再起動し、unhealthy では何も起きない）。外形監視は 1 日 1 回の `curl` で**失敗時のみ**ログ追記のため、`health.log` が存在しないことが「無障害」か「cron 未実行」か判別不能だった。OPERATIONS_LEDGER は存在しない「アラートダッシュボード」を参照 | ✅ 解消（2026-08-07）。`scripts/health-probe.sh`（連続失敗カウンタを永続化し WARN/ALERT/RECOVERED を出し分け、成功も記録、状態破損時は 0 から再開）を追加し 5 テストで固定。MONITORING.md を「実装済み」「未実装（目標設計）」「通知経路が無い間の手順」の 3 章へ再構成。OPERATIONS_LEDGER の日次項目を実行可能なコマンドと判定基準へ置換し、自動化されていない理由（通知先未決定）を明記 |

## 4. リリース可否判断の根拠

- コード品質: typecheck / lint / build / 263 tests / audit 0 / OpenAPI 生成一致
- セキュリティ: 認証・認可・監査・レート制限・ヘッダ・FK・依存監査を確認
- 運用: バックアップ・復元手順・監視・Runbook・運用台帳を整備
- 判定: **GO（v0.6.2 を本番デプロイ済み・2026-08-07）**。公開 URL 経由で `/health`・`/health/ready`（storage: sqlite）・`/api/v1/info`（version 0.6.2）と、認証込みスモーク（トークン交換 → 主要 9 API 200 → SSR 2 画面 200）・ネガティブ制御（無効資格情報 / 資格情報なし → 401）を確認
- 残作業: 四半期の復元試験、**アラート通知経路の決定と実装**（G-28 で検知は実装したが伝達先が未決定）、G-22（HSTS）・G-23（compose 切替 / ログローテーション）・G-24（保持世代・オフサイト）・G-25（レート制限バケット）

## 5. バックログ（実装対象外）

- P3: CSP nonce/hash 化、リクエスト ID、nginx TLS サンプル、SSO（OIDC/SAML）、通知/承認ワークフローの実業務連携、AI ガバナンスの LLM ゲートウェイ接続
- P2（次期）: 監査ログのエクスポート（CSV/PDF）、API キー失効 UI、ポリシー変更の承認フロー

## 6. 決定記録

- 監査イベントのテナント識別子は `AuditEvent` のトップレベル項目ではなく `metadata` に置く。
  `canonicalize()` は明示列挙フィールド + metadata 全体をハッシュ対象とするため、metadata なら
  改竄検知の内側に入る。トップレベル化はハッシュ定義の変更を伴い、既存エントリを全て検証不能にする
- テナント属性を持たない既存監査エントリは、組織スコープ資格情報から不可視とする（fail-closed）。
  グローバル資格情報の全体可視性は、プラットフォーム全体の完全性検証のため維持する
- `Workflow` / `Policy` に `organizationId` が無いのは設計境界であり欠落ではない。前者はテナント横断の
  定義（テンプレート）、後者はプラットフォーム全体の認可規則。テナントに紐づく承認インスタンスは
  legacy-gap-analysis の L-02 として未実装
- 本番向け永続化は SQLite（単一ノード）を正とする。マルチノードは将来 PostgreSQL アダプタをバックログ化
- バージョンは v0.6.0 に統一（M1〜M16 の成果を含む最初の main リリース）
- 本番の起動方式は当面 `docker run` を正とする。compose への切替は停止を伴うため別 PR で計画・承認を得る。
  それまで `docker-compose.prod.yml` は「切替時の差分ゼロを保証する定義」として維持し、実機との差分を
  RUNBOOK §6 に明示して受容リスクとして管理する
- イメージタグは不変タグ `ceop-platform:vX.Y.Z`（rollback・監査の基準、prune しない）と可動エイリアス
  `ceop-platform:current`（cron などの自動処理が参照）の 2 本立てとする。自動処理にバージョン固定タグを
  直接書くと、リリースのたびに更新漏れで静かに失敗する（G-21 の実際の発生形態）
- OpenAPI ライセンスは MIT → Proprietary に修正（private リポジトリの実態に整合）
- 監査証跡の一括出力は `audit:read` ではなく新権限 `audit:export` を要求する。ページ単位の閲覧と
  全件の持ち出しは能力として別物であり、後者だけを個別に付与・剥奪できる必要がある。
  ただし `hasPermission` の wildcard 設計により `audit:*` 保持者は自動的に両方を満たす。
  これは既存 wildcard ロールの意味を変えない選択であり、「新権限は既定で誰も持たない」とは言えない
  事実として README / OpenAPI に明記した
- 一括出力は**拒否された場合も監査記録する**（ページ読み取り API は成功時のみ）。拒否された持ち出しの
  試行そのものが証跡価値を持つため。応答書き込みの前に記録し、クライアント切断で記録が消えないようにする
- 出力範囲は出力イベントの記録より**前**にスナップショットする。自分自身の出力イベントを payload に
  含めると、範囲確定時点で存在しなかったエントリを「その出力に含まれていた」と主張することになる
- CSV は RFC 4180 引用符処理と数式インジェクション中和を**両方**適用する。前者はファイルの解析可能性、
  後者は表計算ソフトでの実行可否という別の問題を解く。引用符だけでは生きた数式が残り、接頭辞だけでは
  カンマを含む値でレコードが壊れる。中和は値の除去ではなく先頭アポストロフィの付与とする
  （証拠を黙って書き換えないため。マーカーは表示時に消費される）

# CEOP 統合マスタープラン — 5 リポジトリ全機能統合

日付: 2026-08-07
責任者: CTO（主任エージェント）
対象: Construction-Enterprise-Operating-Platform（CEOP）を単一プラットフォームとする

## 1. 目的と完了条件

以下の 5 リポジトリの全機能を CEOP へ統合し、旧リポジトリを削除する。
削除タイミングは統合完了後にユーザーへ Y/N を提示し、Y の承認を得た場合のみ実施する。

1. ServiceHub-Construction-Platform
2. Construction-Enterprise-OS
3. Construction-DX-OnePlatform
4. Construction-DX-OS
5. Synapse-OS

### 完了条件（全機能移行の定義）

- 各リポジトリの機能インベントリ（`FEATURE_INVENTORY.md`）の全項目が
  「統合済み（CEOP 実装または CEOP 配下の統合サービスとして稼働）」になる
- CEOP の認証・認可・監査・テナント境界が全統合機能に適用される
- 統合機能の API・UI・テスト・運用文書が CEOP に存在し、CI がグリーン
- 旧リポジトリの実データ・履歴・運用が CEOP 側へ移行・引き継ぎ済み
- ユーザーが Y/N 判断を行い、Y の場合のみ GitHub 上で旧リポジトリを削除

## 2. 統合元の現状サマリ

| リポジトリ                  | 規模                   | スタック                                        | 成熟度                    |
| --------------------------- | ---------------------- | ----------------------------------------------- | ------------------------- |
| ServiceHub                  | 14MB・py 183 / tsx 83  | FastAPI + React + Postgres + nginx + Prometheus | 業務実装済み・880+ テスト |
| Construction-Enterprise-OS  | 25MB・py 472 / tsx 122 | Python サービス群 + pnpm + WebUI                | モック・設計中心          |
| Construction-DX-OnePlatform | 16MB・py 569 / tsx 223 | 部門別モジュール + portal + shared 基盤         | モック・設計中心          |
| Construction-DX-OS          | 6MB・py 227            | FastAPI + cdx-agent + SDK + Postgres            | 端末基盤実装済み          |
| Synapse-OS                  | 2.5MB・py 170          | FastAPI マイクロサービス + Next.js              | 統制実装済み・396 テスト  |

## 3. ターゲットアーキテクチャ

```
Browser / Mobile
      │
      ▼
CEOP Portal (SSR + 統合 WebUI モジュール)
      │
      ▼
CEOP API Gateway (認証・認可・監査・レート制限・テナント境界)
      ├── CEOP Core (TypeScript domain/governance/audit/persistence)
      ├── Integration Services（Python/Node コンテナ）
      │     ├── ServiceHub 業務サービス
      │     ├── Enterprise-OS / OnePlatform モジュール
      │     ├── DX-OS 端末基盤
      │     └── Synapse Governance / AI Gateway
      └── Adapter Ports（CMDB/ITSM/IMS/LegalOps/BCP/Document 等）
```

方針:

- CEOP のコア（認証・認可・監査・ドメイン）は TypeScript 実装を維持
- 既存の Python サービスは**統合サービス**として CEOP 配下で稼働させ、
  CEOP Gateway が JWT 検証・権限ゲート・監査記録を一元的に適用
- ガバナンス価値の高い機能（承認ワークフロー・AI 利用統制・端末管理・監査）は
  CEOP コアへ優先移植
- 業務機能（工事・日報・写真・原価・契約など）は、まず統合サービスとして
  接続し、その後 CEOP ドメインへ段階的に移植

## 4. フェーズ計画

| フェーズ              | 内容                                                                                                                     | 受入条件                                                         | 状態            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | --------------- |
| P0 ソース統合         | 5 リポジトリを `integrations/` へ取り込み、機能インベントリ・統合計画・NOTICE を作成                                     | 全ソースが CEOP に存在・CI グリーン・秘密情報なし                | ✅ 本計画で実施 |
| P1 ゲートウェイ       | CEOP に統合サービス向けリバースプロキシ/アダプタ基盤と統一 JWT 認証を追加                                                | 統合サービスのエンドポイントが CEOP 認証・監査を通して呼び出せる | 🔨 実装済み（PR #24 マージで ✅） |
| P2 ガバナンス移植     | ワークフローインスタンス（Issue→Approval→Audit）・AI ゲートウェイ統制・端末エージェント受信を CEOP コアへ移植            | L-02/L-05/L-07 の API+テスト+監査が CEOP に存在                  | ✅ 実装済み（PR #26） |
| P3 業務モジュール移植 | ServiceHub の案件・日報・写真・安全・原価・契約・ITSM と Enterprise-OS/OnePlatform の業務領域を CEOP ドメインへ移植      | 各機能の CRUD+監査+UI+テスト                                     | 🔨 進行中（S-01 案件 / S-02 日報 実装済み・PR #30） |
| P4 ポータル・監視統合 | OnePlatform/Enterprise-OS の WebUI を CEOP Portal のモジュールとして統合し、監視（Prometheus/Grafana）を CEOP 運用へ接続 | 全画面が CEOP 配下で閲覧可能                                     | 未着手          |
| P5 検証・切替         | 全機能のパリティ検証・本番切替・旧データ移行・運用引継ぎ                                                                 | FEATURE_INVENTORY 全項目が統合済み                               | 未着手          |
| P6 削除判断           | ユーザーに Y/N を提示し、Y の場合のみ旧 5 リポジトリを GitHub から削除                                                   | ユーザー承認・削除後の参照は integrations/ と Git 履歴で可能     | 未着手          |

## 5. 優先順位と判断

- まず P1（ゲートウェイ）と P2（ガバナンス移植）を進め、プラットフォーム価値を高める
- P3 は業務機能の量が大きいため、ServiceHub（業務実装済み）→ Enterprise-OS →
  OnePlatform の順で垂直スライス（API+DB+認可+監査+UI+テスト）を単位とする
- P4 の WebUI 統合は、既存のデザインバンドル配信（WebUI 静的ホスト）を拡張して対応

## 6. リスクと決定事項

- **ライセンス**: DX-OS は MIT、OnePlatform は LICENSE あり、他は未確認。
  `docs/integration/NOTICE.md` に出所を記録し、権利確認までは本番利用しない
- **技術差異**: CEOP は TypeScript ゼロ依存、統合元は Python/Node。全機能の
  完全移植は工数大のため、統合サービス方式とコア移植を併用
- **削除前の安全策**: 旧リポジトリは削除前に GitHub アーカイブ（Archive）と
  ローカル/`integrations/` のスナップショットで保全し、Y/N 確認を実施
- **監査・テナント**: 全統合機能へ CEOP のテナント境界・監査ログを適用することを
  全フェーズの必須ゲートとする

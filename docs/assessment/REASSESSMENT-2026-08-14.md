# CEOP 再評価・MVP/Prototype 完成報告（2026-08-14）

- 責任者: CTO（主任エージェント）
- 対象: `Kensan196948G/Construction-Enterprise-Operating-Platform`
- 作業ブランチ: `feat/mvp-operable-demo-v0.13.0`（origin/main v0.12.1 から分岐）
- 方針: ユーザー指示（操作・評価できる MVP/Prototype を自律完成）＋ AGENTS.md / .claude/CLAUDE.md

## 1. 判定

**MVP/Prototype: GO**

主要ユースケース（案件・日報承認・ISO 統合管理・契約/発注・安全/品質・原価/工数・通知・
承認ワークフロー・連携イベント・監査証跡・RBAC）が、有効な架空デモデータとともに
実画面・実 API で動作することを実測で確認した。本番運用化は対象外として本番 DB・
本番デプロイ・実データへは一切触れていない。

## 2. 実測エビデンス

| 項目                                                                 | 結果                                                                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm run verify`（format/openapi/typecheck/lint/test/build/parity） | ✅ 全通過・**553/553 tests**・parity 27/27                                                                                                       |
| `pnpm run build`                                                     | ✅ dist 出力                                                                                                                                     |
| `pnpm audit --audit-level=high`                                      | ✅ 0（既存 override 維持）                                                                                                                       |
| デモサーバ実測（In-Memory・44778）                                   | `/health` 200・`/api/v1/info` 0.13.0・認証なし 401・主要 18 API にデータ                                                                         |
| SQLite 永続デモ                                                      | `scripts/seed-demo.ts` で migration 026 まで適用 + 全デモデータ投入。再実行拒否（データ保護）・`--force` で冪等再投入を確認                      |
| 監査チェーン                                                         | 10 件シード・`verify().valid=true`・CSV エクスポート 200                                                                                         |
| E2E（Playwright 12 テスト）                                          | ✅ 12/12 通過（ローカルは Firefox 設定で実行。開発機の Chromium バイナリが SIGTRAP で起動しない環境問題のため。CI は Chromium で従来どおり実行） |
| ブランチ保護                                                         | main 必須 CI 3 件（Typecheck/Lint/Test・Build・Security Audit）。レビュー必須なし                                                                |

## 3. 今回の実装内容

| #   | 内容                                                                                                                                                                                                                                                      | 種別             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | `src/persistence/rich-demo.ts`: 全業務ドメインの架空デモデータ一式（5 組織/8 ロール/12 ユーザー/5 案件/6 日報/32 ISO/6 契約+証跡 5/6 発注/安全 3/品質 4/原価 5/工数 6/工程 5/写真 5/図面 6/ナレッジ 6/AI 統制 4/通知 10/ワークフロー 3+4/連携 6/監査 10） | 機能（MVP 中核） |
| 2   | `CEOP_SEED_RICH_DEMO` 起動フラグ（production 拒否）＋ `pnpm run start:demo`                                                                                                                                                                               | 機能             |
| 3   | `scripts/seed-demo.ts`: SQLite 永続シード CLI（migration 自動適用・既存業務データ保護・冪等）                                                                                                                                                             | 機能             |
| 4   | PWA アイコン配信修正（`favicon-{16,32,48,192,512}.png`・ルート `/favicon.ico` の 404 解消）                                                                                                                                                               | バグ修正         |
| 5   | `scripts/start.ts` の NODE_ENV 表示と実体の乖離修正（未設定時 `development` を明示）                                                                                                                                                                      | バグ修正         |
| 6   | `package.json` に `start`/`start:demo`/`seed:demo` 追加（README の `pnpm start` を実在化）                                                                                                                                                                | 文書整合         |
| 7   | テスト追加: rich-demo 整合性/冪等性/監査チェーン 3・アプリ統合 2・PWA アイコン 1、E2E `mvp-demo.spec.ts` 4                                                                                                                                                | 品質             |
| 8   | 文書: `docs/operations/MVP_DEMO_GUIDE.md`・CHANGELOG [0.13.0]・README（553 tests/E2E 12/デモ手順/環境変数）・state.json                                                                                                                                   | 文書             |
| 9   | バージョン 0.13.0 統一（version.ts/package.json/Dockerfile/OpenAPI・version.test で固定）                                                                                                                                                                 | リリース         |

## 4. ギャップ・優先度（P0〜P3）

### P0（未解決なし・本セッション対象外の運用 P0 は外部要因）

| ID    | 内容                                                                          | 状態                         | 解除条件                                         |
| ----- | ----------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| OP-01 | 本番コンテナ ハーデニング回帰（read-only/cap-drop 等が実機未適用・8/11 実測） | 本番運用のため対象外         | 検証デプロイ＋docker inspect。人間による本番操作 |
| OP-02 | アラート通知先（CEOP_ALERT_WEBHOOK_URL）未設定                                | シークレット・外部承認が必要 | 通知先 URL の決定・設定                          |

### P1

| ID     | 内容                               | 状態                                                                                                                                                                                                                                                                                    |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DQ-01  | 自然キーの DB 一意制約             | ✅ 実質解消済み（migration 001/008/017/020/021/024/026 で projectCode/orderNumber/contractNumber/templateKey/user 等に UNIQUE 済み）。残るのは JSON payload 内 planNo と日報の自然キーのみ → 本番既存データとの衝突リスクを避け、**受容リスクとして明記**（migration 追加はしない判断） |
| UX-01  | モバイル/オフライン PWA（SW なし） | バックログ（Phase 1）                                                                                                                                                                                                                                                                   |
| RPT-01 | PDF 帳票                           | バックログ（CSV は実装済み）                                                                                                                                                                                                                                                            |
| NTF-01 | SMTP/Slack 実送信の運用接続        | バックログ（コードは実装済み・接続設定のみ）                                                                                                                                                                                                                                            |
| DB-01  | 本番 DB の Neon PostgreSQL 移行    | 設計済み（NEON_MIGRATION_PLAN）・バックログ                                                                                                                                                                                                                                             |

### P2（今回対応済み・主要）

- PWA アイコン 404（修正）
- `pnpm start` 未定義（スクリプト追加）
- start.ts の NODE_ENV 表示不整合（修正）
- デモデータ不足で主要画面が空（リッチデモデータ投入で解消）

### P3 / 将来バックログ（抜粋）

発注/受発注の本格化・労務勤怠・経理請求・GIS マップ・全文検索 FTS5・AI RAG/OCR/予測・
電子納品/CDE・協力会社ポータル・SSO（OIDC/Entra ID）・監査レポート PDF・ログ集約
（OpenTelemetry）・負荷試験。詳細は `docs/assessment/IMPROVEMENT_PLAN-2026-08-11.md` の
ロードマップを正とする。

## 5. 残課題・再開ポイント

1. ~~MVP 用公開 URL の Tunnel/DNS 作成~~ → ✅ 完了: `https://ceop-mvp.mirai-dx-platform.com`
   （専用 Tunnel `ceop-mvp`・`deploy/cloudflared/ceop-mvp-config.yml`・実測 200）
2. PR レビュー・CI グリーン後に main への merge（Auto-merge 手順）
3. 本番への適用は「人間の判断」対象（本セッションは実施しない）
4. ローカル main の未 push コミット `d9807f8`（セキュリティ修正）は既存ユーザー作業として温存。
   upstream v0.12.x との統合判断は別途必要（本ブランチには取り込んでいない）

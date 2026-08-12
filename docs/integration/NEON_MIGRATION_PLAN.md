# Neon PostgreSQL 移行設計書（v0.12.0 時点の設計）

## 1. 現状と方針の乖離

- DB 正本: 基本方針は Neon PostgreSQL、現状は SQLite WAL 単一ファイル
- 運用: 基本方針はマネージド・水平展開可能、現状は単一ノード・ホスト依存
- バックアップ: 基本方針は Neon の PITR 等、現状は VACUUM INTO + R2（設計中）

SQLite は現行規模（業務データ 0 件・API 170+）では十分な性能と運用性を持ち、
**即時の移行は不要**。ただし、以下の条件が揃った時点で移行を検討する。

## 2. 移行判断基準（いつ移行するか）

- 同時利用者 50 名超（本番実データ投入後 3 か月以内の想定）
- 複数インスタンス（API 水平展開）または DR サイトの要求
- 監査ログ 100 万件超（SQLite 単一ファイルの肥大・バックアップ時間増大）
- チームが PostgreSQL 運用（Neon 含む）に習熟し、SQLite 特有の知識に依存しない体制

## 3. 移行方式（推奨: 並行稼働 → スイッチ）

```text
Phase A 準備      Phase B 並行      Phase C 切替          Phase D 安定化
スキーマ移植     二重書き込み      読み書きを Neon へ    旧 SQLite を退避・廃止
マイグレーション 差分検証         ロールバック手順      監査・バックアップ移行
データ複製       parity 確認       Tunnel 経路は不変
```

### Phase A: スキーマ移植（2〜4 週間）

1. `scripts/migrate.ts` の SQL を PostgreSQL 方言へ変換（`TEXT PRIMARY KEY`・
   `JSON` 列・`UNIQUE INDEX`・WAL なし）
2. ドメイン層は変更不要（リポジトリ実装のみ `postgres/` を追加）
3. `src/persistence/ports.ts` は不変（ポート&アダプタ設計を維持）
4. マイグレーション適用は単一の `scripts/migrate-pg.ts` に集約（SQLite と同一の
   冪等性・台帳方式）

### Phase B: 並行稼働（2〜4 週間）

- 書き込みは SQLite を正として、Neon へ同期的に複製（`recordAudit()` を含む
  全 mutation のラッパーに二重書込を追加）
- 読み取りは既定 SQLite のまま、Neon の読み取りを検証ジョブ（parity）で比較
- 差分検証: `scripts/verify-parity.ts` を拡張し、両 DB の件数・ハッシュを照合

### Phase C: 切替（1 日）

- 環境変数 `CEOP_DB_DRIVER=postgres` で切り替え（SQLite と排他）
- 切替前に最終スナップショットを取得し、Neon へ反映
- ロールバック条件: 読み書きエラー率 1% 超・監査チェーン検証失敗・
  レイテンシ p95 500ms 超 → 環境変数で SQLite へ即時復帰

### Phase D: 安定化（2 週間）

- 監査チェーン検証・バックアップ・R2 オフサイトを Neon 運用へ移行
- 旧 SQLite ファイルは 90 日保持後、`scripts/verify-restore.ts` の最終検証を
  通してから削除

## 4. スキーマ変換の注意点

- `data TEXT` + JSON パース → `data JSONB`（書き込み `JSON.stringify`、読み `JSON.parse`）
- `id TEXT PRIMARY KEY` → 変更不要（UUID 文字列のまま）
- `audit_log.sequence INTEGER PRIMARY KEY` → `BIGSERIAL` 相当（ハッシュチェーンの
  採番順を厳守）
- `PRAGMA journal_mode = WAL` → 不要（Neon が管理。PgBouncer 接続プールを利用）
- `PRAGMA foreign_keys = ON` → PostgreSQL は既定で有効（移行時に FK 違反チェック）
- `revoked_jtis.prunable_at INTEGER` → `BIGINT`（epoch 秒を保持）

## 5. リスクと緩和

- **JSON 列の型違いによる既存データの解釈ズレ（高）**: 移行時に全行を
  verify-restore 相当の検証（監査チェーン・番号重複含む）で確認
- **二重書き込み時の監査チェーン分岐（高）**: `recordAudit()` は単一ソース
  （SQLite）で発番し、Neon は同一チェーンを複製
- **接続数・レイテンシ悪化（中）**: PgBouncer・prepared statement・ローカルで
  p95 計測
- **移行コスト（工数 10〜20 人日・中）**: 判断基準を満たすまで SQLite を維持

## 6. 移行しない間の代替施策（今すぐ実施可能）

- オフサイトバックアップ（R2）→ `docs/operations/OFFSITE_BACKUP.md`
- 監査チェーン検証の日次自動化 → v0.12.0 で導入済み
- バックアップ保持 14 日 → 90 日に延長（`scripts/backup-retention.ts` の引数）

## 7. 結論

**現時点では SQLite 運用を継続し、移行判断基準（同時 50 名・実データ投入・
監査 100 万件）に達した時点で本設計書の Phase A を開始する。**
Neon の `ceop-production` データベースは WebUI アクセスログ用途として維持し、
業務 DB の移行時には `itsm` 等の旧スキーマを整理する。

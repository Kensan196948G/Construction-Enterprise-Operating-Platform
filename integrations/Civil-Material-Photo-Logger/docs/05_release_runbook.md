# 📦 リリース Runbook（TestFlight / App Store）

本書は MaterialPhotoLogger のリリース手順・バージョニング・rollback の正本である。
本アプリは **iOS ネイティブ・完全オフライン**（サーバー・DB・Web 基盤なし）であり、
配布経路は TestFlight / App Store Connect のみ。**Apple ID 操作を伴う手順は人間が実行する**。

関連文書: `04_audit_and_backlog.md`（監査・残課題）/ `06_operations_ledger.md`（運用台帳）

---

## 📌 1. バージョニング方針

| 項目 | 方針 |
|---|---|
| `MARKETING_VERSION` | セマンティックバージョニング `MAJOR.MINOR.PATCH`。利用者に見える機能追加で MINOR、修正のみで PATCH |
| `CURRENT_PROJECT_VERSION`（ビルド番号） | 同一バージョン内で単調増加の整数。TestFlight へ上げるたびに +1 |
| 管理場所 | `app/project.yml` の `settings.base` へ明示する（XcodeGen が正本。Xcode 上で直接変更しない） |
| Git tag | App Store 提出時のみ `v<MARKETING_VERSION>` を **提出した commit** に付与 |
| CHANGELOG | tag 付与と同じ commit で `CHANGELOG.md` へ利用者向け変更点を追記 |

> ✅ 2026-08-07 の PR #97 で `project.yml` に `MARKETING_VERSION: "1.0.0"` /
> `CURRENT_PROJECT_VERSION: 1` を明示済み。以降は本ファイル §1 の方針に従い、
> Xcode 上で直接変更せず `project.yml` を正本として更新する。

---

## ✅ 2. リリース前チェックリスト（Gate）

すべて満たすまで TestFlight へ上げない。

| # | 項目 | 実施者 | 根拠・方法 |
|---|---|---|---|
| 1 | main の HEAD が検証済み commit と一致 | Claude / 人間 | `git log origin/main -1` と PR の head SHA 照合 |
| 2 | CI 全 success（Swift Test / iOS Simulator Build） | CI | GitHub Actions |
| 3 | Core テスト全件 PASS（ローカル `swift:6.1` でも再確認可） | Claude | `docker run … swift test` |
| 4 | **実機またはシミュレータでの視覚確認**（新規・変更画面） | **人間** | ライト固定・バナー・Dynamic Type・回転 |
| 5 | 秘密情報・不要ファイルの混入なし | Claude | 差分スキャン（パターン一致 0 件） |
| 6 | プライバシーポリシー URL が有効（App Store 提出時） | **人間** | `07_privacy_policy_draft.md` の承認・公開後 |
| 7 | `MARKETING_VERSION` / ビルド番号を更新済み | 人間 | `project.yml` |
| 8 | CHANGELOG 追記済み | Claude / 人間 | 同一 commit |

---

## 🚀 3. TestFlight 配布手順（ベータ配布・人間が実行）

TestFlight はベータ検証であり、App Store 公開（§3.5）とは別工程である。
tag はここでは付与しない（App Store 提出 commit へ付与する — §1 参照）。

```text
1. git checkout main && git pull        # 提出候補の commit を控えておく
2. cd app && xcodegen generate          # project.yml から .xcodeproj を再生成
3. Xcode で MaterialPhotoLogger.xcodeproj を開く
4. Product > Archive（Release 構成。Manual Signing:
   "MaterialPhotoLogger AppStore New" プロファイルを使用 — project.yml 参照）
5. Organizer > Distribute App > App Store Connect > Upload
6. App Store Connect > TestFlight で処理完了を待つ（輸出コンプライアンスは
   ITSAppUsesNonExemptEncryption=false 設定済みのため追加質問なし）
7. 内部テスターへ配布 → §4 のスモークテストを実施
8. 不具合があれば通常の PR フローで修正し、ビルド番号を +1 して手順 1 からやり直す
```

## 🏪 3.5 App Store 提出・公開手順（人間が実行）

```text
1. TestFlight 検証（§4）を全項目 PASS したビルドと、その元 commit を固定する
2. App Store Connect で対象バージョンを作成し、検証済みビルドを選択する
3. スクリーンショット・説明文・プライバシーポリシー URL（§2 ゲート 6）を設定する
4. App Review へ提出する
5. 承認後に公開する（段階的リリースの要否はこの時点で選択）
6. 提出した commit へ git tag v<version> を付与して push し、同 commit の
   CHANGELOG.md 追記を確認する
```

## 🧪 4. 配布後スモークテスト（人間・実機）

| 確認 | 期待 |
|---|---|
| 起動 → ホーム表示 | 警告バナーが出ない（正常系） |
| 記録作成（写真撮影・位置取得・保存） | 保存後に一覧へ反映 |
| アプリ再起動 | 記録が残っている（永続化確認） |
| CSV 出力・共有 | ファイルが生成され共有シートが開く |
| バックアップ作成 → 復元 | 記録と写真が一致 |
| 位置情報権限を拒否した状態で記録 | エラーではなく案内が表示される |

## ↩️ 5. Rollback

サーバー・DB がないため、rollback は**配布の取り下げ／差し戻し**のみで完結する。

| 状況 | 手順 |
|---|---|
| TestFlight 配布後に重大不具合 | App Store Connect でそのビルドの配布を停止し、直前の正常ビルドを再有効化 |
| App Store 公開後に重大不具合 | 「このバージョンを販売停止」→ 修正版を Expedited Review で申請（Apple は旧版への自動差し戻し不可） |
| コード面 | `git revert <merge commit>` → 通常の PR フローで main へ戻す。データ形式は前方後方互換を維持しているため、旧版へ戻しても保存済み記録は読める |

> ⚠️ 保存フォーマットを変更する場合は、**旧版が新フォーマットを読めなくなる変更を
> 単独リリースに含めない**（1 リリース挟んで expand-and-contract）。

## 🔐 6. 証明書・プロファイル

| 資産 | 場所 | 更新 |
|---|---|---|
| Apple Distribution 証明書 | 人間の Keychain / Developer Portal | 失効前に人間が更新（`06_operations_ledger.md` 四半期点検に含む） |
| Provisioning Profile "MaterialPhotoLogger AppStore New" | Developer Portal | 証明書更新時に再生成し、名称を変えた場合は `project.yml` の `PROVISIONING_PROFILE_SPECIFIER` を同期 |

秘密（証明書秘密鍵・App Store Connect API キー）はリポジトリへ**絶対に含めない**。

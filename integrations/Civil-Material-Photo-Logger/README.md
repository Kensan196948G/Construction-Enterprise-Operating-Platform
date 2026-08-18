# 📸 Civil材料フォトログ（Civil Material Photo Logger）

**現場の「あの材料、どこにあったっけ？」をなくすための、iPhone/iPad向け写真記録アプリです。**

材料を撮影 → 案件番号・材料名・数量・置場をその場で入力 → あとで一覧確認・Excel（CSV）に書き出し。
それだけのシンプルなアプリです。専門知識がなくても、現場で今すぐ使えます。

<p align="center">
  <img src="docs/screenshots/home.png" alt="ホーム画面" width="320">
</p>

---

## 📌 このアプリで何ができるのか

土木・建設現場では、材料の搬入・仮置き・使用状況の記録が、写真・紙のメモ・Excel・チャットなどバラバラの場所に散らばりがちです。その結果、あとから「どの案件の、どの置場に、何が、どれだけあったか」を確認するのに時間がかかります。

このアプリは、**写真を撮った瞬間に、必要な情報をその場でまとめて記録する**ことで、この手戻りをなくします。

| できること | 内容 |
|---|---|
| 📷 写真を撮る | カメラを起動してその場で材料写真を撮影 |
| 📝 情報を入力する | 案件番号・材料名・材料区分・数量・単位・置場・メモを入力 |
| 💾 端末に保存する | 通信環境がなくても保存できる（オフライン対応） |
| 📃 一覧で確認する | 撮影日時順に記録を一覧表示、写真つきで確認 |
| 📤 Excelで書き出す | 記録をCSVファイルとして出力し、社内のExcel台帳に取り込み可能 |

**インターネット接続は不要です。** 現場は電波が不安定な場所も多いため、全ての記録・保存・確認はスマートフォン/タブレットの中だけで完結します。

---

## 👷 どんな人におすすめか

| 利用者 | こんな場面で役立ちます |
|---|---|
| **現場監督・現場管理者** | 搬入された材料をその場で写真と一緒に記録し、後日の数量確認や検収作業を省力化 |
| **土木・建設技術者** | 案件ごとの材料使用状況を一覧化し、報告書や工事記録の作成を効率化 |
| **研究者・調査担当者** | 現場で収集したデータをCSV形式で取り出し、Excel・統計ソフトでの分析に活用 |
| **協力会社・資材担当者** | 難しい操作なしで、材料搬入・仮置きの記録を写真付きで残せる |

パソコンの専門知識やITスキルは一切不要です。カメラアプリを使う感覚でそのまま使えます。

---

## 📱 入手方法（TestFlight）

現在、TestFlight（Appleの公式テスト配信サービス）経由でお試しいただけます。招待を受けたメールアドレスから、TestFlightアプリ経由でインストールできます。

1. iPhone/iPadに「TestFlight」アプリ（App Store提供）をインストール
2. 届いた招待メールのリンクを開く
3. TestFlightアプリでこのアプリをインストール

ご不明な点があれば、開発担当までご連絡ください。

---

## 🖐️ 使い方（かんたん4ステップ）

1. **ホーム画面**で「写真を撮る」をタップ
2. カメラで材料を撮影 → 案件番号・材料名などを入力（案件番号と材料名は必須、それ以外は任意）
3. 「一時保存」をタップして記録を保存
4. あとで「記録一覧」から確認、または「CSV出力」でExcel用ファイルとして書き出し

入力項目は「写真」「基本情報」「数量・置場」「メモ」の4つのグループに分かれており、よく使う項目だけを開いて入力できるようになっています（アコーディオン形式）。

### 📲 iPadでの利用

iPad（全画面表示時）では、画面左に**サイドバー**が表示される専用レイアウトになります。

- 🏠 ホーム: 今日の記録・総記録数・案件数がひと目でわかる統計カード付きダッシュボード
- 📋 記録一覧: 広い画面を活かした2カラムのカード表示（複製は長押しメニューから）
- 🧭 サイドバーからホーム / 記録一覧 / 案件別サマリー / 材料傾向 / CSV出力 / 設定へ直接移動

iPhoneでは従来どおりの縦型レイアウトです。機能はどちらの端末でも同じです。

---

## 🚧 現在の開発状況

| 機能 | 状態 |
|---|---|
| 写真撮影・材料情報の記録（複数枚添付・手書き注釈・EXIF保持） | ✅ 利用可能 |
| 一覧確認・詳細確認（検索・絞り込み・並び替え・編集・複製・削除） | ✅ 利用可能 |
| CSV（Excel用）/ JSON出力・PDF写真台帳・案件横断比較出力 | ✅ 利用可能（日本語文字化け対策済み） |
| 案件別サマリー・材料傾向グラフ・統計カード | ✅ 利用可能 |
| 検収ステータス・要確認フラグ・数量増減履歴 | ✅ 利用可能 |
| QRコード読み取り・OCR読み取り・GPS自動記録 | ✅ 利用可能 |
| 端末間バックアップ・復元（機種変更向け） | ✅ 利用可能 |
| iPad専用レイアウト（サイドバー+ダッシュボード） | ✅ 利用可能 |
| オフライン動作 | ✅ 利用可能 |
| TestFlightでの試用 | ✅ 配信中 |
| App Storeでの一般公開 | ⏳ 未定（試用フェーズ） |

現在は**試用（ベータ）段階**です。使ってみてのご意見・改善要望を歓迎します。

---

## 🔭 開発ロードマップと進捗

### ✅ 完了済みフェーズ

- **Phase 2A（現場効率化）**: 写真の複数枚添付 / 数量クイック入力（+1/-1） / 前回入力の複製 / 入力候補サジェスト / 一覧の検索・絞り込み・並び替え / 詳細画面からの編集・削除 / 音声入力対応 / 手書き注釈 / 未同期バッジ土台
- **Phase 2B-F（バックログ開発）**: 案件別サマリー / CSV絞り込み出力 / PDF写真台帳 / 数量増減履歴 / 傾向グラフ / 検収ステータス / 破損・要確認フラグ / GPS自動記録 / QRコード読み取り / OCR読み取り / 共有拡張 / JSON出力 / EXIF情報保持 / 統合エクスポート / 統計・傾向分析 / 端末間バックアップ・復元
- **品質強化フェーズ**: 入力バリデーション強化 / 読み込み失敗の可視化 / サムネイル非同期化 / 保存ロジックのテスト基盤整備
- **iPad UI**: サイドバーレイアウト / ホームダッシュボード / 2カラム記録一覧

### 🗂️ 将来検討（外部環境が整い次第再評価）

- 📏 LiDAR簡易計測（実機センサー検証環境が前提）
- ☁️ SharePoint・DirectCloud連携、案件/材料マスタ連携（実際のテナント・API認証情報が前提）
- 👥 複数ユーザーでのクラウド同期・権限管理・承認フロー（クラウドバックエンド選定が前提）

開発の進捗は [GitHub Issues](https://github.com/Kensan196948G/Civil-Material-Photo-Logger/issues) と [マイルストーン](https://github.com/Kensan196948G/Civil-Material-Photo-Logger/milestones) で公開しています。

ご要望があれば、下記の「フィードバック・改善提案」からぜひお寄せください。

---

## 💬 フィードバック・改善提案

実際に使ってみてのご感想、使いにくい点、追加してほしい機能などがあれば、開発担当までお知らせください。現場での使い勝手を最優先に、継続的に改善していきます。

---

## 🔧 開発者向け情報

<details>
<summary>技術者・開発担当者はこちらを開いてください</summary>

### 概要

| 項目 | 内容 |
|---|---|
| 対象端末 | iPhone / iPad（iOS 26以降） |
| 開発言語 | Swift / SwiftUI |
| 保存方式 | 端末内ローカル保存（Codable JSON） |
| 出力方式 | CSV出力（UTF-8 BOM付き / CRLF） |

### リポジトリ構成

```text
Civil-Material-Photo-Logger/
├─ README.md
├─ docs/                          設計ドキュメント
│  ├─ 01_requirements.md          要件定義書
│  ├─ 02_detail_design.md         詳細設計書
│  ├─ 03_claude_code_instructions.md  Claude Code 作業指示書
│  └─ design-system.md            デザインシステム
└─ app/                           iOS アプリ本体
   ├─ project.yml                 xcodegen プロジェクト定義
   ├─ Sources/MaterialLoggerCore/ ロジック層（SwiftPM・プラットフォーム非依存）
   ├─ Tests/MaterialLoggerCoreTests/ ユニットテスト
   └─ MaterialPhotoLogger/        SwiftUI アプリ本体（Views / ViewModels）
```

### セットアップ

前提: macOS + Xcode（iOS 26+ SDK）、[XcodeGen](https://github.com/yonaskolb/XcodeGen)（`brew install xcodegen`）

```bash
cd app
xcodegen generate
open MaterialPhotoLogger.xcodeproj
```

ロジック層のみ検証する場合（Xcode不要）:

```bash
cd app
swift test
```

### 品質ゲート

| チェック | コマンド | 実行環境 |
|---|---|---|
| ユニットテスト | `swift test`（`app/`配下） | ローカル / CI |
| iOSビルド確認 | `xcodegen generate && xcodebuild build` | ローカル / CI（GitHub Actions macOS runner） |

### 検証結果

| 日付 | 検証 | 結果 |
|---|---|---|
| 2026-08-12 | `swift test`（MaterialLoggerCore / `swift:6.1`） | ✅ 292件全て成功 |
| 2026-08-12 | `xcodebuild test`（MaterialPhotoLoggerTests 16件 + SmokeFlowUITests 7件 / iOS Simulator） | ✅ 23件全て成功（CI） |
| 2026-08-07 | `xcodebuild test`（MaterialPhotoLoggerTests / iOS Simulator） | ✅ 16件全て成功（CI） |
| 2026-07-10 | `xcodebuild`（iOS実機ビルド・iOS 26ターゲット） | ✅ BUILD SUCCEEDED（警告0・エラー0） |
| 2026-07-10 | App Store Connect（TestFlight）へのアップロード | ✅ 成功、内部/外部テスターへ配信開始 |

> テスト件数は変更のたびに増える。**この表を更新せずにテストを追加しないこと。**
> 現在のCore件数は `cd app && swift test` の最終行で確認できる（App件数はCIログ）。

### 開発方針・禁止事項

- 要件にない機能を勝手に追加しない
- LiDAR本格計測・クラウド連携（SharePoint / DirectCloud）・ログイン認証・サーバ同期は実装しない（将来拡張として設計余地のみ残す）
  - QR/OCR は Phase 2B-F で実装済み。上記の「実装しない」対象ではない
- 保存項目・CSV列を勝手に変更しない
- 1回の作業で大量のファイルを変更しすぎない

### ドキュメント

- [要件定義書](docs/01_requirements.md)
- [詳細設計書](docs/02_detail_design.md)
- [Claude Code 作業指示書](docs/03_claude_code_instructions.md)
- [デザインシステム](docs/design-system.md)
- [利用者マニュアル（現場向け）](docs/08_user_manual.md)
- [本番運用マニュアル（組織・管理者向け）](docs/09_production_operations.md)
- [セキュリティ設計書](docs/10_security_design.md)
- [統合評価・改善報告書](docs/11_evaluation_report.md)
- [Phase 2 クラウド同期 要件定義書（案）](docs/12_phase2_cloud_sync_requirements.md)
- [Phase 2 クラウド同期 API基盤（検証環境で実動作中）](cloud/README.md)
- [Web閲覧ダッシュボード（デモ）](cloud/dashboard/README.md)
- [架空デモデータ投入手順](cloud/seed/README.md)

### クラウド同期・Webダッシュボード（Phase 2・検証環境）

| 項目 | 内容 |
|---|---|
| 同期API | https://civil-material-photo-logger-sync.kensan1969.workers.dev（v0.2.0・RBAC・監査・検収・集計） |
| Webダッシュボード（デモ） | https://civil-material-photo-logger-mvp.mirai-dx-platform.com（架空データ・読み取り専用） |
| 本番URL（仮・MVPと同一内容） | https://cmpl.mirai-dx-platform.com |
| データ | Neon PostgreSQL（検証環境・架空デモデータ40件等）＋Cloudflare R2（写真） |

> 本番運用は対象外（検証用URL・架空データのみ）。本番化時はEntra ID/Cloudflare Accessによる保護が必要です。

</details>

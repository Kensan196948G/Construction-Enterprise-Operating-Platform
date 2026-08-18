# Claude Code 作業指示書  
# iOS 現場材料写真記録アプリ（MVP）

> **⚠️ 本書はMVP着手時点の指示書である。MVPは完了済みで、現在は拡張フェーズにある。**
>
> 本書の「対象外機能」は**MVP時点の凍結範囲**であり、現時点の禁止事項ではない。
> 実装済みかどうかは本書ではなく **実コード（`app/Sources` / `app/MaterialPhotoLogger`）と
> テストを正**とすること。現在の実装状況は §2.1 の一覧を参照。
>
> **本書の記述を根拠に、実装済み機能を削除してはならない。**

## 1. 目的

この文書は、Claude CodeにiOS現場材料写真記録アプリを実装させるための作業指示書である。  
Claude Codeは、本指示書、要件定義書、詳細設計書を読み、MVP範囲を守って段階的に実装すること。

---

## 2. 開発対象

| 項目 | 内容 |
|---|---|
| アプリ種別 | iOS / iPadOS アプリ |
| アプリ概要 | 写真撮影、材料情報入力、一時保存、一覧確認、CSV出力を行う現場向け記録アプリ |
| 開発言語 | Swift |
| UI | SwiftUI |
| IDE | Xcode |
| AI支援 | Claude Code |
| 保存 | 端末内ローカル保存 |
| 初期MVP | 写真＋材料情報＋CSV出力 |

---

## 2.1 現在の実装状況（本書より優先する）

MVP完了後の拡張で、当初「対象外」としていた一部機能は**実装済み**である。
判断に迷った場合は必ず実コードを確認すること。

| 機能 | 状況 | 実体 |
|---|---|---|
| QRコード読取 | ✅ 実装済み | `QRPayloadParser.swift` / `QRScanResult.swift` / `QRScannerView.swift` + テスト |
| OCR読取 | ✅ 実装済み | `OCRTextExtractor.swift` / `OCRScannerView.swift` + テスト |
| LiDARによる3D計測・点群保存 | ❌ 未実装 | 引き続き対象外 |
| SharePoint / DirectCloud 連携 | ❌ 未実装 | 引き続き対象外 |
| ログイン認証・複数ユーザー同期・サーバAPI | ❌ 未実装 | 引き続き対象外（完全オフライン設計） |

---

## 3. 最重要ルール

Claude Codeは以下を厳守すること。

1. 要件定義書にない機能を勝手に追加しないこと。
2. LiDAR本格計測とクラウド連携は実装しないこと（QR・OCRはMVP後に実装済み。§2.1参照）。
3. まずビルド可能な小さい単位で実装すること。
4. 1回の作業で大量のファイルを変更しすぎないこと。
5. SwiftUI中心で実装すること。
6. カメラ撮影は実機確認が必要であることを前提にすること。
7. CSVは日本語文字化け対策としてUTF-8 BOM付きで出力すること。
8. アコーディオン式折り畳み表示を新規記録画面に実装すること。
9. 保存前バリデーションを必ず実装すること。
10. 変更後はビルド確認コマンドまたはXcodeでの確認手順を提示すること。

---

## 4. MVP機能範囲

実装対象は以下のみとする。

| No | 機能 | 実装 |
|---:|---|---|
| 1 | 写真撮影 | 実装する |
| 2 | 材料名 | 実装する |
| 3 | 材料区分 | 実装する |
| 4 | 数量 | 実装する |
| 5 | 単位 | 実装する |
| 6 | 案件番号 | 実装する |
| 7 | 置場 | 実装する |
| 8 | メモ | 実装する |
| 9 | 一時保存 | 実装する |
| 10 | 一覧確認 | 実装する |
| 11 | CSV出力 | 実装する |

---

## 5. 実装対象外

以下は実装しないこと。

| 対象外機能 | 理由 |
|---|---|
| LiDARによる3D計測 | MVP後の拡張。 |
| 点群保存 | MVP後の拡張。 |
| ~~QRコード読取~~ | **MVP後に実装済み。対象外ではない**（§2.1）。 |
| ~~OCR読取~~ | **MVP後に実装済み。対象外ではない**（§2.1）。 |
| SharePoint連携 | MVP後の拡張。 |
| DirectCloud連携 | MVP後の拡張。 |
| ログイン認証 | 個人検証MVPでは不要。 |
| 複数ユーザー同期 | MVPでは不要。 |
| サーバAPI | MVPでは不要。 |

---

## 6. 推奨リポジトリ構成

```text
Civil-LiDAR-Material-Logger/
├─ README.md
├─ docs/
│  ├─ 01_requirements.md
│  ├─ 02_detail_design.md
│  └─ 03_claude_code_instructions.md
└─ app/
   └─ iOS Xcode Project
```

Xcodeプロジェクト内は以下を目安とする。

```text
App/
├─ MaterialPhotoLoggerApp.swift
├─ Models/
│  └─ MaterialRecord.swift
├─ Views/
│  ├─ HomeView.swift
│  ├─ RecordEditView.swift
│  ├─ RecordListView.swift
│  ├─ RecordDetailView.swift
│  └─ Components/
│     ├─ AccordionSectionView.swift
│     ├─ PhotoCaptureView.swift
│     └─ FormFieldViews.swift
├─ ViewModels/
│  ├─ RecordEditViewModel.swift
│  └─ RecordListViewModel.swift
├─ Services/
│  ├─ PhotoStorageService.swift
│  ├─ CSVExportService.swift
│  └─ ValidationService.swift
├─ Resources/
│  └─ MasterData.swift
└─ Utilities/
   ├─ DateFormatterUtil.swift
   └─ CSVEscaper.swift
```

---

## 7. 作業開始前に読むべき資料

Claude Codeは作業前に以下を読むこと。

1. `docs/01_requirements.md`
2. `docs/02_detail_design.md`
3. `docs/03_claude_code_instructions.md`
4. `README.md`

読み取り後、以下を確認してから作業すること。

```text
- MVP範囲
- 対象外機能
- 画面構成
- データ項目
- CSV仕様
- アコーディオン表示仕様
```

---

## 8. 段階別作業指示

## Phase 1：プロジェクト初期化

### 作業内容

1. XcodeでSwiftUIアプリを作成する。
2. アプリ名を `MaterialPhotoLogger` とする。
3. Git管理を有効化する。
4. README.mdを作成する。
5. docs配下に設計書を配置する。

### 完了条件

- Xcodeで空アプリがビルドできる。
- GitHubへ初回コミットできる。

### Claude Codeへの指示例

```text
このリポジトリはiOS SwiftUIアプリです。
docs配下の要件定義書、詳細設計書、Claude Code作業指示書を読み、MVP範囲を把握してください。
まずREADME.mdと基本ディレクトリ構成を整備してください。
この段階では機能実装は行わないでください。
```

---

## Phase 2：データモデルとマスタ作成

### 作業内容

1. `MaterialRecord` を作成する。
2. 材料区分マスタを作成する。
3. 単位マスタを作成する。
4. 日付フォーマットユーティリティを作成する。

### 完了条件

- データモデルがビルドできる。
- 材料区分と単位の候補がコード上で管理されている。

### Claude Codeへの指示例

```text
MaterialRecordモデル、材料区分マスタ、単位マスタを作成してください。
MVPでは以下の項目のみ扱います。
record_id, project_code, material_name, material_category, quantity, unit, storage_place, memo, photo_file_name, captured_at, created_at, updated_at。
SwiftUI画面の実装はまだ行わず、モデルとマスタのみ実装してください。
```

---

## Phase 3：ホーム画面作成

### 作業内容

1. `HomeView` を作成する。
2. 新規記録、一覧確認、CSV出力の入口を配置する。
3. NavigationStackを設定する。

### 完了条件

- ホーム画面が表示される。
- 新規記録画面・一覧画面へ遷移できる土台がある。

### Claude Codeへの指示例

```text
HomeViewを作成してください。
画面には「新規記録」「一覧確認」「CSV出力」の3つの導線を配置してください。
この段階では遷移先画面は仮画面で構いません。
SwiftUIのNavigationStackを使用してください。
```

---

## Phase 4：アコーディオンコンポーネント作成

### 作業内容

1. `AccordionSectionView` を作成する。
2. タイトル行をタップして開閉できるようにする。
3. 展開・折り畳み状態を外部から制御できるようにする。

### 完了条件

- 任意のViewをアコーディオン内に表示できる。
- `@Binding var isExpanded` で開閉状態を管理できる。

### Claude Codeへの指示例

```text
RecordEditViewで使うAccordionSectionViewを作成してください。
タイトル、展開状態、コンテンツViewを受け取り、タップで開閉できる汎用コンポーネントにしてください。
エラー時にViewModel側から自動展開できるよう、isExpandedはBindingで受け取ってください。
```

---

## Phase 5：新規記録画面作成

### 作業内容

1. `RecordEditView` を作成する。
2. 以下のセクションを作成する。
   - 写真
   - 基本情報
   - 数量・置場
   - メモ
3. 基本情報には案件番号、材料名、材料区分を配置する。
4. 数量・置場には数量、単位、置場を配置する。
5. メモには複数行入力欄を配置する。
6. 保存ボタンを画面下部に配置する。

### アコーディオン初期状態

| セクション | 初期状態 |
|---|---|
| 写真 | 展開 |
| 基本情報 | 展開 |
| 数量・置場 | 折り畳み |
| メモ | 折り畳み |

### 完了条件

- 入力画面が表示される。
- アコーディオンが開閉できる。
- 各項目を入力できる。

### Claude Codeへの指示例

```text
RecordEditViewを作成してください。
新規記録画面はアコーディオン式にしてください。
セクションは「写真」「基本情報」「数量・置場」「メモ」です。
写真と基本情報は初期展開、数量・置場とメモは初期折り畳みにしてください。
保存ボタンは画面下部に配置してください。
まだローカル保存処理は仮実装で構いません。
```

---

## Phase 6：バリデーション実装

### 作業内容

1. `ValidationService` を作成する。
2. 案件番号と材料名の必須チェックを実装する。
3. 数量の0未満チェックを実装する。
4. エラー時に該当アコーディオンを自動展開する。

### 完了条件

- 案件番号未入力時に保存できない。
- 材料名未入力時に保存できない。
- 数量が0未満の場合に保存できない。
- エラー項目のあるセクションが自動展開される。

### Claude Codeへの指示例

```text
RecordEditViewに保存前バリデーションを追加してください。
案件番号と材料名は必須です。
数量は入力されている場合、0以上のみ許可してください。
エラーがある場合は、該当するアコーディオンセクションを自動展開し、画面上にエラーメッセージを表示してください。
```

---

## Phase 7：ローカル保存実装

### 作業内容

1. 保存方式を決定する。
2. SwiftDataまたはCodable JSONで記録を保存する。
3. 保存済み記録を読み込めるようにする。

### 推奨

- iOS 17以降前提ならSwiftData。
- まず単純に作るならCodable JSON。

### 完了条件

- 保存ボタン押下で記録が保存される。
- アプリ再起動後も記録が残る。

### Claude Codeへの指示例

```text
RecordEditViewの入力内容をローカル保存できるようにしてください。
保存方式は、現在のプロジェクト構成に合わせてSwiftDataまたはCodable JSONを選択してください。
保存対象はMaterialRecordです。
写真ファイル保存は次Phaseで実装するため、このPhaseではphotoFileNameはnilでも構いません。
```

---

## Phase 8：一覧画面・詳細画面作成

### 作業内容

1. `RecordListView` を作成する。
2. 保存済み記録を新しい順に表示する。
3. `RecordDetailView` を作成する。
4. 一覧行タップで詳細画面へ遷移する。

### 完了条件

- 保存済み記録が一覧表示される。
- 一覧から詳細確認できる。

### Claude Codeへの指示例

```text
RecordListViewとRecordDetailViewを作成してください。
一覧画面では保存済みMaterialRecordをcreatedAtの新しい順で表示してください。
表示項目は、案件番号、材料名、数量、単位、置場、登録日時です。
一覧行をタップすると詳細画面へ遷移し、すべての項目を確認できるようにしてください。
```

---

## Phase 9：写真撮影・写真保存実装

### 作業内容

1. `PhotoCaptureView` を作成する。
2. カメラを起動できるようにする。
3. 撮影した写真をプレビュー表示する。
4. `PhotoStorageService` で画像ファイルを保存する。
5. `photoFileName` をMaterialRecordに紐づける。

### 完了条件

- 実機でカメラが起動する。
- 撮影写真が画面に表示される。
- 保存後、写真ファイル名が記録に紐づく。

### Claude Codeへの指示例

```text
写真撮影機能を追加してください。
MVPではUIImagePickerControllerをSwiftUIから利用する形で構いません。
撮影後、RecordEditViewの写真セクションにプレビューを表示してください。
保存時にはPhotoStorageServiceでJPEGファイルとして端末内に保存し、MaterialRecord.photoFileNameに紐づけてください。
Info.plistにカメラ利用目的の設定が必要な場合は追加してください。
```

---

## Phase 10：CSV出力実装

### 作業内容

1. `CSVExportService` を作成する。
2. 保存済み記録をCSV文字列に変換する。
3. UTF-8 BOM付きでCSVファイルを作成する。
4. 共有シートで出力できるようにする。

### 完了条件

- CSVファイルを出力できる。
- 日本語が文字化けしない。
- メモ内のカンマ、改行、ダブルクォートが正しく処理される。

### Claude Codeへの指示例

```text
CSVExportServiceを作成してください。
保存済みMaterialRecordをCSVに変換し、UTF-8 BOM付き、CRLF改行でファイル出力してください。
CSVヘッダーは詳細設計書の仕様に合わせてください。
カンマ、改行、ダブルクォートを含む値は正しくエスケープしてください。
出力後は共有シートで保存・送信できるようにしてください。
```

---

## Phase 11：テスト実装

### 作業内容

1. ValidationServiceの単体テストを作成する。
2. CSVExportServiceの単体テストを作成する。
3. CSVエスケープのテストを作成する。

### 完了条件

- 必須チェックのテストが通る。
- 数量チェックのテストが通る。
- CSV変換のテストが通る。

### Claude Codeへの指示例

```text
ValidationServiceとCSVExportServiceの単体テストを作成してください。
案件番号未入力、材料名未入力、数量マイナス、CSVヘッダー、CSVエスケープ、日本語出力をテスト対象にしてください。
テストが通る状態まで修正してください。
```

---

## Phase 12：実機確認

### 作業内容

1. iPhoneまたはiPad実機でビルドする。
2. カメラ撮影を確認する。
3. 保存・一覧・詳細・CSV出力を確認する。
4. CSVをFiles、Numbers、Excelで確認する。

### 完了条件

- 実機で主要機能が動作する。
- CSVが文字化けしない。
- オフラインでも動作する。

### Claude Codeへの指示例

```text
実機確認前のチェックリストを作成してください。
対象は、カメラ権限、写真撮影、保存、一覧表示、詳細表示、CSV出力、日本語文字化け確認、オフライン動作確認です。
コード修正が必要な箇所があれば、最小変更で対応してください。
```

---

## 9. コミットルール

コミットは小さく分けること。

### コミット例

```text
feat: add material record model
feat: add home screen navigation
feat: add accordion section component
feat: add record edit form
feat: add validation service
feat: add local persistence
feat: add record list and detail views
feat: add photo capture support
feat: add csv export service
test: add validation and csv export tests
```

---

## 10. ブランチルール

MVPでは以下を基本とする。

```text
main
└─ develop
   ├─ feature/model
   ├─ feature/ui-home
   ├─ feature/ui-record-edit
   ├─ feature/local-save
   ├─ feature/photo-capture
   └─ feature/csv-export
```

個人開発では `main` と `develop` のみでもよい。  
ただし、写真撮影やCSV出力など影響が大きい作業はfeatureブランチに分ける。

---

## 11. Claude Codeへの禁止指示

Claude Codeには以下を明示すること。

```text
以下は禁止です。
- 要件にない機能を追加すること
- LiDAR本格計測を実装すること
- クラウド連携を実装すること
- ログイン認証を追加すること
- 外部ライブラリを勝手に追加すること
- UIを大幅に複雑化すること
- 保存項目を勝手に増やすこと
- CSV列を勝手に変更すること
```

---

## 12. Claude Codeへの基本プロンプト

開発開始時は、Claude Codeに以下を渡す。

```text
あなたはこのiOS SwiftUIアプリの開発補助を行います。
まず docs/01_requirements.md、docs/02_detail_design.md、docs/03_claude_code_instructions.md を読んでください。

このアプリのMVPは、写真撮影、材料名、材料区分、数量、単位、案件番号、置場、メモ、一時保存、一覧確認、CSV出力です。

新規記録画面では、入力項目の一部をアコーディオン式に折り畳み表示します。
セクションは「写真」「基本情報」「数量・置場」「メモ」です。
写真と基本情報は初期展開、数量・置場とメモは初期折り畳みです。

MVPではLiDAR本格計測、SharePoint、DirectCloud、ログイン認証、サーバAPIは実装しないでください。
（QR・OCRはMVP後に実装済みです。§2.1を参照し、既存実装を削除しないでください。）

まず現在のリポジトリ構成を確認し、実装計画を小さなステップで提示してください。
その後、Phase 1から順番に実装してください。
```

---

## 13. 各作業後にClaude Codeへ求める報告

各Phase完了時に、Claude Codeは以下を報告すること。

```text
1. 変更したファイル
2. 追加したファイル
3. 実装した内容
4. 未実装の内容
5. ビルド確認結果
6. 次に行うべき作業
```

---

## 14. ビルド確認方針

Claude Codeは可能な範囲でビルド確認を行う。  
ただし、iOS実機カメラ確認はXcodeと実機で実施する。

### 確認項目

| 項目 | 確認方法 |
|---|---|
| Swiftコンパイル | Xcode Build |
| SwiftUI画面 | Simulator / Preview |
| カメラ | 実機 |
| 写真保存 | 実機 |
| CSV出力 | Simulator / 実機 |
| 日本語CSV | Mac / Windows Excel / Numbers |

---

## 15. MVP完成条件

以下を満たしたらMVP完成とする。

1. 写真撮影できる。
2. 案件番号を入力できる。
3. 材料名を入力できる。
4. 材料区分を選択できる。
5. 数量を入力できる。
6. 単位を選択できる。
7. 置場を入力できる。
8. メモを入力できる。
9. 一時保存できる。
10. 一覧確認できる。
11. 詳細確認できる。
12. CSV出力できる。
13. CSVが日本語文字化けしない。
14. 入力画面がアコーディオン式で整理されている。
15. 実機で主要機能が動作する。

---

## 16. 最終方針

このアプリは最初から高機能化しない。  
まず「写真を撮る」「材料情報を入れる」「保存する」「一覧で見る」「CSVで出す」を確実に完成させる。

LiDARとクラウド連携は、その後の拡張として扱う。  
QR・OCRはこの拡張枠で既に実装済みである（§2.1）。  
現場で使える小さな成功を先に作ることを最優先とする。

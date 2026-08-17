# 詳細設計書  
# iOS 現場材料写真記録アプリ（MVP）

## 1. 文書情報

| 項目 | 内容 |
|---|---|
| 文書名 | 詳細設計書 |
| 対象アプリ | iOS 現場材料写真記録アプリ（MVP） |
| 対象OS | iOS / iPadOS |
| 開発環境 | macOS / Xcode / Claude Code |
| 開発言語 | Swift |
| UI | SwiftUI |
| 保存方式 | SwiftDataまたはCodable JSON + 画像ファイル保存 |
| 出力方式 | CSVファイル出力 |

---

## 2. システム概要

本アプリは、現場で撮影した写真に材料情報を付与し、端末内に保存したうえで、一覧確認およびCSV出力を行うiOSアプリである。

初期MVPでは外部サーバ、クラウド同期、認証機能は持たない。  
すべてのデータは端末内に保存し、CSV出力時のみ利用者操作によりファイル共有する。

---

## 3. 全体構成

```text
User
 ↓
iOS App
 ├─ SwiftUI Views
 ├─ ViewModels
 ├─ Domain Models
 ├─ Local Persistence
 ├─ Photo Storage
 └─ CSV Export Service
 ↓
Local Device Storage
 ├─ Record Data
 └─ Photo Files
```

---

## 4. 推奨アーキテクチャ

MVPでは、過剰な設計を避けつつ、将来拡張しやすい構成とする。

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

## 5. 画面設計

## 5.1 ホーム画面

### 目的

新規記録、一覧確認、CSV出力への入口を提供する。

### 表示項目

| 項目 | 種別 | 内容 |
|---|---|---|
| アプリ名 | Text | 現場材料写真記録 |
| 新規記録ボタン | Button | 新規記録画面へ遷移 |
| 一覧確認ボタン | Button | 一覧画面へ遷移 |
| CSV出力ボタン | Button | CSV出力処理または一覧画面へ遷移 |

### 操作

| 操作 | 処理 |
|---|---|
| 新規記録 | RecordEditViewを表示 |
| 一覧確認 | RecordListViewを表示 |
| CSV出力 | 保存済みデータからCSVを作成し、共有シートを表示 |

---

## 5.2 新規記録画面

### 目的

写真撮影および材料記録の入力を行う。

### 画面構成

```text
新規記録画面
├─ 写真セクション          初期展開
│  ├─ 写真撮影ボタン
│  └─ 写真プレビュー
│
├─ 基本情報セクション      初期展開
│  ├─ 案件番号
│  ├─ 材料名
│  └─ 材料区分
│
├─ 数量・置場セクション    折り畳み可能
│  ├─ 数量
│  ├─ 単位
│  └─ 置場
│
├─ メモセクション          折り畳み可能
│  └─ メモ
│
└─ 保存ボタン              画面下部
```

### アコーディオン仕様

| セクション | 初期状態 | 折り畳み可否 | 備考 |
|---|---|---|---|
| 写真 | 展開 | 可 | 写真未撮影時は展開を推奨。 |
| 基本情報 | 展開 | 可 | 必須項目を含む。エラー時は自動展開。 |
| 数量・置場 | 折り畳み | 可 | 任意項目中心。 |
| メモ | 折り畳み | 可 | 任意項目。 |

### 入力項目詳細

| 項目 | UI部品 | 必須 | バリデーション |
|---|---|---|---|
| 写真 | Button + Image Preview | 任意 | MVPでは任意。ただし撮影推奨。 |
| 案件番号 | TextField | 必須 | 空欄不可。前後空白除去。 |
| 材料名 | TextField | 必須 | 空欄不可。前後空白除去。 |
| 材料区分 | Picker | 任意 | 初期値は「その他」または未選択。 |
| 数量 | TextField / Decimal入力 | 任意 | 数値のみ。0未満不可。 |
| 単位 | Picker | 任意 | 候補から選択。 |
| 置場 | TextField | 任意 | 前後空白除去。 |
| メモ | TextEditor | 任意 | 最大文字数は初期500文字目安。 |

### 保存ボタン押下時処理

```text
1. 入力値を取得
2. 前後空白を除去
3. 必須項目チェック
4. 数量の数値チェック
5. エラーがあれば該当セクションを展開してメッセージ表示
6. 写真があれば画像ファイルとして保存
7. MaterialRecordを生成
8. ローカル保存
9. 保存完了メッセージ表示
10. 一覧画面またはホーム画面へ戻る
```

---

## 5.3 一覧画面

### 目的

保存済み記録を一覧表示し、詳細確認やCSV出力へつなげる。

### 表示項目

| 項目 | 内容 |
|---|---|
| 写真サムネイル | 撮影済み写真の縮小表示。未撮影時はプレースホルダー。 |
| 案件番号 | project_code |
| 材料名 | material_name |
| 数量・単位 | quantity + unit |
| 置場 | storage_place |
| 登録日時 | created_at |

### 並び順

- 初期表示は登録日時の新しい順とする。

### 操作

| 操作 | 処理 |
|---|---|
| 一覧行タップ | 詳細画面へ遷移 |
| CSV出力ボタン | 全件CSV出力 |
| 新規追加ボタン | 新規記録画面へ遷移 |

---

## 5.4 詳細画面

### 目的

保存済み記録の内容を確認する。

### 表示項目

| 項目 | 内容 |
|---|---|
| 写真 | 大きめの写真表示 |
| 案件番号 | project_code |
| 材料名 | material_name |
| 材料区分 | material_category |
| 数量 | quantity |
| 単位 | unit |
| 置場 | storage_place |
| メモ | memo |
| 撮影日時 | captured_at |
| 登録日時 | created_at |
| 更新日時 | updated_at |

### MVPでの編集方針

- MVPでは詳細確認のみでも可。
- 余力があれば詳細画面から編集画面へ遷移する。

---

## 5.5 CSV出力

### 目的

保存済み記録をCSVファイルとして出力する。

### 出力仕様

| 項目 | 内容 |
|---|---|
| ファイル名 | material_records_yyyyMMdd_HHmmss.csv |
| 文字コード | UTF-8 BOM付き |
| 改行コード | CRLF |
| 区切り文字 | カンマ |
| 囲み文字 | ダブルクォート |
| 出力対象 | 保存済み全件 |

### CSVヘッダー

```csv
record_id,project_code,material_name,material_category,quantity,unit,storage_place,memo,photo_file_name,captured_at,created_at,updated_at
```

### CSVエスケープ仕様

- カンマ、改行、ダブルクォートを含む値はダブルクォートで囲む。
- 値内のダブルクォートは `""` に変換する。
- nil値は空欄とする。

---

## 6. データ設計

## 6.1 MaterialRecord

```swift
struct MaterialRecord: Identifiable, Codable {
    var id: UUID
    var projectCode: String
    var materialName: String
    var materialCategory: String?
    var quantity: Double?
    var unit: String?
    var storagePlace: String?
    var memo: String?
    var photoFileName: String?
    var capturedAt: Date?
    var createdAt: Date
    var updatedAt: Date
}
```

SwiftDataを使う場合は `@Model` を付与したクラスとして実装してもよい。  
MVPでは、Claude Codeで実装しやすい方式を優先する。

---

## 6.2 マスタデータ

### 材料区分

```swift
let materialCategories = [
    "仮設材",
    "構造部材",
    "土木材料",
    "安全用品",
    "リース品",
    "その他"
]
```

### 単位

```swift
let units = [
    "個",
    "本",
    "枚",
    "m",
    "m²",
    "m³",
    "kg",
    "t",
    "式",
    "その他"
]
```

---

## 7. 保存設計

## 7.1 記録データ保存

MVPでは以下のいずれかを採用する。

### 推奨案A：SwiftData

| 項目 | 内容 |
|---|---|
| メリット | SwiftUIと相性が良い。後から一覧表示や編集がしやすい。 |
| デメリット | 対応OSバージョンに依存する。 |

### 案B：Codable JSON

| 項目 | 内容 |
|---|---|
| メリット | 実装が単純。データ構造が見えやすい。 |
| デメリット | 件数増加時や検索・編集機能拡張時に工夫が必要。 |

### 初期推奨

- iOS 17以降を前提にできる場合：SwiftData
- できるだけ単純に始める場合：Codable JSON

---

## 7.2 写真ファイル保存

| 項目 | 内容 |
|---|---|
| 保存先 | Application Support または Documents配下 |
| ファイル名 | photo_{record_id}.jpg |
| 画像形式 | JPEG |
| 圧縮率 | 0.8程度を目安 |

### 保存フロー

```text
1. カメラで画像取得
2. JPEGデータへ変換
3. record_idを基にファイル名生成
4. アプリ内ディレクトリへ保存
5. photo_file_nameとしてMaterialRecordに保存
```

---

## 8. バリデーション設計

| 項目 | 条件 | エラーメッセージ例 |
|---|---|---|
| 案件番号 | 空欄不可 | 案件番号を入力してください。 |
| 材料名 | 空欄不可 | 材料名を入力してください。 |
| 数量 | 0未満不可・NaN／無限大不可 | 数量は0以上の数値で入力してください。 |
| メモ | 500文字以内（上限ちょうどは可） | メモは500文字以内で入力してください。 |

> **数量のNaN／無限大について**
> `Double("nan")` / `Double("inf")` はパースに成功するため、負数判定だけでは通り抜ける。
> 通り抜けた値は`JSONEncoder`が既定でエンコード不能として例外を投げ、**保存処理全体が失敗する**
> （1件の不正値で全記録が保存できなくなる）。画面側のパース時にも弾いているが、
> `MaterialLoggerCore`は他の入力経路からも呼ばれうるため、バリデーションでも二重に守る。

> **メモの文字数の数え方**
> `String.count`（書記素クラスタ単位）で数える。結合絵文字や異体字セレクタを含む入力でも
> 「見た目の1文字」を1と数える。UTF-16単位で数える実装へ変えると、絵文字入りのメモが
> 上限のはるか手前で弾かれる。

### エラー時のアコーディオン動作

| エラー項目 | 自動展開セクション |
|---|---|
| 案件番号 | 基本情報 |
| 材料名 | 基本情報 |
| 数量 | 数量・置場 |
| メモ | メモ |

---

## 9. コンポーネント設計

## 9.1 AccordionSectionView

### 目的

入力画面の縦長化を防ぎ、情報を整理して表示する。

### 想定プロパティ

```swift
struct AccordionSectionView<Content: View>: View {
    let title: String
    @Binding var isExpanded: Bool
    let content: () -> Content
}
```

### 表示仕様

- セクションタイトルを表示する。
- 展開/折り畳みアイコンを表示する。
- タップで開閉する。
- エラー時はViewModel側から `isExpanded = true` にする。

---

## 9.2 PhotoCaptureView

### 目的

カメラ起動と写真プレビューを担当する。

### 実装方針

- MVPでは `UIImagePickerController` をSwiftUIからラップして使用する。
- 将来的にAVFoundationへ置き換え可能な構造にする。

---

## 9.3 CSVExportService

### 目的

MaterialRecord配列をCSV文字列・CSVファイルへ変換する。

### 主な関数

```swift
func makeCSV(from records: [MaterialRecord]) -> String
func exportCSV(records: [MaterialRecord]) throws -> URL
```

---

## 10. 権限設計

## 10.1 Info.plist

カメラ利用のため、以下を設定する。

| キー | 値の例 |
|---|---|
| NSCameraUsageDescription | 現場材料の写真を撮影するためにカメラを使用します。 |

写真ライブラリから選択する機能を追加する場合は以下も検討する。

| キー | 値の例 |
|---|---|
| NSPhotoLibraryUsageDescription | 保存済み写真を材料記録に添付するために写真ライブラリを使用します。 |

---

## 11. エラー処理設計

| 発生箇所 | 内容 | 対応 |
|---|---|---|
| カメラ権限なし | カメラを起動できない | 設定アプリで権限変更を促す。 |
| 写真保存失敗 | 画像ファイル保存に失敗 | エラー表示し、再保存を促す。 |
| 入力不足 | 必須項目が未入力 | 該当セクションを展開してメッセージ表示。 |
| CSV出力失敗 | ファイル作成に失敗 | エラー表示し、再実行を促す。 |
| データ読み込み失敗 | ローカルデータ読み込み失敗 | エラー表示し、復旧方法を案内。 |

---

## 12. テスト設計

## 12.1 単体テスト

| No | 対象 | テスト内容 |
|---:|---|---|
| 1 | ValidationService | 案件番号未入力時にエラーになる。 |
| 2 | ValidationService | 材料名未入力時にエラーになる。 |
| 3 | ValidationService | 数量がマイナスの場合にエラーになる。 |
| 4 | CSVExportService | CSVヘッダーが正しい。 |
| 5 | CSVExportService | カンマや改行を含むメモが正しくエスケープされる。 |
| 6 | CSVExportService | 日本語が保持される。 |

---

## 12.2 画面テスト

| No | 画面 | テスト内容 |
|---:|---|---|
| 1 | ホーム | 新規記録画面へ遷移できる。 |
| 2 | 新規記録 | アコーディオンを開閉できる。 |
| 3 | 新規記録 | 必須項目未入力で保存できない。 |
| 4 | 新規記録 | 入力後に保存できる。 |
| 5 | 一覧 | 保存済みデータが表示される。 |
| 6 | 詳細 | 一覧から詳細を確認できる。 |
| 7 | CSV | CSV出力できる。 |

---

## 12.3 実機テスト

| No | 項目 | 内容 |
|---:|---|---|
| 1 | カメラ | 実機でカメラが起動する。 |
| 2 | 写真保存 | 撮影写真が保存される。 |
| 3 | オフライン | 通信なしで保存・一覧確認できる。 |
| 4 | CSV確認 | iPhone/iPadのファイルアプリでCSVを確認できる。 |
| 5 | Excel/Numbers確認 | CSVを開いて日本語が文字化けしない。 |

---

## 13. 開発順序

```text
1. XcodeでSwiftUIプロジェクト作成
2. GitHubリポジトリ初期化
3. READMEとdocs配置
4. MaterialRecordモデル作成
5. マスタデータ作成
6. ホーム画面作成
7. 新規記録画面作成
8. AccordionSectionView作成
9. バリデーション実装
10. ローカル保存実装
11. 一覧画面作成
12. 詳細画面作成
13. 写真撮影機能実装
14. 写真保存機能実装
15. CSV出力機能実装
16. 実機テスト
17. TestFlight検証準備
```

---

## 14. 将来拡張を見据えた設計メモ

### 14.1 LiDAR拡張

将来LiDARを追加する場合、以下のサービスを追加する。

```text
Services/
└─ LiDARCaptureService.swift

Models/
└─ LiDARMeasurement.swift
```

MaterialRecordには将来的に以下を追加できるようにする。

```swift
var lidarFileName: String?
var measuredDistance: Double?
var measuredArea: Double?
var measuredVolume: Double?
```

ただしMVPでは未実装とする。

---

### 14.2 クラウド連携

将来SharePointやDirectCloudへ連携する場合、以下の層を追加する。

```text
Services/
├─ SharePointUploadService.swift
├─ DirectCloudUploadService.swift
└─ SyncQueueService.swift
```

MVP時点では外部送信処理を入れない。

---

## 15. 実装上の注意

- Claude Codeには一度に全機能を作らせない。
- 画面、モデル、保存、CSV、写真の順に小さく実装する。
- 各段階でXcodeビルドを確認する。
- SwiftUI Previewだけで判断せず、実機でカメラ動作を確認する。
- CSVはWindows Excelで開く可能性があるため、UTF-8 BOM付きにする。
- アコーディオン内に必須項目を隠しすぎない。
- エラー時は該当セクションを自動展開する。

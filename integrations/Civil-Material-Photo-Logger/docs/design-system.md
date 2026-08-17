# Civil Material Photo Logger Design System

## 1. Design System Name

**Civil Material Photo Logger Design System**

日本語名：**現場材料写真記録アプリ デザインシステム**

対象リポジトリ：

```text
Kensan196948G/Civil-Material-Photo-Logger
```

本Design Systemは、iOS向け現場材料写真記録アプリの画面、配色、余白、アイコン、コンポーネント、Liquid Glass表現、ClaudeDesign向け指示、Claude Code実装ルールを定義する。

目的は、ClaudeDesign / Claude Code / Xcodeでの開発時に、UI判断がぶれないようにすることである。

---

## 2. Product Concept

Civil Material Photo Loggerは、土木・建設現場で材料写真と材料情報をすばやく記録し、あとから一覧確認・CSV出力できるiOSアプリである。

現場での利用を前提とし、以下を重視する。

* 写真をすぐ撮れる
* 材料情報を最小入力で登録できる
* 案件番号・置場・数量をあとから確認しやすい
* CSV出力によりExcelや社内台帳へ展開しやすい
* 将来的にLiDAR、QR/OCR、写真台帳、SharePoint、DirectCloudへ拡張しやすい

初期MVPでは、クラウド連携やAI判定よりも、**確実に記録して、確実に取り出せること**を優先する。

### 初期MVP対象機能

* 写真撮影
* 材料名入力
* 材料区分選択
* 数量入力
* 単位選択
* 案件番号入力
* 置場入力
* メモ入力
* 一時保存
* 記録一覧
* 記録詳細
* CSV出力
* 設定画面

### 将来拡張候補

* LiDAR簡易記録
* QRコード読み取り
* OCR読み取り
* 写真台帳出力
* SharePoint連携
* DirectCloud連携
* 案件マスタ連携
* 材料マスタ連携
* AIによる入力補助
* 数量・残数量の管理

---

## 3. Design Philosophy

### 3.1 Core Message

**現場で迷わず、あとで困らない記録アプリ。**

このアプリは、見た目の派手さよりも、現場での使いやすさを重視する。
ただし、古臭い業務アプリにはしない。iOS 26以降のLiquid Glassを適切に採用し、現代的で信頼感のある画面にする。

### 3.2 Design Keywords

| キーワード  | 意味                                |
| ------ | --------------------------------- |
| 現場向け   | 屋外・片手操作・短時間入力を前提にする               |
| 迷わない   | 主要操作を画面下部・大きなボタンに集約する             |
| 記録しやすい | 入力項目は最小限にし、後から補足できる設計にする          |
| 確認しやすい | 写真・案件番号・材料名・数量を一覧で見やすくする          |
| 拡張しやすい | LiDAR、QR、OCR、クラウド連携を後から追加できる余白を残す |
| 今風である  | iOS 26以降のLiquid Glassを操作レイヤーに採用する |
| 読みやすい  | 透明感よりも文字・写真・数量の視認性を優先する           |

### 3.3 Design Principle

* 操作は少なく
* 表示は分かりやすく
* 入力は迷わせず
* 出力は確実に
* Glass表現は控えめに
* 写真と材料情報を主役にする

---

## 4. Target Users

| ユーザー        | 利用場面              | UI上の配慮             |
| ----------- | ----------------- | ------------------ |
| 現場担当者       | 材料搬入時、置場確認時、使用記録時 | 大きなボタン、少ない入力、写真優先  |
| 工事担当者       | 記録確認、数量確認、台帳化     | 一覧検索、CSV出力         |
| 管理者         | 案件別確認、後追い調査       | 案件番号、日時、置場、メモを重視   |
| 将来の情シス・DX担当 | データ連携、台帳化、自動化     | CSV仕様、データ項目、拡張性を重視 |
| 協力会社・外部利用候補 | 写真・数量の提出補助        | 入力ミス防止、説明不要な画面     |

### 利用環境

* 屋外
* 現場事務所
* 資材置場
* 材料搬入時
* iPhone片手操作
* 手袋着用の可能性あり
* 明るい日差しの下
* 通信が不安定な場所

### UIで考慮すること

* 小さい文字を避ける
* 押しにくいボタンを避ける
* 入力項目を一画面に詰め込みすぎない
* 写真撮影から保存までの流れを短くする
* 通信前提にしない
* ローカル保存を基本にする

---

## 5. Visual Tone

### 5.1 基本トーン

* 業務アプリらしく、落ち着いた配色にする
* 現場利用を意識し、コントラストを高めにする
* 写真・数量・状態が主役になるよう、装飾は控えめにする
* iOS標準UIの雰囲気を崩さない
* iOS 26以降ではLiquid Glassを採用する
* Liquid Glassはナビゲーション、ツールバー、下部操作バー、写真上の補助操作に限定する
* 入力フォームや一覧カードは可読性を優先する
* 派手すぎるグラデーション、過度なアニメーションは使わない

### 5.2 見た目の方向性

| 項目      | 方針                   |
| ------- | -------------------- |
| 印象      | すっきり、現場向け、信頼感        |
| 色       | 落ち着いたブルー、グリーン、ニュートラル |
| 装飾      | 最小限                  |
| 写真      | 大きく見せる               |
| 入力欄     | 読みやすさ優先              |
| Glass表現 | 操作部品だけに使う            |
| アニメーション | 軽く、短く、控えめ            |

### 5.3 避けるデザイン

* 文字が小さい入力フォーム
* 項目が密集した画面
* 色だけで状態を判断させる表示
* アイコンだけで意味が分からない操作
* 業務アプリに不向きな過度な装飾
* 初期MVPでのダッシュボード過多
* 一覧カード全体のGlass化
* 入力フォーム全体の透過表現
* 写真より装飾が目立つ画面
* Web管理画面のような複雑なレイアウト

---

## 6. Color Tokens

### 6.1 Brand Colors

| Token                 | 用途          | 推奨色       |
| --------------------- | ----------- | --------- |
| `color.primary`       | メイン操作、保存、次へ | `#1769AA` |
| `color.primaryDark`   | 押下時、強調      | `#0D4F8B` |
| `color.primaryLight`  | 補助背景        | `#EAF4FC` |
| `color.accent`        | 写真・スキャン系の強調 | `#2E7D32` |
| `color.warning`       | 未入力、注意      | `#F9A825` |
| `color.danger`        | 削除、エラー      | `#C62828` |
| `color.neutralText`   | 通常文字        | `#1C1C1E` |
| `color.secondaryText` | 補足文字        | `#6E6E73` |
| `color.background`    | 画面背景        | `#F5F7FA` |
| `color.surface`       | カード背景       | `#FFFFFF` |
| `color.border`        | 区切り線        | `#DADDE2` |

### 6.2 Semantic Colors

| 状態        | 表示ルール                 |
| --------- | --------------------- |
| 保存済み      | 緑系アイコン + 「保存済み」テキスト   |
| 一時保存      | 青系アイコン + 「一時保存」テキスト   |
| 未入力あり     | 黄系アイコン + 「未入力あり」テキスト  |
| エラー       | 赤系アイコン + エラー内容テキスト    |
| CSV出力済み   | 青系アイコン + 「出力済み」テキスト   |
| 削除確認      | 赤系アイコン + 確認ダイアログ      |
| LiDAR記録あり | 緑系アイコン + 「スキャンあり」テキスト |

色だけで状態を表現せず、必ずテキストまたはアイコンを併用する。

### 6.3 Liquid Glass Tint Colors

| Tint   | 用途            |
| ------ | ------------- |
| Blue   | 保存、次へ、CSV出力   |
| Green  | 写真撮影、スキャン開始   |
| Yellow | 注意、未入力        |
| Red    | 削除、破棄、エラー     |
| Gray   | 補助操作、キャンセル、戻る |

Tintは意味のある操作に限定する。
装飾目的だけでTintを使わない。

---

## 7. Typography

iOS標準フォントを使用する。
独自フォントは初期MVPでは使用しない。

| 用途       | SwiftUI目安                | 役割         |
| -------- | ------------------------ | ---------- |
| 画面タイトル   | `.largeTitle` / `.title` | 現在画面の明示    |
| セクション見出し | `.headline`              | 入力グループの区切り |
| 項目ラベル    | `.subheadline`           | フォーム項目名    |
| 本文       | `.body`                  | 通常入力・説明    |
| 補足       | `.footnote` / `.caption` | 注意書き、補足    |
| 数量・件数    | `.title2` / `.title3`    | 数値の強調      |
| ボタン      | `.headline`              | 操作の明示      |
| バッジ      | `.caption`               | 状態表示       |

### 7.1 文字ルール

* 画面タイトルは短くする
* ボタン文言は動詞で始める
* 専門用語は必要最小限にする
* 現場担当者が読んですぐ分かる日本語にする
* エラー文は原因と次の操作を示す
* 数量と単位はセットで表示する
* 案件番号は省略しすぎない

### 7.2 文言例

| NG          | OK            |
| ----------- | ------------- |
| データ登録処理を実行  | 保存する          |
| エクスポート      | CSV出力         |
| レコード一覧      | 記録一覧          |
| キャプチャ       | 写真撮影          |
| ストレージロケーション | 置場            |
| マテリアルカテゴリ   | 材料区分          |
| インプットエラー    | 入力内容を確認してください |

### 7.3 数量表示

```text
12 個
3.5 m³
1.2 t
```

数量と単位の間には半角スペースを入れる。
一覧では数量を太字または大きめに表示する。

---

## 8. Spacing / Layout

### 8.1 基本余白

| Token      |    値 | 用途        |
| ---------- | ---: | --------- |
| `space.xs` |  4px | アイコンと文字の間 |
| `space.sm` |  8px | 小さな余白     |
| `space.md` | 16px | 標準余白      |
| `space.lg` | 24px | セクション間    |
| `space.xl` | 32px | 大きな画面区切り  |

### 8.2 レイアウト原則

* 片手操作を意識し、主要ボタンは画面下部に置く
* 入力フォームは1画面に詰め込みすぎない
* 写真は大きめに表示する
* 一覧では「写真サムネイル + 材料名 + 数量 + 案件番号」を優先表示する
* 詳細情報はタップ後の詳細画面に逃がす
* 余白は詰めすぎず、現場で見やすい密度にする
* Safe Areaを必ず考慮する
* 下部操作バーはホームインジケータと重ならないようにする

### 8.3 入力画面レイアウト

推奨順序：

```text
写真プレビュー
材料名
材料区分
数量 / 単位
案件番号
置場
メモ
一時保存 / 保存する
```

最初のMVPでは、入力画面を高度な台帳画面にしない。
入力項目を増やす場合は、詳細設定または追加情報セクションへ分離する。

---

## 9. Icon Rules

iOSではSF Symbolsを使用する。

| 機能           | 推奨シンボル名                             |
| ------------ | ----------------------------------- |
| 写真撮影         | `camera.fill`                       |
| 写真一覧         | `photo.on.rectangle`                |
| 材料           | `shippingbox.fill`                  |
| 数量           | `number`                            |
| 案件番号         | `tag.fill`                          |
| 置場           | `mappin.and.ellipse`                |
| メモ           | `note.text`                         |
| 一時保存         | `tray.and.arrow.down.fill`          |
| 保存           | `checkmark.circle.fill`             |
| CSV出力        | `square.and.arrow.up`               |
| 検索           | `magnifyingglass`                   |
| LiDAR / スキャン | `viewfinder`                        |
| 設定           | `gearshape.fill`                    |
| 削除           | `trash.fill`                        |
| 編集           | `pencil`                            |
| 共有           | `square.and.arrow.up`               |
| フィルタ         | `line.3.horizontal.decrease.circle` |
| カレンダー        | `calendar`                          |
| 注意           | `exclamationmark.triangle.fill`     |
| エラー          | `xmark.octagon.fill`                |

### 9.1 アイコン利用ルール

* 重要操作ではアイコンだけにしない
* ボタンには原則としてテキストを併記する
* 削除系アイコンは赤系にする
* スキャンや写真撮影は緑または青系で安心感を出す
* 一覧内の補助アイコンは小さくしすぎない
* 同じ意味に複数のアイコンを使わない

---

## 10. Component Rules

## 10.1 Primary Button

用途：

* 写真撮影
* 保存
* CSV出力
* 次へ
* 記録を追加

見た目：

* 背景：`color.primary`
* 文字：白
* 角丸：12px以上
* 高さ：48px以上
* 横幅：基本は画面幅いっぱい
* アイコン + テキストを推奨

文言例：

* `写真を撮る`
* `保存する`
* `CSV出力`
* `記録を追加`
* `次へ`

iOS 26以降では、Primary Buttonは原則としてLiquid Glass対応のGlass Primary Buttonを優先する。
ただし、入力フォーム内や可読性を優先する場面では通常のPrimary Buttonを使用してよい。

---

## 10.2 Secondary Button

用途：

* キャンセル
* 一時保存
* 一覧へ戻る
* あとで入力
* 再撮影

見た目：

* 背景：白または薄い青
* 枠線：`color.border`
* 文字：`color.primary`
* 高さ：44px以上
* 角丸：12px以上

文言例：

* `一時保存`
* `戻る`
* `あとで入力`
* `再撮影`

---

## 10.3 Danger Button

用途：

* 写真削除
* 記録削除
* 入力内容破棄

見た目：

* 背景：白
* 文字：赤系
* アイコン：`trash.fill`
* 高さ：44px以上
* 確認ダイアログ必須

文言例：

* `削除する`
* `入力内容を破棄`
* `この記録を削除`

---

## 10.4 Material Card

一覧画面で使うカード。

表示項目：

1. 写真サムネイル
2. 材料名
3. 数量 + 単位
4. 案件番号
5. 置場
6. 撮影日時
7. 保存状態

レイアウト：

```text
[写真]  材料名
       数量 / 単位
       案件番号・置場
       撮影日時・保存状態
```

ルール：

* カード全体をLiquid Glassにしない
* 背景は`color.surface`
* 角丸は12pxから16px程度
* 写真は左側または上部に配置
* 材料名と数量を最も目立たせる
* 案件番号と置場は補足として表示
* 保存状態は小さなバッジで表示

---

## 10.5 Input Field

入力項目：

* 材料名
* 数量
* 案件番号
* 置場
* メモ

ルール：

* ラベルは必ず表示する
* プレースホルダーに説明を押し込まない
* 必須項目はラベル横に「必須」と表示する
* 数量は数値キーボードを使う
* メモは複数行入力にする
* 入力フォーム全体をGlass化しない
* 未入力エラーは項目直下に表示する

---

## 10.6 Picker / Select

選択項目：

* 材料区分
* 単位
* 案件番号
* 置場

材料区分の初期候補：

* 仮設材
* 構造部材
* 土木材料
* 安全用品
* リース品
* その他

単位の初期候補：

* 個
* 本
* 枚
* m
* m²
* m³
* kg
* t
* 式

ルール：

* 初期MVPでは複雑なマスタ管理画面を作らない
* 候補は固定値で開始してよい
* 将来的に設定画面で編集可能にする余地を残す

---

## 10.7 Status Badge

用途：

* 保存済み
* 一時保存
* 未入力あり
* CSV出力済み
* LiDAR記録あり

表示例：

```text
保存済み
一時保存
未入力あり
CSV出力済み
スキャンあり
```

ルール：

* 小さく表示する
* 色だけで状態を表現しない
* 必ずテキストを併記する
* 一覧カード内では通常バッジを優先する
* Glass表現は写真上の補助表示に限定する

---

## 11. Screen Rules

## 11.1 Home Screen

目的：

* 最初の操作を迷わせない

主要要素：

* アプリ名
* 今日の記録件数
* `写真を撮る`
* `記録一覧`
* `CSV出力`
* `設定`

優先ボタン：

1. 写真を撮る
2. 記録一覧
3. CSV出力

画面方針：

* ホーム画面では「写真を撮る」を最も目立たせる
* 今日の記録件数は補助表示にする
* 複雑なダッシュボードにしない
* 下部の主要操作エリアにLiquid Glassを使ってよい

---

## 11.2 Photo Capture Screen

目的：

* 現場写真をすばやく撮影する

主要要素：

* カメラプレビュー
* 撮影ボタン
* 撮影後プレビュー
* 再撮影
* 次へ

ルール：

* 撮影ボタンは大きくする
* 撮影後すぐ材料入力へ進める
* 再撮影を簡単にできる
* 写真上の補助ボタンにはLiquid Glassを使ってよい
* 写真の重要部分をボタンで隠さない

---

## 11.3 Material Input Screen

目的：

* 写真に材料情報を付与する

入力項目：

* 材料名
* 材料区分
* 数量
* 単位
* 案件番号
* 置場
* メモ

画面下部ボタン：

* `一時保存`
* `保存する`

ルール：

* 必須項目は最小限にする
* 最初のMVPでは、材料名・数量・単位・案件番号を優先する
* メモは任意とする
* 下部保存バーにLiquid Glassを使ってよい
* 入力フォーム全体はGlass化しない

---

## 11.4 Record List Screen

目的：

* 記録した材料写真を確認する

表示項目：

* 写真
* 材料名
* 数量
* 単位
* 案件番号
* 置場
* 撮影日時

機能：

* 検索
* 案件番号フィルタ
* 材料区分フィルタ
* 詳細表示
* CSV出力

ルール：

* 一覧カードは通常Surfaceを基本にする
* 写真、材料名、数量を最優先に見せる
* 検索バーやフィルタボタンにはLiquid Glassを使ってよい
* 一覧全体をGlass化しない

---

## 11.5 Record Detail Screen

目的：

* 1件の記録内容を確認・編集する

表示項目：

* 大きな写真
* 材料名
* 材料区分
* 数量
* 単位
* 案件番号
* 置場
* メモ
* 撮影日時
* 更新日時

操作：

* 編集
* 削除
* 共有
* CSV対象に含める

ルール：

* 写真部分ではLiquid Glassの補助操作を使ってよい
* 詳細情報欄は読みやすさを優先する
* 削除は確認ダイアログ必須
* 編集導線を分かりやすくする

---

## 11.6 CSV Export Screen

目的：

* 記録データをCSVとして出力する

表示項目：

* 出力対象件数
* 期間指定
* 案件番号指定
* 材料区分指定
* 出力ボタン
* 出力後の共有メニュー

文言：

* `CSVを作成する`
* `ファイルに保存`
* `共有する`

ルール：

* CSV出力画面は業務確認画面として扱う
* 表形式プレビューはGlass化しない
* 出力ボタンにはLiquid Glassを使ってよい
* 出力件数と条件を分かりやすく表示する

---

## 11.7 Settings Screen

目的：

* 初期候補、出力設定、アプリ情報を管理する

項目：

* 材料区分候補
* 単位候補
* CSV出力文字コード
* アプリ情報

初期MVPでは設定項目を増やしすぎない。写真保存設定（圧縮率・保存先などの変更）は将来拡張として扱う。

---

## 12. Accessibility Rules

* 文字サイズ変更に対応する
* 重要ボタンは44pt以上を確保する
* 色だけで状態を判断させない
* 写真には代替情報として材料名・案件番号を紐づける
* 屋外利用を想定し、コントラストを高めにする
* エラー表示は赤色だけでなく文章でも説明する
* Reduced Transparencyに対応する
* Increased Contrastに対応する
* Reduced Motionに対応する
* VoiceOverで主要操作が分かるようにする
* アイコンのみのボタンにはアクセシビリティラベルを付与する

### 12.1 VoiceOverラベル例

| UI       | ラベル例              |
| -------- | ----------------- |
| 写真撮影ボタン  | 写真を撮る             |
| 保存ボタン    | 材料記録を保存する         |
| CSV出力ボタン | 記録をCSVファイルとして出力する |
| 削除ボタン    | この記録を削除する         |
| 再撮影ボタン   | 写真を撮り直す           |

---

## 13. Motion / Animation

初期MVPではアニメーションを控えめにする。

使用してよいもの：

* 保存完了時の軽いチェック表示
* 写真撮影後の軽い遷移
* CSV出力完了時の完了表示
* Liquid Glassボタンの標準的な反応
* Sheet表示の標準アニメーション

避けるもの：

* 長いローディング演出
* 過度な画面切替アニメーション
* 業務操作を遅く感じさせる演出
* 意味のない装飾アニメーション
* 写真確認を妨げる動き

### 13.1 Motion方針

* 操作完了を伝えるためのアニメーションは許可する
* 注意を引くためだけのアニメーションは避ける
* Reduced Motion有効時は過度な動きを抑える
* Liquid Glassの標準挙動を優先する

---

## 14. Empty / Error States

## 14.1 記録がない場合

表示文言：

```text
まだ記録がありません。
まずは写真を撮って、材料情報を登録しましょう。
```

ボタン：

```text
写真を撮る
```

---

## 14.2 写真権限がない場合

表示文言：

```text
写真撮影を利用するには、カメラへのアクセス許可が必要です。
設定アプリからカメラの利用を許可してください。
```

ボタン：

```text
設定を開く
```

---

## 14.3 CSV出力対象がない場合

表示文言：

```text
出力できる記録がありません。
記録を保存してからCSV出力を実行してください。
```

ボタン：

```text
記録一覧へ戻る
```

---

## 14.4 入力エラーがある場合

表示文言：

```text
入力内容を確認してください。
必須項目が未入力です。
```

対象項目の直下に個別エラーを表示する。

例：

```text
材料名を入力してください。
数量を入力してください。
案件番号を入力してください。
```

---

## 14.5 保存失敗時

表示文言：

```text
保存できませんでした。
もう一度保存してください。
```

ボタン：

```text
再試行
```

---

## 15. ClaudeDesign Prompt Rules

ClaudeDesignで画面案を作成する場合、以下を必ず守る。

### Must

* iOSアプリとして作成する
* SwiftUIで実装しやすい画面にする
* 現場担当者が片手で操作できる構成にする
* 主要ボタンは画面下部に配置する
* 写真、材料名、数量、案件番号を最優先に見せる
* 過度な装飾を避ける
* SF Symbolsを使う
* 日本語UIにする
* 初期MVP範囲を守る
* Liquid Glassは操作レイヤーに限定する
* 一覧カードと入力フォームは読みやすさを優先する

### Must Not

* Webダッシュボード風にしすぎない
* 入力項目を増やしすぎない
* ログイン画面を作らない
* クラウド連携画面を初期MVPに入れない
* AI判定や数量自動算出を初期MVPに入れない
* LiDAR機能を主役にしすぎない
* 派手なグラデーションや過度な3D表現を使わない
* 画面全体をGlass化しない
* 一覧カード全体をGlass化しない
* 入力フォーム全体を透明化しない

---

## 16. ClaudeDesign Base Prompt

```text
Civil Material Photo LoggerというiOSアプリの画面デザインを作成してください。

このアプリは、土木・建設現場で材料写真を撮影し、材料名、材料区分、数量、単位、案件番号、置場、メモを登録し、あとから一覧確認とCSV出力を行うための現場向け記録アプリです。

デザインはiOS標準UIに近く、SwiftUIで実装しやすい構成にしてください。
現場での片手操作、屋外利用、短時間入力を重視してください。

iOS 26以降のLiquid Glassを採用してください。
ただし、Liquid Glassはナビゲーション、ツールバー、下部操作バー、写真上の補助操作に限定してください。
一覧カード、入力フォーム、CSVプレビュー表は読みやすさを優先し、過度に透明化しないでください。

画面は以下を作成してください。

1. ホーム画面
2. 写真撮影画面
3. 材料情報入力画面
4. 記録一覧画面
5. 記録詳細画面
6. CSV出力画面
7. 設定画面

デザインルール：
- 日本語UI
- SF Symbolsを使用
- メインカラーは落ち着いた建設業務向けブルー
- 写真と材料名と数量を見やすくする
- 主要操作ボタンは画面下部に配置
- 入力項目は詰め込みすぎない
- 初期MVPではログイン、クラウド連携、AI判定、自動数量計算は入れない
- LiDARは将来拡張として扱い、初期画面では控えめにする
- Liquid GlassはRegularを基本にする
- Clearは写真プレビューやカメラ画面の小さな補助操作だけに限定する
- glass on glassは避ける
```

---

## 17. Implementation Mapping

将来SwiftUI実装では、以下のような構成に展開する。

```text
Design/
├─ AppColors.swift
├─ AppTypography.swift
├─ AppSpacing.swift
├─ AppIcons.swift
├─ AppButtonStyle.swift
├─ AppGlassStyle.swift
├─ MaterialCardView.swift
├─ EmptyStateView.swift
├─ StatusBadgeView.swift
└─ BottomActionBarView.swift
```

### SwiftUI Component方針

| DesignSystem         | SwiftUI実装候補                                            |
| -------------------- | ------------------------------------------------------ |
| Primary Button       | `PrimaryButtonStyle` / `.buttonStyle(.glassProminent)` |
| Secondary Button     | `SecondaryButtonStyle` / `.buttonStyle(.glass)`        |
| Danger Button        | `DangerButtonStyle`                                    |
| Material Card        | `MaterialRecordCardView`                               |
| Empty State          | `EmptyStateView`                                       |
| Form Section         | `MaterialFormSectionView`                              |
| Status Badge         | `StatusBadgeView`                                      |
| Bottom Action Bar    | `BottomActionBarView`                                  |
| Photo Overlay        | `PhotoOverlayControlsView`                             |
| Liquid Glass Utility | `AppGlassStyle`                                        |

### 推奨SwiftUI構成

```text
MaterialPhotoLoggerApp
├─ HomeView（CSV出力導線を含む）
├─ RecordEditView（写真撮影はComponents/PhotoCaptureViewを内包）
├─ RecordListView（CSV出力導線を含む）
├─ RecordDetailView
├─ SettingsView
├─ Models
│  └─ MaterialRecord
├─ ViewModels
│  ├─ RecordListViewModel
│  └─ RecordEditViewModel
└─ Design
   ├─ AppColors
   ├─ AppSpacing
   └─ AppIcons
```

---

## 18. MVP Priority

初期リリースでは以下を最優先にする。

| 優先度 | 対象        | 内容                      |
| --: | --------- | ----------------------- |
|   1 | 写真撮影      | カメラ起動、撮影、プレビュー          |
|   2 | 材料情報入力    | 材料名、区分、数量、単位、案件番号、置場、メモ |
|   3 | ローカル保存    | 端末内保存                   |
|   4 | 記録一覧      | サムネイル付き一覧               |
|   5 | CSV出力     | 共有・ファイル保存               |
|   6 | 記録詳細      | 内容確認、編集、削除              |
|   7 | 設定        | 単位・材料区分などの基本設定          |
|   8 | LiDAR簡易記録 | 将来拡張                    |
|   9 | QR/OCR    | 将来拡張                    |
|  10 | クラウド連携    | 将来拡張                    |

### 初期MVPでやらないこと

* ログイン
* ユーザー管理
* クラウド同期
* AI判定
* 自動数量算出
* 3Dモデル生成
* 複雑な承認ワークフロー
* 多拠点リアルタイム共有

---

## 19. Design Review Checklist

ClaudeDesignまたはClaude Codeで画面を作成した後、以下を確認する。

* [ ] iOSアプリらしい画面になっている
* [ ] 写真撮影が最短操作になっている
* [ ] 材料名、数量、案件番号が見やすい
* [ ] 入力項目が多すぎない
* [ ] 主要ボタンが押しやすい
* [ ] 一覧で写真と材料情報が確認しやすい
* [ ] CSV出力までの導線が分かりやすい
* [ ] 色だけで状態を判断させていない
* [ ] 日本語文言が現場担当者に分かりやすい
* [ ] 初期MVPに不要な機能が混ざっていない
* [ ] Liquid Glassを使いすぎていない
* [ ] 一覧カード全体がGlass化されていない
* [ ] 入力フォームが読みにくくなっていない
* [ ] 写真上のボタンが写真の確認を邪魔していない
* [ ] Reduced Transparency / Increased Contrast / Reduced Motionを考慮している

---

## 20. Liquid Glass Design Policy

Civil Material Photo Loggerは、iOS 26以降のApple新デザイン言語である**Liquid Glass**を採用する。

ただし、本アプリは土木・建設現場で利用する業務アプリであるため、視覚的な美しさよりも以下を優先する。

* 屋外での見やすさ
* 片手操作のしやすさ
* 入力ミスの防止
* 写真・材料名・数量・案件番号の確認性
* CSV出力までの分かりやすさ
* 長時間迷わず使えること

Liquid Glassは、アプリ全体を装飾するためではなく、**操作レイヤーとナビゲーションを分かりやすく浮かせるために使う**。

### 20.1 本アプリでのLiquid Glassの位置付け

```text
主役：写真、材料名、数量、案件番号
脇役：Liquid Glass
役割：操作部品とナビゲーションを分かりやすく浮かせる
```

### 20.2 基本方針

* Liquid Glassは標準コンポーネント優先
* カスタムGlassは必要最小限
* 透明感より可読性を優先
* Regularを基本にする
* Clearは写真上の小さな補助操作に限定
* glass on glassを避ける
* 一覧や入力フォームは通常Surfaceを基本にする

---

## 21. Liquid Glass Usage Principles

## 21.1 Use Liquid Glass For

Liquid Glassを使ってよい対象は以下とする。

| 対象                     | 採用方針      |
| ---------------------- | --------- |
| Tab Bar                | 採用する      |
| Toolbar                | 採用する      |
| Bottom Action Bar      | 採用する      |
| Floating Action Button | 採用する      |
| Search Field           | 採用する      |
| Sheet Background       | 標準挙動を優先する |
| Photo Overlay Controls | 条件付きで採用する |
| LiDAR Scan Overlay     | 条件付きで採用する |
| CSV出力ボタン               | 採用する      |
| 保存ボタン                  | 採用する      |

---

## 21.2 Do Not Use Liquid Glass For

以下にはLiquid Glassを使いすぎない。

| 対象          | 理由                    |
| ----------- | --------------------- |
| 記録一覧カード全体   | 写真・材料情報の可読性が下がるため     |
| 入力フォーム全体    | 入力項目が読みづらくなるため        |
| CSV出力プレビュー  | 表形式データの視認性を優先するため     |
| 長文メモ欄       | 背景透過より文字入力の安定性を優先するため |
| 警告・エラー表示全体  | 重要情報が目立ちにくくなるため       |
| 設定項目一覧全体    | 設定内容が読みにくくなるため        |
| 写真サムネイル一覧全体 | 写真確認の邪魔になるため          |

---

## 22. Liquid Glass Variant Policy

## 22.1 Regular

原則として、Liquid Glassは**Regular**を使う。

用途：

* ツールバー
* 下部操作バー
* 検索
* 主要操作ボタン
* 設定画面のナビゲーション
* 一覧画面のフィルタ操作
* CSV出力ボタン
* 保存ボタン

理由：

* 可読性を確保しやすい
* 背景に応じて見た目が適応しやすい
* 業務アプリに向いている
* 屋外利用でもClearより安全

---

## 22.2 Clear

**Clearは限定利用**とする。

利用してよい場面：

* 写真プレビュー上の小さな操作ボタン
* カメラ画面の補助ボタン
* LiDARスキャン画面の小さな状態表示
* 写真上の再撮影・確認ボタン

利用条件：

* 背景が写真またはカメラ映像である
* 文字やアイコンが十分に太く明るい
* 必要に応じて暗めのDimming Layerを置く
* 長文テキストを載せない
* 操作領域が小さい
* 可読性が確保できる

Clearは見た目が美しい一方で、現場利用では読みにくくなる可能性があるため、初期MVPでは最小限にする。

---

## 22.3 Variant混在禁止

同一画面内でRegularとClearをむやみに混在させない。

例外：

* 写真撮影画面で、下部操作バーはRegular、写真上の小さな補助ボタンはClear
* Record Detail画面で、写真上の操作のみClear

それ以外ではRegularを基本とする。

---

## 23. Glass on Glass Prohibition

Liquid Glassの上に、さらにLiquid Glassを重ねない。

### NG例

* Glassカードの上にGlassボタンを置く
* Glassシートの上にGlass入力欄を重ねる
* Glass一覧カードを並べ、その上にGlassバッジを重ねる
* Glass下部バーの上にGlassメニューを重ねる
* Glass背景の上にGlassフォームを置く

### OK例

* 通常カードの上にGlassの小さな操作ボタンを置く
* 写真の上にGlassの撮影補助ボタンを置く
* 通常フォームの下部にGlassの保存バーを置く
* 通常一覧の上部にGlass検索バーを置く
* 通常詳細画面のツールバーにGlassを使う

### 判断基準

迷った場合は、以下の優先順で判断する。

1. 文字が読めるか
2. 写真が確認できるか
3. 操作対象が分かるか
4. 画面階層が分かるか
5. Liquid Glassが目立ちすぎていないか

---

## 24. iOS App Structure

iOS 26以降では、標準のSwiftUI構造を優先する。

推奨：

* `TabView`
* `NavigationStack`
* `NavigationSplitView`
* `Toolbar`
* `Sheet`
* `Searchable`
* 標準Button
* 標準Picker
* 標準Menu
* 標準Confirmation Dialog
* 標準ShareLink

独自実装よりも、まず標準コンポーネントを使う。

理由：

* Liquid Glassの見た目が自然に反映される
* アクセシビリティ対応を得やすい
* OSアップデートに追従しやすい
* Claude Codeによる実装が安定しやすい
* Xcodeでの検証がしやすい

### 24.1 推奨画面構造

```text
TabView
├─ Home
├─ Records
├─ CSV Export
└─ Settings
```

写真撮影はHomeから開始する。
初期MVPではタブを増やしすぎない。

### 24.2 Navigation方針

```text
HomeView
├─ RecordEditView（Components/PhotoCaptureViewで撮影 → 保存）
├─ RecordListView
│  └─ RecordDetailView（初期MVPは確認のみ。編集は将来拡張）
└─ CSV出力（Share Sheet、画面遷移なしでシート表示）
```

---

## 25. Screen-Level Liquid Glass Policy

## 25.1 Home Screen

採用：

* 下部の主要操作エリアにLiquid Glass
* `写真を撮る`
* `記録一覧`
* `CSV出力`

非採用：

* 画面全体のGlass背景
* カード全体のGlass化

方針：

ホーム画面では、背景は落ち着いた通常背景にし、主要操作だけをLiquid Glassで浮かせる。

---

## 25.2 Photo Capture Screen

採用：

* 撮影ボタン
* 再撮影ボタン
* 次へボタン
* 写真上の小さな補助操作

条件付き採用：

* Clear Liquid Glass

方針：

写真やカメラ映像が主役。Glassは操作ボタンだけに使う。

---

## 25.3 Material Input Screen

採用：

* 下部の保存バー
* ツールバー
* Sheet

非採用：

* 入力フォーム全体のGlass化
* テキストフィールドの過度な透過

方針：

入力画面では可読性を最優先する。Glassは保存操作を目立たせるために使う。

---

## 25.4 Record List Screen

採用：

* 検索バー
* フィルタボタン
* ツールバー
* 下部CSV出力バー

非採用：

* 一覧カード全体のGlass化

方針：

一覧カードは通常の白系Surfaceにする。写真、材料名、数量、案件番号を明確に表示する。

---

## 25.5 Record Detail Screen

採用：

* 写真上の補助操作
* 編集・共有・削除のツールバー
* 下部操作バー

非採用：

* 詳細情報欄全体のGlass化

方針：

写真部分ではLiquid Glassを活かし、情報表示部分は読みやすさを優先する。

---

## 25.6 CSV Export Screen

採用：

* 出力ボタン
* 共有ボタン
* ツールバー

非採用：

* CSVプレビュー表のGlass化

方針：

CSV出力画面は業務確認画面であるため、透明感よりも読みやすさを優先する。

---

## 25.7 Settings Screen

採用：

* Navigation
* Toolbar
* 保存ボタン

非採用：

* 設定リスト全体のGlass化

方針：

設定画面は地味でよい。読みやすさと誤操作防止を優先する。

---

## 26. Liquid Glass Components

## 26.1 Glass Primary Button

用途：

* 写真を撮る
* 保存する
* CSV出力
* 次へ

見た目：

* Liquid Glass Regular
* 必要な場合のみPrimary Tint
* Capsule形状
* 高さ48pt以上
* アイコン + テキスト

文言例：

* `写真を撮る`
* `保存する`
* `CSV出力`
* `次へ`

SwiftUI実装候補：

```swift
Button("保存する", systemImage: "checkmark.circle.fill") {
    // action
}
.buttonStyle(.glassProminent)
.buttonBorderShape(.capsule)
```

---

## 26.2 Glass Secondary Button

用途：

* 一時保存
* 戻る
* 再撮影
* あとで入力

見た目：

* Liquid Glass Regular
* 標準Glass
* 高さ44pt以上
* アイコン + テキスト

SwiftUI実装候補：

```swift
Button("一時保存", systemImage: "tray.and.arrow.down.fill") {
    // action
}
.buttonStyle(.glass)
.buttonBorderShape(.capsule)
```

---

## 26.3 Glass Bottom Action Bar

用途：

* 入力画面の保存操作
* 一覧画面のCSV出力
* 詳細画面の編集・共有

表示例：

```text
[一時保存]        [保存する]
```

ルール：

* 画面下部に固定
* Safe Areaを考慮
* 背景コンテンツと干渉しない
* ボタンは押しやすいサイズにする
* 背景と文字のコントラストを確保する

---

## 26.4 Glass Photo Overlay

用途：

* 写真確認
* 再撮影
* 次へ
* 削除

表示例：

```text
[再撮影]                 [次へ]
```

ルール：

* 写真の重要部分を隠さない
* Clearを使う場合は小さな領域に限定する
* 文字が読みにくい場合はRegularに戻す
* 削除操作は赤系Tintを使う
* 必要に応じて写真側に暗めのDimming Layerを入れる

---

## 26.5 Glass Status Badge

用途：

* 保存済み
* 一時保存
* 未入力あり
* CSV出力済み

表示例：

```text
保存済み
一時保存
未入力あり
CSV出力済み
```

ルール：

* 小さく表示
* 色だけで状態を表現しない
* 必ずテキストを併記する
* 一覧カード上では通常バッジを優先し、Glassは使いすぎない

---

## 26.6 GlassEffectContainer利用方針

複数のGlass部品を連動させる場合のみ、`GlassEffectContainer`を検討する。

利用候補：

* 写真撮影画面の下部操作群
* LiDARスキャン画面の状態表示群
* ホーム画面の主要操作群

利用しない場面：

* 一覧カード
* 入力フォーム
* CSV表
* 長文メモ

---

## 27. Tint Policy

Liquid Glassでは、Tintは意味のある操作に限定する。

| Tint   | 用途            |
| ------ | ------------- |
| Blue   | 保存、次へ、CSV出力   |
| Green  | 写真撮影、スキャン開始   |
| Yellow | 注意、未入力        |
| Red    | 削除、破棄、エラー     |
| Gray   | 戻る、キャンセル、補助操作 |

禁止：

* すべてのボタンをTintする
* 装飾目的だけでTintする
* 複数色を同じ画面で多用する
* 色だけで操作意味を表現する
* 警告色を通常操作に使う

### Tint優先順位

1. 削除・破棄：Red
2. 保存・出力：Blue
3. 写真・スキャン：Green
4. 注意・未入力：Yellow
5. 補助操作：Gray

---

## 28. Liquid Glass Accessibility Policy

Liquid Glass採用時も、以下を必ず守る。

* 文字サイズ変更に対応する
* 色だけで状態を判断させない
* 屋外利用を想定してコントラストを確保する
* Reduced Transparencyに対応する
* Increased Contrastに対応する
* Reduced Motionに対応する
* 重要なボタンは44pt以上にする
* 写真上の操作は背景によって読みにくくならないようにする
* Clearを使う場合は背景を確認する
* 低コントラストになる場合はRegularへ戻す

### 28.1 Reduced Transparency時の方針

Reduced Transparencyが有効な場合は、Glass表現よりも通常Surfaceに近い表示を優先する。

### 28.2 Increased Contrast時の方針

Increased Contrastが有効な場合は、境界線と文字コントラストを強める。

### 28.3 Reduced Motion時の方針

Reduced Motionが有効な場合は、Glassの過度な反応や遷移アニメーションを抑える。

---

## 29. ClaudeDesign Liquid Glass Prompt

ClaudeDesignでLiquid Glass対応画面を作る場合は、以下を追加する。

```text
iOS 26以降のLiquid Glassデザインを採用してください。

ただし、業務用の現場アプリであるため、Liquid Glassはナビゲーション、ツールバー、下部操作バー、写真上の補助操作に限定してください。

一覧カード、入力フォーム、CSVプレビュー表は読みやすさを優先し、過度に透明化しないでください。

Liquid Glassは原則Regularを使い、Clearは写真プレビューやカメラ画面の小さな補助操作だけに限定してください。

glass on glassは避けてください。

SwiftUI標準コンポーネントで実装しやすい画面構成にしてください。

写真、材料名、数量、案件番号を最優先に見せてください。

見た目は新しく、操作は現場向けに分かりやすくしてください。
```

### 29.1 画面別追加指示

#### ホーム画面

```text
ホーム画面では、「写真を撮る」を最も目立たせてください。
下部の主要操作エリアにLiquid Glassを使ってください。
ただし、画面全体をGlass背景にしないでください。
```

#### 写真撮影画面

```text
写真撮影画面では、カメラ映像と撮影ボタンを主役にしてください。
写真上の再撮影、次へ、閉じるなどの小さな補助操作にはLiquid Glassを使ってください。
写真の重要部分を隠さないでください。
```

#### 入力画面

```text
入力画面では、材料名、数量、単位、案件番号を読みやすく配置してください。
入力フォーム全体はGlass化しないでください。
下部の保存バーだけLiquid Glassで浮かせてください。
```

#### 一覧画面

```text
一覧画面では、写真サムネイル、材料名、数量、案件番号を見やすくしてください。
一覧カード全体はGlass化しないでください。
検索バーとフィルタ操作にはLiquid Glassを使ってよいです。
```

---

## 30. Claude Code Implementation Rules

Claude CodeでSwiftUIを実装する場合は、以下を守る。

### 30.1 基本実装ルール

* Xcode 26 SDK以降を前提にする
* SwiftUI標準コンポーネントを優先する
* 独自Glass風エフェクトをCSS風に無理やり再現しない
* 標準のLiquid Glass対応APIを優先する
* 入力フォームは可読性を優先する
* 一覧カードは通常Surfaceを基本にする
* Glass効果は操作レイヤーに限定する
* カスタムGlass部品を複数並べる場合は、同一コンテナで管理する
* Tintは主要操作または警告など意味がある場合のみ使う
* Reduced Transparency / Reduced Motion / Increased Contrastを考慮する

### 30.2 実装してよいもの

* `TabView`
* `NavigationStack`
* `Toolbar`
* `.searchable`
* `.buttonStyle(.glass)`
* `.buttonStyle(.glassProminent)`
* `.glassEffect()`
* `.glassEffect(.regular.tint(...))`
* `.glassEffect(.regular.interactive())`
* `GlassEffectContainer`
* `ShareLink`
* `confirmationDialog`
* `sheet`
* `presentationDetents`

### 30.3 初期MVPで実装しないもの

* ログイン認証
* クラウド同期
* SharePoint連携
* DirectCloud連携
* AI判定
* LiDARによる自動数量算出
* 複雑なダッシュボード
* 承認ワークフロー
* 多人数同時編集
* 管理者Web画面

### 30.4 ファイル分割ルール

SwiftUI部品は以下のように分離する。

```text
Views/
├─ HomeView.swift
├─ RecordEditView.swift
├─ RecordListView.swift
├─ RecordDetailView.swift
├─ SettingsView.swift
└─ Components/
   ├─ AccordionSectionView.swift
   ├─ FormFieldViews.swift
   ├─ PhotoCaptureView.swift
   └─ ActivityShareSheet.swift

Design/
├─ AppColors.swift
├─ AppSpacing.swift
└─ AppIcons.swift

ViewModels/
├─ RecordEditViewModel.swift
└─ RecordListViewModel.swift

Services/
├─ RecordRepository.swift
└─ PhotoStorageService.swift
```

Sources/MaterialLoggerCore（SwiftPM・プラットフォーム非依存ロジック層）に
`MaterialRecord`、`MasterData`、`ValidationService`、`CSVExportService`、
`RecordStore`、`DateFormatterUtil`、`CSVEscaper`を配置する。

### 30.5 Claude Codeへの実装指示例

```text
docs/design-system.mdを必ず参照してください。

Civil Material Photo LoggerのHomeViewをSwiftUIで実装してください。

条件：
- iOS 26以降を前提
- Liquid Glassを下部主要操作に使用
- 画面全体はGlass化しない
- 「写真を撮る」を最も目立たせる
- 日本語UI
- SF Symbolsを使用
- 初期MVP範囲外の機能は追加しない
```

### 30.6 禁止事項

* DesignSystemにない画面を勝手に追加しない
* 初期MVPにないクラウド連携を実装しない
* AI判定機能を勝手に追加しない
* Webダッシュボード風UIにしない
* 入力フォーム全体をGlass化しない
* 一覧カード全体をGlass化しない
* 見た目優先で可読性を落とさない
* 既存ファイル構成を大きく変える場合は、変更理由をコメントに残す

---

## 31. Final Design Direction

Civil Material Photo Loggerは、以下の方向で設計する。

```text
現場で使える業務アプリ
+
iOS 26 Liquid Glassによる現代的な操作感
+
写真・材料・数量・案件番号を主役にした実用UI
```

Liquid Glassは主役ではない。
主役は、現場で記録される写真と材料情報である。

このDesign Systemでは、**見た目は新しく、操作は迷わず、データは後で使いやすい**ことを最優先とする。

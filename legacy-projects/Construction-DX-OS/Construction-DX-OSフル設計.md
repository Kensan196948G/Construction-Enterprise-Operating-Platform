# 建設DX OS フル設計

なお、**2026年4月時点では Debian の現行 stable は Debian 13 “trixie”** で、Debian 12 “bookworm” は旧 stable 側です。Debian公式は production 向けに stable を推奨しており、Debian Live Manual と preseed による自動化導線も公式に整備されています。
したがって、新規設計では **原則 Debian 13 ベース**、ただし業務アプリやドライバ検証の都合で **初期PoCのみ Debian 12.13** を許容、という二段構えが現実的です。 

---

# 建設DX OS フル設計

## 1. プロジェクト定義

**プロジェクト名**
Construction DX OS

**日本語名**
建設DX OS

**リポジトリ名候補**
`construction-dx-os`

**概要**
建設・土木会社向けに最適化した、**Debianベースの業務用デスクトップOS**です。
単なる Linux 配布ではなく、

* 端末標準化
* セキュリティ統制
* IT運用の可視化
* 現場/本社の業務ランチャ統合
* 建設DXアプリ群への導線統一
* 中央管理サーバとの連携

をまとめて実現する **“運用一体型クライアントOS”** とします。

ひとことで言うと、

> **Windows + Intune + 業務ポータル + 端末管理エージェント**
> を、Linux側で現実的に再構成する

という思想です。

---

## 2. 目的

このOSの目的は、単に「Linuxに置き換える」ことではありません。
本当の目的は次の6つです。

### 2-1. 端末の標準化

拠点・支店・現場で端末のばらつきを減らし、
**同じUI、同じ設定、同じアップデート手順**に寄せます。

### 2-2. 建設DXの入口統一

日報、写真、図面、案件、原価、申請、IT申請、ナレッジなどを
バラバラのショートカットではなく、**OS上の業務ハブ**として統一します。

### 2-3. IT運用の可視化

端末ごとの状態を自動収集し、
**資産・稼働・障害予兆・更新状態**を見える化します。

### 2-4. セキュリティ強化

USB、権限昇格、ローカル設定変更、アプリ追加、通信先を制御し、
**現場配布型PCでも統制が効く状態**にします。

### 2-5. オフライン/低速回線への対応

建設現場では回線が不安定なことがあるため、
**一部オフラインでも使える設計**にします。

### 2-6. 自動化基盤

ISO生成、初期設定、登録、更新、監視を自動化し、
**IT部門5名規模でも回せる運用**を目指します。

---

## 3. 想定利用シーン

### 本社

* 見積、案件管理、設計資料閲覧
* Teams/ブラウザ業務
* 文書作成
* 社内申請

### 支店

* 工事案件参照
* 写真整理
* 原価/購買/申請
* 業務ポータル利用

### 建設現場

* 日報入力
* 写真アップロード
* 図面閲覧
* 作業指示確認
* オフラインキャッシュ利用
* 通信復旧後同期

---

## 4. このOSの立ち位置

このOSは「全部入り万能OS」ではありません。
役割は明確に分けます。

### OSが担うもの

* セキュアな業務端末
* 業務ランチャ
* 中央管理連携
* 端末状態収集
* 標準アプリ提供
* 現場向けUX最適化

### OSが担わないもの

* 高度3D CADそのものの開発
* 会計ERPそのものの開発
* 全Microsoft 365完全互換
* 建設業パッケージ全置換

ここを欲張ると、OSプロジェクトが「帝国建設」になります。
OSはあくまで **“土台”**、業務アプリは **“上に載るサービス”** と切り分けるのが成功パターンです。

---

## 5. ベースOS設計

### 5-1. ベースディストリビューション

**Debian 13 stable（trixie）** を推奨ベースとします。
Debian公式は stable を本番利用向けと位置づけており、2026年3月には Debian 13.4 が公開されています。 ([Debian][1])

### 5-2. デスクトップ環境

**XFCE** を標準採用。

理由:

* 軽い
* 安定
* 保守しやすい
* 現場PCでも動きやすい
* 余計な演出が少なく教育しやすい

### 5-3. 端末プロファイル

3種類用意します。

* **Standard Office**

  * 本社/支店向け
  * ブラウザ、文書、表計算、会議、写真整理
* **Field Office**

  * 現場事務所向け
  * オフラインキャッシュ強化
  * カメラ/写真取り込み強化
* **Shared Kiosk**

  * 共用端末向け
  * 制限強め
  * ブラウザ業務中心

---

## 6. OS全体アーキテクチャ

```text
[Construction DX OS Client]
  ├─ Debian 13 Base
  ├─ XFCE Desktop
  ├─ Security Layer
  │   ├─ sudo policy
  │   ├─ AppArmor
  │   ├─ nftables/ufw
  │   ├─ USB control
  │   └─ Patch policy
  ├─ Device Agent
  │   ├─ inventory collection
  │   ├─ health monitor
  │   ├─ login/session log
  │   ├─ app inventory
  │   ├─ update status
  │   └─ policy pull
  ├─ Construction Launcher
  │   ├─ Project Portal
  │   ├─ Daily Report
  │   ├─ Photo Upload
  │   ├─ Drawing Viewer
  │   ├─ IT Request
  │   └─ Knowledge Hub
  ├─ Local Cache
  └─ Update Client

[Central Management Platform]
  ├─ API Server (FastAPI)
  ├─ Web Admin UI
  │   ├─ /admin            (端末一覧・詳細)              [Phase 1 ✅]
  │   └─ /admin/iso-builder (ISO Builder UI: 非同期ビルド) [Phase 2 🆕]
  ├─ build-worker (live-build を専用ホストで非同期実行)   [Phase 2 🆕]
  ├─ PostgreSQL
  ├─ Redis (rate-limit + RQ ジョブキュー)
  ├─ Object Storage (MinIO/S3 — ISO 成果物 + build.log)
  ├─ Policy Engine
  ├─ Package Repository / Update Mirror
  ├─ Reporting / Alerting
  └─ SSO / Identity Integration (OIDC)
```

---

## 7. 標準搭載アプリ構成

### 7-1. ブラウザ

標準は **Microsoft Edge for Business** または Chromium 系。
Microsoft は Edge for Business の Linux 配布を案内しており、Entra ID でのサインインも前提にできます。 ([Microsoft][2])

### 7-2. Office系

**ONLYOFFICE Desktop Editors** を標準候補。
Linux向けデスクトップ版が提供されており、必要要件も比較的軽量です。 ([ONLYOFFICE - Cloud Office Applications][3])

### 7-3. PDF/画像

* PDFビューア
* 画像ビューア
* スキャナ連携
* 写真リネーム/圧縮ツール

### 7-4. ファイル連携

* SMB/CIFS 接続
* SFTP
* WebDAV（必要時）
* オフライン再同期クライアント

### 7-5. 管理/サポート

* リモートサポートクライアント
* ログ収集CLI
* 診断ツール
* 端末自己点検ボタン

---

## 8. Microsoft/SSO連携方針

Linux 向け Microsoft SSO は近年かなり現実的になってきており、Microsoft Learn では **Linux デスクトップでの Entra ID 登録、Intune 登録、デバイスベースの Conditional Access 充足** が案内されています。最近の更新では Linux デバイスの参加やブローカー関連の改善も続いています。 ([Microsoft Learn][4])

このため建設DX OSでは、以下の方針にします。

### 8-1. 認証レベル

* **Phase 1**: ブラウザベースSSO
* **Phase 2**: Linux Entra SSO 統合
* **Phase 3**: 条件付きアクセス連携の強化

### 8-2. 利用方針

* Edge/ブラウザから M365 へSSO
* Teams Web/PWA 利用
* SharePoint/OneDrive はブラウザ中心
* ローカル同期は限定運用

### 8-3. 注意

* Windows と同じ管理体験を期待しすぎない
* 最初から “完全 Windows 互換” を目標にしない
* まずは **業務成立** を優先する

---

## 9. 建設DX専用UX設計

ここがこのOSの“商品価値”です。

### 9-1. 起動画面

ログオン後すぐに **Construction Hub** を開く。

表示項目:

* 今日の案件
* 日報提出状況
* 未同期写真
* 図面更新通知
* ITからのお知らせ
* 端末状態警告

### 9-2. 業務ランチャ

大きいアイコンで以下を表示。

* 📁 案件台帳
* 📝 日報
* 📷 写真アップロード
* 📐 図面閲覧
* 💰 原価/購買
* ✅ 申請/承認
* 📚 ナレッジ
* 🛠 ITサポート
* 🌐 Microsoft 365
* 📣 お知らせ

### 9-3. 現場モード

* タッチしやすいUI
* 文字大きめ
* クリック数削減
* オフライン時はローカル保存
* 復旧後自動同期

### 9-4. 本社モード

* 複数ウィンドウ前提
* 案件検索強化
* 表形式重視
* ショートカット多め

---

## 10. 端末エージェント設計

ここがOSを“製品化”する心臓部です。

### 10-1. エージェント名

`cdx-agent`

### 10-2. 主な役割

* 端末の自動登録
* 資産情報送信
* 性能情報送信
* 更新状態送信
* 利用者/ログオン履歴送信
* ポリシー取得
* 診断レポート生成

### 10-3. 収集項目

#### 基本資産

* device_id
* hostname
* serial
* manufacturer
* model
* CPU
* memory
* disk
* NIC
* MAC
* OS version
* kernel version
* profile type

#### 利用情報

* last_login_user
* last_login_time
* active_session
* locale
* timezone

#### 健全性

* CPU利用率
* メモリ利用率
* ディスク使用率
* 温度（取得可能時）
* バッテリー状態
* ネットワーク疎通
* API到達可否

#### ソフトウェア

* installed packages
* browser version
* office version
* drawing viewer version
* agent version

#### 更新状態

* 最終更新日
* 未適用更新数
* 再起動要否
* 更新リング

### 10-4. 送信方式

* HTTPS REST API
* JSON
* 署名付きトークン
* オフライン時はローカルキュー

### 10-5. systemdサービス

* `cdx-agent.service`
* `cdx-agent.timer`
* `cdx-inventory.service`
* `cdx-health.service`
* `cdx-sync.service`

---

## 11. セキュリティ設計

### 11-1. 権限管理

* 一般ユーザーは sudo 不可
* 管理者グループのみ限定 sudo
* sudo ログを中央収集

### 11-2. USB制御

* 許可デバイスのみ利用
* 大容量ストレージは原則禁止
* 例外承認制

### 11-3. アプリ制御

* 許可済みパッケージのみ
* 任意インストール禁止
* ローカル deb 実行制限

### 11-4. 通信制御

* 社内API
* 公式リポジトリ
* 必須クラウド先
  だけ許可寄りに設計

### 11-5. ログ

* journal
* auth log
* sudo log
* agent log
* update log

### 11-6. 保護機構

* AppArmor
* Firewall
* 自動セキュリティパッチ
* 監査証跡保存

---

## 12. 更新管理設計

### 更新リング

* **Ring 0**: IT検証端末
* **Ring 1**: 本社先行
* **Ring 2**: 支店展開
* **Ring 3**: 現場展開

### 更新対象

* OSパッケージ
* セキュリティ更新
* エージェント
* 業務ランチャ
* 証明書/ポリシー

### 方式

* 社内APTミラー
* 段階配信
* 失敗時ロールバック手順
* 再起動制御

---

## 13. インストール/配布設計

Debian では Live 環境の構築に **live-build**、自動化インストールに **preseed** の考え方が整備されています。公式マニュアルでも ISO hybrid イメージ作成や preseed による自動応答が案内されています。 ([Live Team][5])

### 13-1. 採用方式

**live-build + preseed + カスタム post-install**

### 13-2. 配布物

* `construction-dx-os.iso`
* `preseed.cfg`
* `postinstall.sh`
* `agent-bootstrap.sh`

### 13-3. 初回セットアップ

1. ISO起動
2. 自動インストール
3. 端末名規則適用
4. エージェント登録
5. プロファイル受信
6. 再起動
7. 初回ログオン
8. Construction Hub起動

### 13-4. 🔨 ISO ビルドの操作主体 (Phase 2)

> Phase 2 から `lb build` を **管理 WebUI の ISO Builder UI** から非同期に実行できるようにする。

* IT 担当者は `/admin/iso-builder` で profile (admin/standard/field/kiosk/admin-support) と git_ref を選択して「ビルド開始」を押すだけ
* バックエンド: API → Redis Queue → 専用 build-worker (Linux ホスト) → live-build → MinIO
* 完了通知後、SHA256 付きで ISO + build.log を WebUI からダウンロード
* 操作は全て `iso_build_audit` テーブルに記録される
* 詳細: [docs/07_中央管理基盤/05_ISO-Builder-UI設計](docs/07_中央管理基盤（Central-Platform）/05_ISO-Builder-UI設計（ISO-Builder-UI-Design）.md)

### 13-4. 命名規則

例:

* `HQ-ADM-001`
* `BR07-OPS-014`
* `SITE-2026-023`

---

## 14. 中央管理基盤設計

### 14-1. 構成

* **API**: FastAPI ✅ Phase 1
* **DB**: PostgreSQL ✅ Phase 1
* **キャッシュ / キュー**: Redis (rate-limit ✅ / RQ for ISO Builder 🔜 Phase 2)
* **WebUI**: Jinja2 SSR (`/admin`) ✅ Phase 1 / React 拡張は Phase 3+
* **オブジェクト保存**: MinIO/S3互換 (🔜 Phase 2 — ISO 成果物保管)
* **認証**: HTTP Basic / OIDC (Entra ID 連携可) ✅ Phase 1
* **build-worker**: live-build を専用 Linux ホストで実行 (🔜 Phase 2)

### 14-2. 主な機能

* 端末一覧 ✅
* 端末詳細 ✅
* policy 配布 ✅
* 🆕 **ISO ビルド (WebUI からの非同期実行 + ダウンロード)** 🔜 Phase 2
* 更新状況 🔜 Phase 2
* アラート 🔜 Phase 3
* ハード資産台帳 🔜 Phase 2
* 利用者台帳 🔜 Phase 2
* ソフトウェア配布 🔜 Phase 3
* レポート出力 🔜 Phase 3
* 操作ログ監査 (ISO ビルド監査含む) 🔜 Phase 2/3

### 14-3. 主要画面

* ダッシュボード ✅
* 端末管理 ✅
* 🆕 **ISO Builder (`/admin/iso-builder`)** 🔜 Phase 2
* 利用者管理 🔜
* ソフトウェア配布 🔜
* 更新リング管理 🔜
* アラートセンター 🔜
* ログ検索 🔜
* 申請承認 🔜
* 現場稼働状況マップ 🔜

---

## 15. データモデル

### master

* users
* devices
* offices
* sites
* policies
* packages
* profiles

### transaction

* device_heartbeats
* login_history
* update_status
* hardware_inventory_snapshots
* software_inventory_snapshots
* alerts
* sync_jobs
* audit_logs
* 🆕 **iso_build_jobs** *(Phase 2 — Issue 0024)*
* 🆕 **iso_build_audit** *(Phase 2 — Issue 0024)*

### construction extension

* projects
* daily_reports
* photo_sync_jobs
* drawing_versions
* field_announcements

---

## 16. 建設業務モジュールの載せ方

OS内に全部作り込むのではなく、**OS上から起動する業務モジュール群**にします。

### 16-1. コア業務

* 工事案件台帳
* 日報
* 写真/資料
* 図面閲覧
* 原価/工数
* 安全/品質
* ナレッジ

### 16-2. 提供形態

* Webアプリ
* PWA
* ローカルラッパー
* 一部ネイティブ補助ツール

### 16-3. OS側の責務

* シングルサインオン導線
* キャッシュ
* ファイル受け渡し
* 通知
* 既定アプリ連携

---

## 17. オフライン設計

現場では「ネットがある前提」で設計すると負けます。

### 方針

* ローカルキュー保存
* 画像圧縮後に後送
* メタデータ先行送信
* 競合時は最新版/承認済み優先
* 図面は必要分のみ事前キャッシュ

### オフライン対象

* 日報下書き
* 写真一時保管
* 案件基本情報
* 当日作業指示
* 直近図面一覧

---

## 18. リポジトリ構成案

```text
construction-dx-os/
├─ README.md
├─ docs/
│  ├─ architecture/
│  ├─ security/
│  ├─ operations/
│  ├─ field-mode/
│  └─ rollout/
├─ build/
│  ├─ live-build/
│  ├─ preseed/
│  ├─ iso-hooks/
│  └─ ci/
├─ os/
│  ├─ packages/
│  ├─ themes/
│  ├─ launcher/
│  ├─ policies/
│  └─ systemd/
├─ agent/
│  ├─ cdx-agent/
│  ├─ collectors/
│  ├─ sync/
│  └─ tests/
├─ server/
│  ├─ api/
│  ├─ webui/
│  ├─ migrations/
│  └─ workers/
├─ deployment/
│  ├─ docker/
│  ├─ k8s/
│  └─ ansible/
└─ scripts/
   ├─ build-iso.sh
   ├─ enroll-device.sh
   ├─ collect-diagnostics.sh
   └─ rollback-update.sh
```

---

## 19. 役割分担

### OSチーム

* ISO
* パッケージ
* systemd
* セキュリティ
* 配布

### エージェントチーム

* 収集
* 同期
* 監視
* 診断

### サーバチーム

* API
* WebUI
* DB
* レポート
* 通知

### 業務チーム

* 案件台帳
* 日報
* 写真
* 図面
* 原価

---

## 20. 開発優先順位

### Phase 0: PoC

* DebianベースISO
* XFCE
* 業務ランチャ
* 最小エージェント
* 中央WebUI最小版

### Phase 1: 社内試験

* 端末登録
* インベントリ収集
* 更新管理
* SMB接続
* SSO導線

### Phase 2: 建設現場対応

* オフライン
* 写真同期
* 図面配布
* 現場通知
* 帯域制御

### Phase 3: 本格展開

* リング配布
* レポート
* 監査ログ
* 申請承認
* ITSM連携

### Phase 4: 高度化

* 自己診断
* 予兆検知
* 自動修復
* 端末ライフサイクル管理

---

## 21. 非機能要件

### 可用性

* API稼働率 99.9%
* 現場オフライン継続利用可

### 性能

* ログオン後30秒以内に業務利用開始
* ハートビート送信1分以内
* 管理UI一覧表示3秒以内

### セキュリティ

* 全通信TLS
* 監査ログ保存
* 管理者操作追跡
* パッケージ署名確認

### 運用性

* IT部門5名で回せること
* 端末キッティング30分以内
* 障害切り分け5分以内着手

---

## 22. リスクと回避策

### リスク1: ユーザーがWindows感覚を期待する

**回避**
見た目を寄せるより、業務入口を統一する。
「OSの違い」より「仕事ができる」ことを先に作る。

### リスク2: CADや周辺機器互換で詰まる

**回避**
CADはOSコア要件にしない。
まずは閲覧・配布・図面管理から始める。

### リスク3: Microsoft連携に期待しすぎる

**回避**
最初はブラウザ/PWA中心。
ネイティブ完全統合は後段。

### リスク4: 現場回線が弱い

**回避**
同期設計を最優先。
画像圧縮・再送・夜間同期を前提化。

---

## 23. 最終推奨スタック

### クライアント

* Debian 13
* XFCE
* Edge for Business
* ONLYOFFICE
* AppArmor
* nftables/ufw
* systemd timers
* cdx-agent

### サーバ

* FastAPI
* PostgreSQL
* Redis
* MinIO
* Nginx
* Docker
* Prometheus/Grafana
* Loki

### 配布

* live-build
* preseed
* 社内APTミラー
* ISO自動ビルドCI

---

## 24. けんさん向けの最適な結論

けんさんの環境だと、このOSは特に相性がいいです。

理由は単純で、

* CLI前提で運用できる
* 自動化しやすい
* 中央管理と相性が良い
* エージェント設計を活かせる
* 建設業務ポータルをOSに密着させられる
* IT運用と建設DXを一つの思想でまとめられる

からです。

つまりこれは
**「Linuxを作る」話ではなく、建設会社の標準クライアント基盤を作る」話**です。
ここまで落とし込めると、かなり強いです。OSが主役ではなく、**運用標準化の器**になります。

---

## 25. まず着手すべき最初の一歩

最初にやるべきはこの順です。

1. **PoC版の要件固定**
2. **Debian 13 + XFCE の最小ISO設計**
3. **業務ランチャ画面のモック作成**
4. **cdx-agent 最小版**
5. **中央WebUI 最小版**
6. **1拠点・数台で試験**

いきなり全部は作らず、
**“OS本体 + エージェント + 管理UI” の3点セット**から始めるのが正解です。

必要なら次に続けて、
**README.md完全版**、**詳細要件定義書.md**、**repo初期構成**、**live-build構成案**、**cdx-agent仕様書** までそのまま作れます。



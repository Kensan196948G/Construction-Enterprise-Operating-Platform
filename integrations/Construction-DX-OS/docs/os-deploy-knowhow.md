# OS展開デプロイ ノウハウ全集

> Construction DX OS プロジェクトで確立した OS 展開・管理ノウハウをすべて記録したファイルです。  
> 他システム・他リポジトリへそのまま適用できます。  
> 最終更新: 2026-05-14

---

## 目次

1. [展開フロー全体像](#1-展開フロー全体像)
2. [ADドメイン設定](#2-adドメイン設定)
3. [展開プロファイル定義](#3-展開プロファイル定義)
4. [ホスト名規則・シリアル番号体系](#4-ホスト名規則シリアル番号体系)
5. [展開台帳 CSV フォーマット](#5-展開台帳-csv-フォーマット)
6. [シリアル番号OCRパイプライン](#6-シリアル番号ocrパイプライン)
7. [更新リング管理](#7-更新リング管理)
8. [配布アプリカタログ](#8-配布アプリカタログ)
9. [ファイルサーバー連携 (GMSV0002)](#9-ファイルサーバー連携-gmsv0002)
10. [ADユーザー一覧（参照用）](#10-adユーザー一覧参照用)
11. [セキュリティ設計原則](#11-セキュリティ設計原則)

---

## 1. 展開フロー全体像

```
① OS・認証設定       プロファイル（standard / field / kiosk）ごとに設定
        ↓
② 展開台帳登録       serial_number + hostname + ADユーザーを CSV または OCR で一括登録
        ↓
③ 配布アプリ選択     プロファイルに紐付いたアプリカタログから選択 → ISO に組み込み
        ↓
④ ISO 配布           Debian preseed.cfg 自動生成 → USB / PXE で配布
        ↓
⑤ PXE 展開          ネットワークブート展開 → ホスト名自動設定 → AD 参加
        ↓
⑥ 更新リング管理     Ring 0 → Ring 1 → Ring 2 → Ring 3 で段階ロールアウト
        ↓
⑦ 展開確認           cdx-agent ハートビート監視 → 台帳ステータス更新
```

---

## 2. ADドメイン設定

### グローバルドメイン設定（全プロファイル共通デフォルト）

| 項目 | 値 |
|---|---|
| DNS ドメイン名 | `mirai.local` |
| NetBIOS 名 | `MIRAI` |
| Kerberos レルム | `MIRAI.LOCAL` |
| LDAP ベース DN | `DC=mirai,DC=local` |
| プライマリ DC ホスト名 | `VMSV3001` |
| セカンダリ DC | （未設定） |
| ドメイン参加 SVC アカウント | `svc-domainjoin` |
| ログイン形式 | `sam`（sAMAccountName = 社員番号） |
| ADユーザー同期間隔 | 60 分 |

### OU 構造

```
DC=mirai,DC=local
├── OU=Workstations
│   ├── OU=Standard       ← 標準PC (standard プロファイル)
│   └── OU=Field          ← 現場PC (field プロファイル)
└── OU=Users
    ├── OU=本社
    ├── OU=大阪支店
    ├── OU=名古屋支店
    ├── OU=福岡支店
    ├── OU=川崎現場
    ├── OU=横浜現場
    └── ...
```

### preseed.cfg 生成ロジック（Debian AD 参加）

```bash
# 展開後 late_command で実行
apt-get install -y realmd sssd sssd-tools
realm join \
  --user=svc-domainjoin \
  --computer-ou="<adOuPath>" \
  mirai.local
```

### ADユーザー参照設定

| 項目 | 値 |
|---|---|
| 接続ホスト | `VMSV3001` |
| 接続ユーザー | `administrator`（UIからの参照時） |
| **推奨サービスアカウント** | `CN=svc-ldapread,DC=mirai,DC=local`（読み取り専用） |
| 検索属性 | CN（氏名）+ sAMAccountName（社員番号） |

> ⚠️ **セキュリティ原則**: ADクエリには Domain Admin ではなく `svc-ldapread` などの読み取り専用サービスアカウントを使用する。パスワードはソースコードに記録しない。

---

## 3. 展開プロファイル定義

### standard プロファイル（本社・支店の一般事務 PC）

```json
{
  "defaultUser": "cdxuser",
  "passwordPolicy": "force_change",
  "autoLogin": false,
  "adJoin": true,
  "adDomain": "mirai.local",
  "adDcHost": "VMSV3001",
  "adJoinUser": "svc-domainjoin",
  "adOuPath": "OU=Workstations,OU=Standard,DC=mirai,DC=local",
  "hostnamePrefix": "CDX-HQ-",
  "locale": "ja_JP.UTF-8",
  "timezone": "Asia/Tokyo",
  "keyboard": "jp"
}
```

### field プロファイル（工事現場・屋外 PC）

```json
{
  "defaultUser": "cdxfield",
  "passwordPolicy": "force_change",
  "autoLogin": false,
  "adJoin": true,
  "adDomain": "mirai.local",
  "adDcHost": "VMSV3001",
  "adJoinUser": "svc-domainjoin",
  "adOuPath": "OU=Workstations,OU=Field,DC=mirai,DC=local",
  "hostnamePrefix": "CDX-FLD-",
  "locale": "ja_JP.UTF-8",
  "timezone": "Asia/Tokyo",
  "keyboard": "jp"
}
```

### kiosk プロファイル（受付・共用端末）

```json
{
  "defaultUser": "kiosk",
  "passwordPolicy": "fixed",
  "autoLogin": true,
  "adJoin": false,
  "adDomain": "",
  "adOuPath": "",
  "hostnamePrefix": "CDX-KSK-",
  "locale": "ja_JP.UTF-8",
  "timezone": "Asia/Tokyo",
  "keyboard": "jp"
}
```

---

## 4. ホスト名規則・シリアル番号体系

### ホスト名命名規則

```
{プレフィックス}{拠点コード}-{連番 3 桁}
```

| プロファイル | プレフィックス | 例 |
|---|---|---|
| standard (本社) | `CDX-HQ-` | `CDX-HQ-001` ～ `CDX-HQ-999` |
| standard (支店) | `CDX-BR-` | `CDX-BR-010` ～ |
| field | `CDX-FLD-` | `CDX-FLD-101` ～ |
| kiosk | `CDX-KSK-` | `CDX-KSK-201` ～ |

### シリアル番号体系

```
SN-{拠点コード}-{6 桁数字}
```

| 拠点 | コード | 例 |
|---|---|---|
| 本社（新宿） | `HQ` | `SN-HQ-001001` |
| 支店（大阪等） | `BR` | `SN-BR-002001` |
| 現場 | `FLD` | `SN-FLD-003001` |
| キオスク | `KSK` | `SN-KSK-004001` |

### 実際の端末データ例

| 端末ID | シリアル番号 | プロファイル | 設置場所 | リング |
|---|---|---|---|---|
| CDX-HQ-001 | SN-HQ-001001 | standard | 新宿本社 | Ring 1 |
| CDX-HQ-002 | SN-HQ-001002 | standard | 新宿本社 | Ring 1 |
| CDX-HQ-003 | SN-HQ-001003 | standard | 新宿本社 | Ring 2 |
| CDX-BR-010 | SN-BR-002001 | standard | 大阪支店 | Ring 2 |
| CDX-BR-011 | SN-BR-002002 | standard | 大阪支店 | Ring 2 |
| CDX-FLD-101 | SN-FLD-003001 | field | 川崎現場A | Ring 2 |
| CDX-FLD-102 | SN-FLD-003002 | field | 横浜現場B | Ring 1 |
| CDX-FLD-103 | SN-FLD-003003 | field | 千葉現場C | Ring 3 |
| CDX-KSK-201 | SN-KSK-004001 | kiosk | 名古屋支店 | Ring 3 |
| CDX-KSK-202 | SN-KSK-004002 | kiosk | 福岡支店 | Ring 3 |

---

## 5. 展開台帳 CSV フォーマット

### ヘッダー定義

```
serial_number,hostname,profile,ou,ad_user_sam,ad_user_cn,location,notes
```

| カラム | 説明 | 必須 | 例 |
|---|---|---|---|
| `serial_number` | 機器シリアル番号 | ✅ | `SN-HQ-001001` |
| `hostname` | 展開後ホスト名 | ✅ | `CDX-HQ-001` |
| `profile` | プロファイル種別 | ✅ | `standard` / `field` / `kiosk` |
| `ou` | AD 参加先 OU パス (LDAP 形式) | - | `OU=Workstations,OU=Standard,DC=mirai,DC=local` |
| `ad_user_sam` | 割り当てADユーザー社員番号 | - | `T001` |
| `ad_user_cn` | 割り当てADユーザー氏名 | - | `田中 太郎` |
| `location` | 設置場所 | - | `新宿本社` |
| `notes` | 備考 | - | `本社1F-A棟` |

### サンプルデータ

```csv
serial_number,hostname,profile,ou,ad_user_sam,ad_user_cn,location,notes
SN-HQ-001001,CDX-HQ-001,standard,"OU=Workstations,OU=Standard,DC=mirai,DC=local",T001,田中 太郎,新宿本社,本社1F-A棟
SN-HQ-001002,CDX-HQ-002,standard,"OU=Workstations,OU=Standard,DC=mirai,DC=local",T002,鈴木 花子,新宿本社,本社1F-B棟
SN-FLD-002001,CDX-FLD-001,field,"OU=Workstations,OU=Field,DC=mirai,DC=local",T010,吉田 浩二,川崎現場A,
SN-FLD-002002,CDX-FLD-002,field,"OU=Workstations,OU=Field,DC=mirai,DC=local",T005,伊藤 美咲,横浜現場B,
SN-KSK-003001,CDX-KSK-001,kiosk,,,,名古屋支店,受付ロビー
```

### エクスポート種別

| エクスポート種別 | ファイル名パターン | 用途 |
|---|---|---|
| 全台帳エクスポート | `cdx-deploy-register-YYYY-MM-DD.csv` | バックアップ・全件確認 |
| シリアル↔ホスト名 紐付け台帳 | `cdx-serial-hostname-YYYY-MM-DD.csv` | 資産管理・棚卸し |
| ADユーザー割り当て台帳 | `cdx-ad-user-assign-YYYY-MM-DD.csv` | AD管理・アカウント紐付け |

---

## 6. シリアル番号OCRパイプライン

### フロー

```
📱 iPhone 撮影
    ↓ iOS Files アプリ → SMB 転送
📂 GMSV0002 共有フォルダ (//GMSV0002/cdx-serial-scans)
    ↓ SMB マウント (Linux: /mnt/gmsv0002-serial / Windows: //GMSV0002/cdx-serial-scans)
🔍 easyocr OCR 処理
    ↓ POST /api/v1/serial/scan
📋 取り込みキュー → ホスト名確定
    ↓ POST /api/v1/serial/confirm/{id}
✅ 展開台帳登録
```

### 対応画像形式

| 拡張子 | 説明 |
|---|---|
| `.jpg` / `.jpeg` | JPEG（最も一般的） |
| `.png` | PNG |
| `.heic` | **iPhone カメラ標準形式**（iOS 11以降） |
| `.bmp` | BMP |
| `.tiff` | TIFF |

### HEIC 変換ロジック（Python）

```python
def _prepare_image_for_ocr(image_path: Path) -> tuple[Path, bool]:
    if image_path.suffix.lower() != ".heic":
        return image_path, False
    # pillow-heif で HEIC → JPEG 一時変換
    from pillow_heif import register_heif_opener
    register_heif_opener()
    from PIL import Image
    img = Image.open(image_path)
    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    img.save(tmp.name, "JPEG")
    return Path(tmp.name), True  # caller must unlink tmp
```

### easyocr シリアル番号フィルタリング条件

```python
candidates = [
    t.strip() for t in results
    if 6 <= len(t.strip()) <= 20              # 6〜20 文字
    and all(c.isalnum() or c in "-_" for c in t.strip())  # 英数字 + ハイフン/アンダースコアのみ
]
```

### 環境変数

| 変数名 | デフォルト | 説明 |
|---|---|---|
| `SERIAL_SCAN_PATH` | `/mnt/gmsv0002-serial` | スキャンフォルダパス |
| `SERIAL_SCAN_MOCK` | `1` | `1` = モック（実OCR不要）、`0` = 本番 |

### Pythonパッケージ（本番のみ）

```bash
pip install easyocr        # OCR エンジン（PyTorch 含む、約500MB）
pip install pillow-heif    # HEIC 対応（manylinux wheel、libheif 同梱）
# または一括インストール（pyproject.toml [ocr] extras）
pip install ".[ocr]"
```

### SMB マウント設定

**Linux（/etc/fstab）**
```
//GMSV0002/cdx-serial-scans /mnt/gmsv0002-serial \
  cifs credentials=/etc/cdx-smb.creds,uid=www-data,gid=www-data,ro,_netdev 0 0
```

**Linux（/etc/cdx-smb.creds）** — chmod 600 必須
```
username=<サービスアカウント名>
password=<パスワード>
domain=MIRAI
```

**Windows（ドメイン参加済み）** — 設定不要
```powershell
# Kerberos 認証で自動接続
# SERIAL_SCAN_PATH=//GMSV0002/cdx-serial-scans
Test-Path \\GMSV0002\cdx-serial-scans  # True になれば OK
```

**Windows（ドライブ割り当て）**
```powershell
net use Z: \\GMSV0002\cdx-serial-scans /persistent:yes
# SERIAL_SCAN_PATH=Z:/cdx-serial-scans
```

---

## 7. 更新リング管理

### リング定義

| リング | 対象 | 台数目安 | 用途 |
|---|---|---|---|
| **Ring 0 (Canary)** | 開発検証環境 | 0〜2台 | 新版を最初にテスト |
| **Ring 1 (早期検証)** | IT部門端末 | 3台 | 本番前の早期検証 |
| **Ring 2 (標準展開)** | 一般端末 | 4台〜 | 検証済み版を展開 |
| **Ring 3 (安定運用)** | 現場・共用端末 | 3台〜 | 最も安定した版 |

### 自動昇格ルール

```json
{
  "errorRateMax": 0,
  "hbSuccessMin": 100,
  "stableHours": 24,
  "approvalRequired": {
    "Ring 0": false,
    "Ring 1": false,
    "Ring 2": true,
    "Ring 3": true
  }
}
```

### 展開フロー例（cdx-agent 0.2.0 の場合）

```
Ring 0  → Ring 1  (自動昇格、エラー0 + 24h安定)
Ring 1  → Ring 2  (自動昇格、エラー0 + 24h安定)
Ring 2  → Ring 3  (承認必要 → 承認後展開)
```

### ロールバックパターン

| パターン | 対象 | 手順 |
|---|---|---|
| 単一端末ロールバック | 特定の1台 | 端末管理 → 個別ロールバック |
| プロファイルロールバック | 特定プロファイル全端末 | リング管理 → プロファイル選択 → ロールバック |
| リングロールバック | リング全体 | リング管理 → リング選択 → ロールバック |
| 緊急全台ロールバック | 全端末 | 緊急ロールバック → 全リング同時 |

---

## 8. 配布アプリカタログ

### ビジネス (Business)

| アプリ名 | パッケージ | インストール方法 | サイズ | 推奨 | 対応プロファイル |
|---|---|---|---|---|---|
| LibreOffice 7.6 | `libreoffice` | apt | 350 MB | ✅ | standard, field |
| Firefox ESR | `firefox-esr` | apt | 70 MB | ✅ | standard, field, kiosk |
| Thunderbird 115 | `thunderbird` | apt | 80 MB | - | standard |
| Evince (PDF Viewer) | `evince` | apt | 20 MB | ✅ | standard, field, kiosk |

### 建設・CAD (Construction)

| アプリ名 | パッケージ | インストール方法 | サイズ | 推奨 | 対応プロファイル |
|---|---|---|---|---|---|
| QGIS 3.x | `qgis` | apt | 450 MB | ✅ | field |
| FreeCAD 0.21 | `freecad` | apt | 300 MB | - | standard, field |
| Inkscape 1.3 | `inkscape` | apt | 200 MB | - | standard |
| GIMP 2.10 | `gimp` | apt | 120 MB | - | standard, field |
| Jw_cad (Wine経由) | `wine jwcad` | wine | 50 MB | ✅ | standard, field |

### ユーティリティ (Utility)

| アプリ名 | パッケージ | インストール方法 | サイズ | 推奨 | 対応プロファイル |
|---|---|---|---|---|---|
| Remmina | `remmina` | apt | 40 MB | ✅ | standard |
| VLC 3.x | `vlc` | apt | 120 MB | - | standard, field |
| Timeshift | `timeshift` | apt | 30 MB | - | standard |
| GParted | `gparted` | apt | 20 MB | - | standard |

### セキュリティ (Security)

| アプリ名 | パッケージ | インストール方法 | サイズ | 推奨 | 対応プロファイル |
|---|---|---|---|---|---|
| ClamAV + ClamTk | `clamav clamtk` | apt | 200 MB | ✅ | standard, field, kiosk |
| KeePassXC 2.7 | `keepassxc` | apt | 80 MB | ✅ | standard |
| VeraCrypt 1.26 | `veracrypt` | deb | 60 MB | - | standard, field |

### コミュニケーション (Communication)

| アプリ名 | パッケージ | インストール方法 | サイズ | 推奨 | 対応プロファイル |
|---|---|---|---|---|---|
| Zoom 6.x | `zoom` | deb | 150 MB | ✅ | standard, field |
| Microsoft Teams (Flatpak) | `com.microsoft.Teams` | flatpak | 200 MB | - | standard |
| Slack Desktop | `slack` | deb | 180 MB | - | standard |

### 推奨アプリ合計（推奨のみ選択時）

```
LibreOffice 350MB + Firefox 70MB + Evince 20MB
+ QGIS 450MB + Jw_cad 50MB
+ Remmina 40MB + ClamAV 200MB + KeePassXC 80MB + Zoom 150MB
= 約 1,410 MB
```

---

## 9. ファイルサーバー連携 (GMSV0002)

### サーバー情報

| 項目 | 値 |
|---|---|
| ホスト名 | `GMSV0002` |
| 共有フォルダ | `cdx-serial-scans` |
| UNC パス | `\\GMSV0002\cdx-serial-scans` |
| 用途 | iPhone で撮影したシリアル番号画像の一時置き場 |

### iPhone → GMSV0002 転送手順

1. iPhone 設定 → カメラ → フォーマット → **「互換性優先」**（JPEGで撮影）
   ※ または HEIC のまま転送（cdx-server 側で自動変換）
2. iPhone「ファイル」アプリ → 右上「…」→「サーバーに接続」
3. `smb://GMSV0002` → ユーザー名・パスワード入力（MIRAI ドメイン資格情報）
4. `cdx-serial-scans` フォルダに写真を保存

### API エンドポイント一覧

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/v1/serial/status` | マウント状態・保留画像数・キューサイズ |
| `POST` | `/api/v1/serial/scan` | SERIAL_SCAN_PATH の画像を OCR してキューへ |
| `GET` | `/api/v1/serial/queue` | OCR キュー一覧 |
| `POST` | `/api/v1/serial/confirm/{id}` | シリアル番号 + ホスト名を確定 → 台帳登録 |
| `DELETE` | `/api/v1/serial/queue/{id}` | アイテムを廃棄（重複・読取不能） |

### confirm リクエスト Body

```json
{
  "serial_number": "SN-HQ-005001",
  "hostname": "CDX-HQ-005",
  "profile": "standard",
  "location": "新宿本社",
  "notes": ""
}
```

---

## 10. ADユーザー一覧（参照用）

| 社員番号 (SAM) | 氏名 (CN) | 部署 | 役職 | OU | 有効 |
|---|---|---|---|---|---|
| T001 | 田中 太郎 | 工事部 | 工事部長 | 本社 | ✅ |
| T002 | 鈴木 花子 | 総務部 | 総務課長 | 本社 | ✅ |
| T003 | 山田 次郎 | 営業部 | 営業担当 | 大阪支店 | ✅ |
| T004 | 佐藤 三郎 | 設計部 | 主任設計士 | 本社 | ✅ |
| T005 | 伊藤 美咲 | 施工管理部 | 現場監督 | 名古屋支店 | ✅ |
| T006 | 渡辺 健一 | 施工管理部 | 施工主任 | 大阪支店 | ✅ |
| T007 | 中村 由美 | 経理部 | 経理担当 | 本社 | ✅ |
| T008 | 小林 正道 | 工事部 | 現場担当 | 福岡支店 | ✅ |
| T009 | 加藤 裕子 | 人事部 | 人事担当 | 本社 | ✅ |
| T010 | 吉田 浩二 | 施工管理部 | 現場監督 | 川崎現場 | ✅ |
| T011 | 松本 聡 | 設計部 | CADオペレーター | 大阪支店 | ✅ |
| T012 | 井上 拓也 | 工事部 | 現場担当 | 横浜現場 | ❌ (無効) |
| T013 | 木村 美穂 | 総務部 | 受付 | 本社 | ✅ |
| T014 | 林 大輔 | 営業部 | 営業課長 | 名古屋支店 | ✅ |
| T015 | 清水 智子 | 経理部 | 経理課長 | 本社 | ✅ |

メールアドレス形式: `{社員番号小文字}@mirai.local` （例: `t001@mirai.local`）

---

## 11. セキュリティ設計原則

### 認証・認可

| 原則 | 内容 |
|---|---|
| 管理API認証 | cdx-server ログインユーザーのみ（Basic Auth または OIDC） |
| SMB アクセス制限 | cdx-server にログインできるユーザーのみ SMB マウント可能 |
| AD クエリ | Domain Admin 禁止 → `svc-ldapread` などの読み取り専用 SVC アカウント使用 |
| パスワード管理 | ソースコードへの記録禁止。Linux: `/etc/cdx-smb.creds`（chmod 600）、Windows: 資格情報マネージャー |

### ユーザーロール定義

| ロール | 権限 |
|---|---|
| admin（管理者） | 全機能フルアクセス、ユーザー管理、設定変更、メンテナンスモード |
| operator（オペレーター） | 端末管理・ISO配布・リング管理の操作。設定変更不可 |
| viewer（閲覧者） | 全画面の閲覧のみ。操作・変更不可 |

### 展開時のセキュリティチェック

- [ ] ドメイン参加 SVC アカウントパスワードは展開後に変更済み
- [ ] kiosk プロファイルは AD 未参加（ドメイン資格情報不要）
- [ ] AppArmor 有効化確認（デプロイ後ハートビートで監視）
- [ ] ClamAV 定義ファイル更新確認

---

*このファイルは Construction DX OS (https://github.com/Kensan196948G/Construction-DX-OS) から抽出したノウハウです。*  
*Windows Deploy Management System など他システムへそのまま適用可能です。*

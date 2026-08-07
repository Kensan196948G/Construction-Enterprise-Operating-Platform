# Construction DX OS — Windows 11 Pro セットアップガイド

> **対象**: Linux から Windows 11 Pro 機器へ移行する管理者  
> **前提**: Git clone 済み、Python 3.11+ インストール済み

---

## 1. 動作確認済み構成

| 項目 | 推奨 |
|---|---|
| OS | Windows 11 Pro (22H2 以降) |
| Python | 3.11 or 3.12 (Microsoft Store または python.org) |
| Git | 2.44+ |
| Docker Desktop | 4.28+ (WSL2 バックエンド) — オプション |
| ドメイン参加 | mirai.local 参加推奨 (SMB 認証が自動化) |

---

## 2. インストール手順

```powershell
# 1. リポジトリ取得
git clone https://github.com/Kensan196948G/Construction-DX-OS.git
cd Construction-DX-OS\server\api

# 2. 仮想環境作成
python -m venv .venv
.venv\Scripts\Activate.ps1

# 3. 基本依存関係インストール
pip install .

# 4. OCR依存関係インストール（シリアル番号スキャン機能を使う場合）
pip install ".[ocr]"
# → easyocr (PyTorch含む) + pillow-heif (HEIC/iPhone対応) が自動インストール
```

---

## 3. 環境変数設定 (.env)

```powershell
# .env.example をコピー
copy .env.example .env
```

`.env` を開いて以下を設定:

```dotenv
# シリアル番号スキャン設定
SERIAL_SCAN_MOCK=0

# GMSV0002 SMB設定 — Windows版
# ① ドメイン参加済みPC（mirai.local）: UNCパスを直接指定（認証設定不要）
SERIAL_SCAN_PATH=//GMSV0002/cdx-serial-scans

# ② ドライブレター割り当て済みの場合
# SERIAL_SCAN_PATH=Z:/cdx-serial-scans
```

---

## 4. GMSV0002 SMB接続

### パターンA: ドメイン参加済みPC（推奨・設定不要）

`mirai.local` に参加したWindows PCからは、Kerberos認証でSMB共有に自動接続されます。
**追加の認証設定は不要**です。

```powershell
# 接続確認
Test-Path \\GMSV0002\cdx-serial-scans
# → True が返れば OK
```

### パターンB: ドライブレター割り当て

```powershell
# ドライブ割り当て（再起動後も永続）
net use Z: \\GMSV0002\cdx-serial-scans /persistent:yes

# .env に設定
# SERIAL_SCAN_PATH=Z:/cdx-serial-scans
```

### パターンC: ドメイン未参加PC（資格情報指定）

```powershell
net use \\GMSV0002\cdx-serial-scans /user:MIRAI\cdxadmin
# パスワード入力後、永続化するか確認
net use Z: \\GMSV0002\cdx-serial-scans /persistent:yes
```

> Linux の `/etc/cdx-smb.creds` に相当する設定は Windows では不要です（Windows 資格情報マネージャーが管理します）。

---

## 5. cdx-server 起動

```powershell
# 仮想環境が有効な状態で
uvicorn cdx_server.app:app --host 0.0.0.0 --port 8300 --reload

# または
python -m cdx_server
```

Admin SPA にアクセス: http://localhost:8300/admin-spa/

---

## 6. Docker Desktop を使う場合 (WSL2)

Docker Desktop 4.28+ + WSL2 バックエンドがインストール済みであれば、Linux 版と同じ `docker-compose.prod.yml` がそのまま動作します。

```powershell
# SMBドライブをDockerに渡す場合
# 1. まずWindowsでドライブ割り当て
net use Z: \\GMSV0002\cdx-serial-scans /persistent:yes

# 2. docker-compose.override.yml を作成
# volumes:
#   - Z:/cdx-serial-scans:/mnt/gmsv0002-serial:ro

# 3. 起動
docker compose -f docker-compose.prod.yml -f docker-compose.override.yml up -d
```

---

## 7. Windows Deploy Management System との統合

[Windows-Deploy-Management-System](https://github.com/Kensan196948G/Windows-Deploy-Management-System.git) とのシリアル番号連携:

- cdx-server の `GET /api/v1/serial/queue` でOCR済みシリアル番号を取得
- `POST /api/v1/serial/confirm/{id}` でホスト名を確定し展開台帳に登録
- 統合 API 設計は別途 Issue で管理

---

## 8. Linux との主な差分

| 項目 | Linux | Windows |
|---|---|---|
| SMBマウント設定 | `/etc/cdx-smb.creds` + `/etc/fstab` | 設定不要（ドメイン参加時） |
| SMBパス形式 | `/mnt/gmsv0002-serial` | `//GMSV0002/cdx-serial-scans` |
| OCR依存インストール | `pip install ".[ocr]"` | 同じ（自動） |
| Docker | docker-compose.prod.yml | Docker Desktop + WSL2 |
| Admin SPA | ブラウザで同一 | ブラウザで同一 |

---

*最終更新: 2026-05-14 (Loop 87)*

# モック WebUI（デモ環境）

建設DX OS の管理コンソールを **ダミーデータのみ** で表示するデモ環境です。
バックエンド API や DB には接続しません。画面の見た目・操作感の確認、関係者への
デモ、デザインレビューを目的としています。

> 🧪 表示されるすべての端末・ビルド・アラート・監査ログは **架空のサンプルデータ** です。

---

## クイックスタート（Docker Compose）

```bash
# リポジトリのルートで実行
docker compose -f mock-webui/docker-compose.mock.yml up -d

# ブラウザで開く（<host-ip> はこの機器の IP アドレス）
#   http://<host-ip>:18888/
```

- **ポート**: `18888`（このホストでは 8888 が他プロジェクトで使用中のため回避）
- **IP**: 機器が DHCP で受け取った IP でそのままアクセス可能（例: `http://192.168.0.185:18888/`）

停止：

```bash
docker compose -f mock-webui/docker-compose.mock.yml down
```

---

## 機器起動時に自動で立ち上げる（systemd）

```bash
# 1. リポジトリを /opt に配置（または unit の WorkingDirectory を実パスへ修正）
sudo cp mock-webui/systemd/cdx-mock-ui.service /etc/systemd/system/

# 2. 反映して有効化（次回起動以降も自動起動）
sudo systemctl daemon-reload
sudo systemctl enable --now cdx-mock-ui.service

# 3. 状態確認
systemctl status cdx-mock-ui.service
```

`WantedBy=multi-user.target` により、機器の再起動後もサービスが自動で立ち上がります。

---

## 構成

```
mock-webui/
├── Dockerfile                  # nginx:1.27-alpine ベースの静的配信イメージ
├── nginx.conf                  # listen 8888 / SPA fallback
├── docker-compose.mock.yml     # host:18888 -> container:8888
├── admin-spa/                  # 配信する静的ファイル（ダミーデータ内蔵）
│   ├── index.html              # モック環境バナー付き
│   ├── dist/bundle.js          # ビルド済み React SPA（ダミーデータ込み）
│   └── vendor/                 # React / ReactDOM
└── systemd/
    └── cdx-mock-ui.service     # boot 時自動起動ユニット
```

## なぜバックエンド不要なのか

`admin-spa` は API を呼ばないプロトタイプで、表示データは JavaScript 内に
ハードコードされています。そのため nginx で静的ファイルを配信するだけで
完全なモック環境が成立します（DB・API サーバー・認証は一切不要）。

実データ連携版が必要になった段階で、`server/api`（FastAPI）を起動し
SPA の API 接続を有効化する想定です。

# cdx-server (Central Platform API)

建設DX OS 中央管理基盤の API サーバ MVP。

## 責務

- 端末登録 (device registry)
- heartbeat / inventory 受信
- HMAC-SHA256 による request 検証
- 冪等性担保 (`device_id + payload_type + timestamp_bucket`)

## Phase 1 スコープ

- in-memory storage (PostgreSQL は Phase 2)
- 基本 4 エンドポイント: `/health`, `/api/v1/devices/register`, `/api/v1/heartbeat`, `/api/v1/inventory`
- 認証: HMAC-SHA256 署名トークン
- 監査ログ: 未実装 (Phase 2)

## 起動

```bash
cd server/api
python3 -m pip install -e ".[dev]"
uvicorn cdx_server.app:app --reload
# or:
cdx-server
```

## テスト

```bash
ruff check .
pytest -v
```

## エンドポイント

| Method | Path | 概要 |
|---|---|---|
| GET | `/health` | 生存確認 |
| POST | `/api/v1/devices/register` | 端末登録 + 共有鍵登録 |
| POST | `/api/v1/heartbeat` | ハートビート受信 |
| POST | `/api/v1/inventory` | インベントリ受信 |

## 認証ヘッダ

署名必須のエンドポイント (`heartbeat`, `inventory`) では以下を要求:

| Header | 意味 |
|---|---|
| `X-CDX-Device-Id` | 端末識別子 |
| `X-CDX-Payload-Type` | `heartbeat` or `inventory` |
| `X-CDX-Timestamp-Bucket` | bucketed epoch seconds (heartbeat=60s, inventory=3600s) |
| `X-CDX-Signature` | HMAC-SHA256 hex digest |

canonical input = `device_id\npayload_type\ntimestamp_bucket\nsha256(body_bytes)`

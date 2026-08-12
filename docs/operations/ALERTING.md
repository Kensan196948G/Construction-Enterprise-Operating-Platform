# CEOP アラート通知設定ガイド（v0.12.0）

## 1. 概要

`scripts/health-probe.sh` は、連続 3 回のプローブ失敗（約 15 分の不通）で
`ALERT`、回復時に `RECOVERED` を JSON で Webhook へ POST します。
通知先は環境変数 `CEOP_ALERT_WEBHOOK_URL` で指定し、**Git には保存しません**。

通知ペイロード（汎用 JSON）:

```json
{
  "event": "ALERT",
  "target": "https://ceop.mirai-dx-platform.com/health/ready",
  "consecutiveFailures": 3,
  "timestamp": "2026-08-12T01:00:00Z"
}
```

## 2. Slack の場合

### 2-1. Incoming Webhook の作成（管理者）

1. Slack アプリ管理（api.slack.com/apps）→「Create New App」→「From scratch」
2. 「Incoming Webhooks」を有効化
3. 通知先チャンネル（例: `#ceop-alerts`）へ「Add New Webhook to Workspace」
4. Webhook URL（`https://hooks.slack.com/services/T.../B.../...`）を控える

### 2-2. 設定

```bash
# /home/kensan/.ceop/.env に追記（chmod 600）
echo 'CEOP_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX' >> /home/kensan/.ceop/.env
chmod 600 /home/kensan/.ceop/.env
```

Slack は受信 JSON の `text` を表示するため、CEOP の汎用 JSON をそのまま
POST すると人間には読みにくい形になります。その場合は下記の変換例を
`scripts/health-probe.sh` の `notify()` に追加してください。

```bash
# Slack 変換例（ALERT のみ text 形式に変換）
if [[ "$NOTIFY_URL" == *hooks.slack.com* ]]; then
  payload=$(printf '{"text":"%s %s（連続失敗 %s 回）"}' "$1" "$URL" "$2")
else
  payload=$(printf '{"event":"%s","target":"%s","consecutiveFailures":%s,"timestamp":"%s"}' "$1" "$safe_url" "$2" "$(now)")
fi
```

## 3. Microsoft Teams の場合

1. Teams の対象チャンネル →「...」→「コネクタ」→「Incoming Webhook」→「追加」
2. 名前（例: CEOP 障害通知）を設定し URL を控える
3. `CEOP_ALERT_WEBHOOK_URL` に `https://.../webhookb2/...` を設定

Teams は MessageCard JSON を期待するため、同様に変換が必要です。

```bash
# Teams 変換例
if [[ "$NOTIFY_URL" == *webhookb2* ]]; then
  payload=$(printf '{"@type":"MessageCard","@context":"http://schema.org/extensions","summary":"CEOP %s","title":"CEOP %s","text":"対象: %s（連続失敗 %s 回）"}' "$1" "$1" "$URL" "$2")
fi
```

## 4. 動作確認

```bash
# 環境変数を読み込んでプローブを実行（成功時は通知なし）
set -a; source /home/kensan/.ceop/.env; set +a
CEOP_HEALTH_URL=http://127.0.0.1:1/health/ready bash scripts/health-probe.sh
echo "exit=$?"   # 1（ALERT）

# 通知が届いたことを確認し、状態ファイルをリセット
cat /home/kensan/.ceop/health-probe.state
echo 0 > /home/kensan/.ceop/health-probe.state

# RECOVERED も確認したい場合
CEOP_HEALTH_URL=https://ceop.mirai-dx-platform.com/health/ready bash scripts/health-probe.sh
echo "exit=$?"   # 0（RECOVERED 通知）
```

通知履歴は `/home/kensan/.ceop/health.log` の `NOTIFY_OK` / `NOTIFY_FAILED` で確認できます。

## 5. 運用上の注意

- Webhook URL は機密情報です。`.env`（chmod 600）のみに置き、Git・Issue・PR・ログへ
  出力しないでください。
- Webhook 配信失敗はプローブ自体の成否を変えません（`NOTIFY_FAILED` として記録）。
- 通知先を Slack と Teams の両方にしたい場合は、health-probe.sh の `notify()` を
  配列対応に拡張してください（将来のバージョンで対応予定）。

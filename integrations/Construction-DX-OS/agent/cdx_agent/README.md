# cdx-agent

Construction DX OS 向け端末エージェント (MVP)。

## 責務

- 端末 ID 管理
- 資産情報 (inventory) 収集
- ヘルス (heartbeat) ペイロード生成
- オフライン再送の土台 (future)

## 開発

```bash
cd agent/cdx_agent
python3 -m pip install -e ".[dev]"
ruff check .
pytest -v
```

## CLI

```bash
cdx-agent version
cdx-agent inventory
cdx-agent heartbeat
```

## ステータス

Phase 0 MVP: 骨格のみ。実運用向け機能 (systemd サービス, ローカルキュー永続化, API 通信, 署名) は後続フェーズで段階実装。

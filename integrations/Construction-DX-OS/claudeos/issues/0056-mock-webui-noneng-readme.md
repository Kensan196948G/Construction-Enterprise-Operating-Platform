# Issue 0056 — モック WebUI 提供 + 非エンジニア向け README 再構成

- **Priority**: P2
- **Phase**: 9 (Stabilize / UX)
- **Status**: Resolved (PR pending human merge)
- **Related**: Issue 0027 (dashboard), admin-spa prototype
- **Branch**: `feat/0056-mock-webui-noneng-readme`

## 背景

ユーザー（CTO）指示：

1. 既存 WebUI をモック環境 WebUI 化する。自動割当 IP + 競合しないポートで実装し、
   Docker および systemd に登録、機器起動時にサービスが立ち上がること。
2. WebUI はまずモック環境とし、データはすべてダミーデータ化する。
3. README を非エンジニア向けに再作成する。
   - 閲覧対象：本社・支店・現場の施工管理者、土木建設技術者・研究者、経営役員、監査法人
   - エンジニア向け / IT 部門向け / 技術スタックは `docs/` 配下にリンク先として分離
   - IT 部門向け・技術スタックはアイコン多用・ダイアグラム図を活用

## 受入基準

- [x] `mock-webui/` に nginx ベースの静的配信 Docker イメージを用意
- [x] ホスト公開ポート 18888（8888 は既存プロジェクトが使用済みのため回避）
- [x] `docker compose -f mock-webui/docker-compose.mock.yml up -d` で起動
- [x] ホスト自動割当 IP（例 192.168.0.185）+ 18888 でアクセス可能
- [x] 全データがダミー（admin-spa プロトタイプはバックエンド非依存）
- [x] 「モック環境 — ダミーデータ」バナーを表示
- [x] systemd unit (`cdx-mock-ui.service`) を用意し、boot 時自動起動可能
- [x] README.md を非エンジニア向けに再作成
- [x] `docs/for-it-staff.md`（IT 部門向け、アイコン + ダイアグラム）
- [x] `docs/tech-stack.md`（技術スタック、アイコン + ダイアグラム）
- [x] 旧来の技術詳細を docs 配下へ移設しリンク（`docs/for-engineers.md`）

## 設計判断

- **モック化の方針**: 既存 `server/api/static/admin-spa` は API 呼び出しを持たない
  プロトタイプで、`proto-data.jsx` に全ダミーデータがインライン化済み。よって
  ビルド済み `dist/bundle.js` を nginx で静的配信するだけでモック環境が成立する。
  バックエンド・DB は不要。
- **ポート**: 本ホストは多数プロジェクト同居のため 8888 衝突。内部 nginx は 8888、
  ホスト公開のみ 18888 にマッピング（内部設定を変えず衝突回避）。
- **fail-safe**: `restart: unless-stopped` + systemd `WantedBy=multi-user.target`
  で機器再起動時も自動復帰。

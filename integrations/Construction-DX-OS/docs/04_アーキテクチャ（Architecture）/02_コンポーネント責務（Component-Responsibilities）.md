# 02_コンポーネント責務（Component-Responsibilities）

## 責務

| コンポーネント | 責務 | フェーズ |
|---|---|---|
| 🐧 Client OS | UI / ローカル実行 / 標準アプリ提供 | ✅ Phase 1 |
| 🚀 Construction Hub (Launcher) | 業務入口統一・3 profile 切替 | ✅ Phase 1 |
| 📡 cdx-agent | 端末状態の収集・送信・spool 同期・診断 | ✅ Phase 1 |
| 🌐 cdx-server API | 受信・認証・保存・policy 配布 | ✅ Phase 1 |
| 🖥️ 管理 WebUI (`/admin`) | 端末一覧・詳細・状態可視化 | ✅ Phase 1 |
| 🔨 **ISO Builder UI** (`/admin/iso-builder`) | profile 別 ISO の非同期ビルド・ログ・配布・監査 | 🔜 **Phase 2** |
| 🛠️ **build-worker** | live-build を専用ホストで実行し成果物を MinIO へ | 🔜 **Phase 2** |
| 🗃️ PostgreSQL | 端末・HB・inventory・policy・**iso_build_jobs / iso_build_audit** | ✅/🔜 |
| 🚀 Redis | rate-limit + **RQ ジョブキュー** | ✅/🔜 |
| 🪣 MinIO/S3 | ISO 成果物 + build.log 保管 | 🔜 Phase 2 |
| 📈 Prometheus | 端末送信・rate-limit・**ISO ビルド** メトリクス | ✅/🔜 |

# Changelog

本プロジェクトの主要な変更点を記録します。形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠します。

## [Unreleased] — MVP Release Candidate (2026-06-17)

MVP の全成功条件を実 runtime 証拠で達成し、Release Candidate が成立。
詳細なエビデンスは [docs/release/mvp-release-candidate.md](docs/release/mvp-release-candidate.md) を参照。

### Added

- frontend E2E スモークテスト `scripts/smoke/frontend-smoke.sh`（主要9ルートを HTTP 200 + タイトルで検証）(#19)
- 運用ドキュメント `docs/it-operations.md` / `docs/engineering-guide.md` / `docs/technology-stack.md`(#19)
- 実 PostgreSQL DB CRUD 検証スクリプト `services/construction/verify_db_crud.py`(#22)
- runtime 認証認可フロー検証スクリプト `services/construction/verify_auth_flow.py`(#23)
- bim/ai-ocr/iot ページの frontend テスト29件(#12)

### Fixed

- `@next/swc-linux-x64-gnu` の platform 固定依存を削除し、Windows/macOS での `npm/pnpm install` EBADPLATFORM 失敗を解消(#18, closes #16)
- frontend テストの非同期 useEffect リークを `waitFor` settle で決定化（全243件安定）(#12)

### Docs

- README を非エンジニア向け概要に再構成し `docs/` への導線を整理(#19)

### Tracked（リリース後の本番ハードニング）

- フロント側ダッシュボード認証ガードの本番有効化(#15)
- 実 DB 統合テストの CI 化(#20)
- フルスタック32サービス起動検証(#21)

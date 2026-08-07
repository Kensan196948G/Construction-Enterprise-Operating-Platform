---
id: "0023"
title: "Phase 2: ISO Builder build-worker (RQ + live-build runner)"
status: done
priority: P2
phase: "Phase 2"
labels: [feature, infra, iso, phase2, worker]
created: "2026-04-28"
---

## Summary

Issue 0022 の実行プロセス側。Redis Queue から `build_iso(job_id)` を受信し、`build/live-build/` を非同期に実行して ISO + SHA256 + build.log を MinIO に保存する常駐 worker。

## 配置

- 新規ディレクトリ: `build/worker/`
  - `cdx_build_worker/` Python パッケージ
  - `cdx-build-worker.service` systemd unit
  - `Dockerfile`（live-build を含むビルドホスト用イメージ）
- 専用 Linux ホスト (Debian 12+ build VM)

## 動作フロー

1. RQ から job をデキュー
2. PostgreSQL で job を `running` に
3. `git fetch && git checkout <git_ref>`
4. `cd build/live-build && sudo BUILD_PROFILE=<profile> lb build` を subprocess で実行
5. stdout/stderr を `build.log` に tee + DB に進捗 update
6. 完了後 ISO の SHA256 を計算
7. MinIO に `iso/{job_id}/construction-dx-os.iso` と `iso/{job_id}/build.log` を PUT
8. job を `succeeded`/`failed` に更新

## Acceptance Criteria

- [ ] mock モード (`CDX_WORKER_MOCK=1`) で 30 秒後に dummy ISO 生成
- [ ] 実 live-build モードで `field` profile が完走
- [ ] 失敗時に `error_message` に build.log の末尾が記録される
- [ ] systemd unit で常駐し再起動耐性あり
- [ ] cancel 受信時に subprocess を終了

## 依存

- Issue 0022 (API + WebUI 設計)
- Issue 0024 (DB schema)

/* 建設DX OS 管理WebUI — フルプロトタイプ（Variant Aベース）
   サイドバーナビ + 各ページ詳細実装 */

/* ─── 共有データ ─── */
const DEVICES_DATA = [
  { id: "CDX-HQ-001", serial: "SN-HQ-001001", profile: "standard", hostname: "shinjuku-hq-01", location: "新宿本社", status: "online", lastHb: "2026-05-06 09:28", os: "Debian 13.0", ring: "Ring 1", agent: "0.2.0", apparmor: "有効", ip: "192.168.1.11", cpu: 23, mem: 41, disk: 38 },
  { id: "CDX-HQ-002", serial: "SN-HQ-001002", profile: "standard", hostname: "shinjuku-hq-02", location: "新宿本社", status: "online", lastHb: "2026-05-06 09:29", os: "Debian 13.0", ring: "Ring 1", agent: "0.2.0", apparmor: "有効", ip: "192.168.1.12", cpu: 45, mem: 62, disk: 55 },
  { id: "CDX-HQ-003", serial: "SN-HQ-001003", profile: "standard", hostname: "shinjuku-hq-03", location: "新宿本社", status: "online", lastHb: "2026-05-06 09:29", os: "Debian 13.0", ring: "Ring 2", agent: "0.2.0", apparmor: "有効", ip: "192.168.1.13", cpu: 12, mem: 35, disk: 42 },
  { id: "CDX-BR-010", serial: "SN-BR-002001", profile: "standard", hostname: "osaka-br-01",     location: "大阪支店", status: "online", lastHb: "2026-05-06 09:25", os: "Debian 13.0", ring: "Ring 2", agent: "0.2.0", apparmor: "有効", ip: "192.168.2.10", cpu: 31, mem: 48, disk: 61 },
  { id: "CDX-BR-011", serial: "SN-BR-002002", profile: "standard", hostname: "osaka-br-02",     location: "大阪支店", status: "online", lastHb: "2026-05-06 09:27", os: "Debian 13.0", ring: "Ring 2", agent: "0.2.0", apparmor: "有効", ip: "192.168.2.11", cpu: 18, mem: 39, disk: 44 },
  { id: "CDX-FLD-101", serial: "SN-FLD-003001", profile: "field",  hostname: "kawasaki-genba-01", location: "川崎現場A", status: "offline", lastHb: "2026-05-06 06:30", os: "Debian 13.0", ring: "Ring 2", agent: "0.1.9", apparmor: "有効", ip: "10.0.1.101", cpu: 0, mem: 0, disk: 52 },
  { id: "CDX-FLD-102", serial: "SN-FLD-003002", profile: "field",  hostname: "yokohama-genba-02", location: "横浜現場B", status: "online", lastHb: "2026-05-06 09:29", os: "Debian 13.0", ring: "Ring 1", agent: "0.2.0", apparmor: "有効", ip: "10.0.2.102", cpu: 56, mem: 71, disk: 67 },
  { id: "CDX-FLD-103", serial: "SN-FLD-003003", profile: "field",  hostname: "chiba-genba-03",    location: "千葉現場C", status: "online", lastHb: "2026-05-06 09:29", os: "Debian 13.0", ring: "Ring 3", agent: "0.2.0", apparmor: "有効", ip: "10.0.3.103", cpu: 42, mem: 58, disk: 49 },
  { id: "CDX-KSK-201", serial: "SN-KSK-004001", profile: "kiosk",  hostname: "nagoya-kiosk-01",  location: "名古屋支店", status: "warning", lastHb: "2026-05-06 09:15", os: "Debian 13.0", ring: "Ring 3", agent: "0.1.9", apparmor: "無効", ip: "192.168.3.201", cpu: 8, mem: 22, disk: 31 },
  { id: "CDX-KSK-202", serial: "SN-KSK-004002", profile: "kiosk",  hostname: "fukuoka-kiosk-02", location: "福岡支店",  status: "online",  lastHb: "2026-05-06 09:26", os: "Debian 13.0", ring: "Ring 3", agent: "0.2.0", apparmor: "有効", ip: "192.168.4.202", cpu: 15, mem: 28, disk: 35 },
];

const ISO_JOBS_DATA = [
  { id: "b7a1c2d3-e5f6-4a7b-8c9d-0e1f2a3b4c5d", profile: "standard", status: "succeeded", requestedBy: "admin", createdAt: "2026-05-05 14:30:00", startedAt: "2026-05-05 14:30:45", finishedAt: "2026-05-05 15:12:33", size: "1.8 GB", gitRef: "v1.0.0-rc2", sha256: "a1b2c3d4e5f6...78901234", notes: "Phase 2 RC2 標準プロファイル" },
  { id: "e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b", profile: "field", status: "running", requestedBy: "tanaka", createdAt: "2026-05-06 09:15:00", startedAt: "2026-05-06 09:15:30", finishedAt: null, size: "—", gitRef: "main", sha256: null, notes: "現場用プロファイル テストビルド" },
  { id: "c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f", profile: "standard", status: "failed", requestedBy: "admin", createdAt: "2026-05-04 11:00:00", startedAt: "2026-05-04 11:00:22", finishedAt: "2026-05-04 11:08:45", size: "—", gitRef: "v1.0.0-rc1", sha256: null, notes: "RC1 — lb build hook エラーで失敗", error: "E: Hook 0500-install-agent.chroot failed with exit code 1" },
  { id: "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d", profile: "kiosk", status: "succeeded", requestedBy: "suzuki", createdAt: "2026-05-03 16:45:00", startedAt: "2026-05-03 16:45:18", finishedAt: "2026-05-03 17:20:02", size: "1.2 GB", gitRef: "v1.0.0-rc2", sha256: "f6e5d4c3b2a1...56789012", notes: "共用端末プロファイル" },
  { id: "d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a", profile: "field", status: "succeeded", requestedBy: "yamada", createdAt: "2026-05-02 10:20:00", startedAt: "2026-05-02 10:20:35", finishedAt: "2026-05-02 10:58:12", size: "1.5 GB", gitRef: "v0.9.0", sha256: "12345678abcd...ef012345", notes: "現場プロファイル v0.9" },
];

const ALERTS_DATA = [
  { id: 1, level: "critical", msg: "CDX-KSK-201: AppArmor 無効 — セキュリティポリシー違反", time: "2026-05-06 09:20", device: "CDX-KSK-201", ack: false },
  { id: 2, level: "warn", msg: "CDX-FLD-101: 3時間以上オフライン — 現場回線断の可能性", time: "2026-05-06 09:00", device: "CDX-FLD-101", ack: false },
  { id: 3, level: "warn", msg: "cdx-agent 0.1.9 → 0.2.0 更新対象: 2台 (CDX-FLD-101, CDX-KSK-201)", time: "2026-05-06 08:00", device: null, ack: false },
  { id: 4, level: "info", msg: "ISO ビルド e4f5a6b7 (field) 実行中 — 進捗: live-build running", time: "2026-05-06 09:15", device: null, ack: true },
  { id: 5, level: "info", msg: "ISO ビルド b7a1c2d3 (standard) 成功 — 1.8 GB", time: "2026-05-05 15:12", device: null, ack: true },
  { id: 6, level: "warn", msg: "CDX-KSK-201: ハートビート 15分遅延", time: "2026-05-06 09:15", device: "CDX-KSK-201", ack: false },
  { id: 7, level: "info", msg: "ポリシー配信完了: nftables ルール更新 (v2.1)", time: "2026-05-05 18:00", device: null, ack: true },
  { id: 8, level: "info", msg: "Ring 2 更新展開: cdx-agent 0.2.0 配信開始", time: "2026-05-05 12:00", device: null, ack: true },
];

const AUDIT_LOG = [
  { at: "2026-05-06 09:15:00", actor: "tanaka", action: "iso_build.create", detail: "field プロファイル ISO ビルド開始", reqId: "req-a1b2c3" },
  { at: "2026-05-06 09:00:00", actor: "system", action: "alert.create", detail: "CDX-FLD-101 オフライン検知", reqId: "req-d4e5f6" },
  { at: "2026-05-05 15:12:33", actor: "system", action: "iso_build.complete", detail: "b7a1c2d3 standard ビルド成功", reqId: "req-g7h8i9" },
  { at: "2026-05-05 14:30:00", actor: "admin", action: "iso_build.create", detail: "standard プロファイル ISO ビルド開始", reqId: "req-j0k1l2" },
  { at: "2026-05-05 12:00:00", actor: "admin", action: "ring.deploy", detail: "Ring 2 へ cdx-agent 0.2.0 展開", reqId: "req-m3n4o5" },
  { at: "2026-05-05 11:00:00", actor: "admin", action: "policy.push", detail: "nftables ルール v2.1 全端末配信", reqId: "req-p6q7r8" },
  { at: "2026-05-04 11:08:45", actor: "system", action: "iso_build.failed", detail: "c8d9e0f1 standard ビルド失敗", reqId: "req-s9t0u1" },
  { at: "2026-05-04 11:00:00", actor: "admin", action: "iso_build.create", detail: "standard RC1 ISO ビルド開始", reqId: "req-v2w3x4" },
  { at: "2026-05-03 17:20:02", actor: "system", action: "iso_build.complete", detail: "a2b3c4d5 kiosk ビルド成功", reqId: "req-y5z6a7" },
  { at: "2026-05-03 16:45:00", actor: "suzuki", action: "iso_build.create", detail: "kiosk プロファイル ISO ビルド開始", reqId: "req-b8c9d0" },
];

const POLICIES = [
  { name: "AppArmor プロファイル", version: "v1.3", lastPush: "2026-05-05 10:00", applied: 9, total: 10, status: "部分適用" },
  { name: "sudo ポリシー", version: "v2.0", lastPush: "2026-05-04 14:00", applied: 10, total: 10, status: "全端末適用" },
  { name: "nftables ルール", version: "v2.1", lastPush: "2026-05-05 18:00", applied: 10, total: 10, status: "全端末適用" },
  { name: "APT ミラー設定", version: "v1.1", lastPush: "2026-05-05 08:00", applied: 10, total: 10, status: "全端末適用" },
  { name: "HMAC 共有鍵", version: "rotate-05", lastPush: "2026-05-01 00:00", applied: 10, total: 10, status: "全端末配布" },
  { name: "systemd timer 設定", version: "v1.0", lastPush: "2026-04-28 09:00", applied: 10, total: 10, status: "全端末適用" },
];

const RINGS_DATA = [
  { name: "Ring 0 (Canary)", desc: "開発検証環境 — 新版を最初にテスト", count: 0, color: "#ef4444", devices: [] },
  { name: "Ring 1 (早期検証)", desc: "IT部門端末 — 本番前の早期検証", count: 3, color: "#f59e0b", devices: ["CDX-HQ-001", "CDX-HQ-002", "CDX-FLD-102"] },
  { name: "Ring 2 (標準展開)", desc: "一般端末 — 検証済み版を展開", count: 4, color: "#3b82f6", devices: ["CDX-HQ-003", "CDX-BR-010", "CDX-BR-011", "CDX-FLD-101"] },
  { name: "Ring 3 (安定運用)", desc: "現場・共用端末 — 最も安定した版", count: 3, color: "#22c55e", devices: ["CDX-FLD-103", "CDX-KSK-201", "CDX-KSK-202"] },
];

/* ─── Helpers ─── */
const sColor = s => s === "online" ? "#22c55e" : s === "offline" ? "#94a3b8" : "#f59e0b";
const sBg = s => s === "online" ? "#f0fdf4" : s === "offline" ? "#f8fafc" : "#fffbeb";
const sLabel = s => s === "online" ? "稼働中" : s === "offline" ? "オフライン" : "警告";
const jColor = s => s === "succeeded" ? "#22c55e" : s === "running" ? "#3b82f6" : s === "failed" ? "#ef4444" : "#94a3b8";
const jBg = s => s === "succeeded" ? "#f0fdf4" : s === "running" ? "#eff6ff" : s === "failed" ? "#fef2f2" : "#f8fafc";
const jLabel = s => s === "succeeded" ? "成功" : s === "running" ? "実行中" : s === "failed" ? "失敗" : s === "cancelled" ? "キャンセル" : s;
const aColor = l => l === "critical" ? "#ef4444" : l === "warn" ? "#f59e0b" : "#3b82f6";
const onlineN = DEVICES_DATA.filter(d => d.status === "online").length;
const offlineN = DEVICES_DATA.filter(d => d.status === "offline").length;
const warnN = DEVICES_DATA.filter(d => d.status === "warning").length;
const oldAgentN = DEVICES_DATA.filter(d => d.agent !== "0.2.0").length;
const aaDisabledN = DEVICES_DATA.filter(d => d.apparmor !== "有効").length;
const usageColor = v => v > 80 ? "#ef4444" : v > 60 ? "#f59e0b" : "#22c55e";

/* ─── Shared styles ─── */
const cardStyle = { background: "#fff", borderRadius: 12, border: "1px solid #e8ecf1", padding: "16px 18px" };
const thStyle = { textAlign: "left", padding: "7px 8px", color: "#94a3b8", fontWeight: 500, fontSize: 11 };
const tdStyle = { padding: "8px", fontSize: 12 };

Object.assign(window, {
  DEVICES_DATA, ISO_JOBS_DATA, ALERTS_DATA, AUDIT_LOG, POLICIES, RINGS_DATA,
  sColor, sBg, sLabel, jColor, jBg, jLabel, aColor,
  onlineN, offlineN, warnN, oldAgentN, aaDisabledN, usageColor,
  cardStyle, thStyle, tdStyle
});

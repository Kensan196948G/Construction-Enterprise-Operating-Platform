/* === proto-data.jsx === */
const DEVICES_DATA = [
  { id: "CDX-HQ-001", serial: "SN-HQ-001001", profile: "standard", hostname: "shinjuku-hq-01", location: "\u65B0\u5BBF\u672C\u793E", status: "online", lastHb: "2026-05-06 09:28", os: "Debian 13.0", ring: "Ring 1", agent: "0.2.0", apparmor: "\u6709\u52B9", ip: "192.168.1.11", cpu: 23, mem: 41, disk: 38 },
  { id: "CDX-HQ-002", serial: "SN-HQ-001002", profile: "standard", hostname: "shinjuku-hq-02", location: "\u65B0\u5BBF\u672C\u793E", status: "online", lastHb: "2026-05-06 09:29", os: "Debian 13.0", ring: "Ring 1", agent: "0.2.0", apparmor: "\u6709\u52B9", ip: "192.168.1.12", cpu: 45, mem: 62, disk: 55 },
  { id: "CDX-HQ-003", serial: "SN-HQ-001003", profile: "standard", hostname: "shinjuku-hq-03", location: "\u65B0\u5BBF\u672C\u793E", status: "online", lastHb: "2026-05-06 09:29", os: "Debian 13.0", ring: "Ring 2", agent: "0.2.0", apparmor: "\u6709\u52B9", ip: "192.168.1.13", cpu: 12, mem: 35, disk: 42 },
  { id: "CDX-BR-010", serial: "SN-BR-002001", profile: "standard", hostname: "osaka-br-01", location: "\u5927\u962A\u652F\u5E97", status: "online", lastHb: "2026-05-06 09:25", os: "Debian 13.0", ring: "Ring 2", agent: "0.2.0", apparmor: "\u6709\u52B9", ip: "192.168.2.10", cpu: 31, mem: 48, disk: 61 },
  { id: "CDX-BR-011", serial: "SN-BR-002002", profile: "standard", hostname: "osaka-br-02", location: "\u5927\u962A\u652F\u5E97", status: "online", lastHb: "2026-05-06 09:27", os: "Debian 13.0", ring: "Ring 2", agent: "0.2.0", apparmor: "\u6709\u52B9", ip: "192.168.2.11", cpu: 18, mem: 39, disk: 44 },
  { id: "CDX-FLD-101", serial: "SN-FLD-003001", profile: "field", hostname: "kawasaki-genba-01", location: "\u5DDD\u5D0E\u73FE\u5834A", status: "offline", lastHb: "2026-05-06 06:30", os: "Debian 13.0", ring: "Ring 2", agent: "0.1.9", apparmor: "\u6709\u52B9", ip: "10.0.1.101", cpu: 0, mem: 0, disk: 52 },
  { id: "CDX-FLD-102", serial: "SN-FLD-003002", profile: "field", hostname: "yokohama-genba-02", location: "\u6A2A\u6D5C\u73FE\u5834B", status: "online", lastHb: "2026-05-06 09:29", os: "Debian 13.0", ring: "Ring 1", agent: "0.2.0", apparmor: "\u6709\u52B9", ip: "10.0.2.102", cpu: 56, mem: 71, disk: 67 },
  { id: "CDX-FLD-103", serial: "SN-FLD-003003", profile: "field", hostname: "chiba-genba-03", location: "\u5343\u8449\u73FE\u5834C", status: "online", lastHb: "2026-05-06 09:29", os: "Debian 13.0", ring: "Ring 3", agent: "0.2.0", apparmor: "\u6709\u52B9", ip: "10.0.3.103", cpu: 42, mem: 58, disk: 49 },
  { id: "CDX-KSK-201", serial: "SN-KSK-004001", profile: "kiosk", hostname: "nagoya-kiosk-01", location: "\u540D\u53E4\u5C4B\u652F\u5E97", status: "warning", lastHb: "2026-05-06 09:15", os: "Debian 13.0", ring: "Ring 3", agent: "0.1.9", apparmor: "\u7121\u52B9", ip: "192.168.3.201", cpu: 8, mem: 22, disk: 31 },
  { id: "CDX-KSK-202", serial: "SN-KSK-004002", profile: "kiosk", hostname: "fukuoka-kiosk-02", location: "\u798F\u5CA1\u652F\u5E97", status: "online", lastHb: "2026-05-06 09:26", os: "Debian 13.0", ring: "Ring 3", agent: "0.2.0", apparmor: "\u6709\u52B9", ip: "192.168.4.202", cpu: 15, mem: 28, disk: 35 }
];
const ISO_JOBS_DATA = [
  { id: "b7a1c2d3-e5f6-4a7b-8c9d-0e1f2a3b4c5d", profile: "standard", status: "succeeded", requestedBy: "admin", createdAt: "2026-05-05 14:30:00", startedAt: "2026-05-05 14:30:45", finishedAt: "2026-05-05 15:12:33", size: "1.8 GB", gitRef: "v1.0.0-rc2", sha256: "a1b2c3d4e5f6...78901234", notes: "Phase 2 RC2 \u6A19\u6E96\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB" },
  { id: "e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b", profile: "field", status: "running", requestedBy: "tanaka", createdAt: "2026-05-06 09:15:00", startedAt: "2026-05-06 09:15:30", finishedAt: null, size: "\u2014", gitRef: "main", sha256: null, notes: "\u73FE\u5834\u7528\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB \u30C6\u30B9\u30C8\u30D3\u30EB\u30C9" },
  { id: "c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f", profile: "standard", status: "failed", requestedBy: "admin", createdAt: "2026-05-04 11:00:00", startedAt: "2026-05-04 11:00:22", finishedAt: "2026-05-04 11:08:45", size: "\u2014", gitRef: "v1.0.0-rc1", sha256: null, notes: "RC1 \u2014 lb build hook \u30A8\u30E9\u30FC\u3067\u5931\u6557", error: "E: Hook 0500-install-agent.chroot failed with exit code 1" },
  { id: "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d", profile: "kiosk", status: "succeeded", requestedBy: "suzuki", createdAt: "2026-05-03 16:45:00", startedAt: "2026-05-03 16:45:18", finishedAt: "2026-05-03 17:20:02", size: "1.2 GB", gitRef: "v1.0.0-rc2", sha256: "f6e5d4c3b2a1...56789012", notes: "\u5171\u7528\u7AEF\u672B\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB" },
  { id: "d5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a", profile: "field", status: "succeeded", requestedBy: "yamada", createdAt: "2026-05-02 10:20:00", startedAt: "2026-05-02 10:20:35", finishedAt: "2026-05-02 10:58:12", size: "1.5 GB", gitRef: "v0.9.0", sha256: "12345678abcd...ef012345", notes: "\u73FE\u5834\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB v0.9" }
];
const ALERTS_DATA = [
  { id: 1, level: "critical", msg: "CDX-KSK-201: AppArmor \u7121\u52B9 \u2014 \u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30DD\u30EA\u30B7\u30FC\u9055\u53CD", time: "2026-05-06 09:20", device: "CDX-KSK-201", ack: false },
  { id: 2, level: "warn", msg: "CDX-FLD-101: 3\u6642\u9593\u4EE5\u4E0A\u30AA\u30D5\u30E9\u30A4\u30F3 \u2014 \u73FE\u5834\u56DE\u7DDA\u65AD\u306E\u53EF\u80FD\u6027", time: "2026-05-06 09:00", device: "CDX-FLD-101", ack: false },
  { id: 3, level: "warn", msg: "cdx-agent 0.1.9 \u2192 0.2.0 \u66F4\u65B0\u5BFE\u8C61: 2\u53F0 (CDX-FLD-101, CDX-KSK-201)", time: "2026-05-06 08:00", device: null, ack: false },
  { id: 4, level: "info", msg: "ISO \u30D3\u30EB\u30C9 e4f5a6b7 (field) \u5B9F\u884C\u4E2D \u2014 \u9032\u6357: live-build running", time: "2026-05-06 09:15", device: null, ack: true },
  { id: 5, level: "info", msg: "ISO \u30D3\u30EB\u30C9 b7a1c2d3 (standard) \u6210\u529F \u2014 1.8 GB", time: "2026-05-05 15:12", device: null, ack: true },
  { id: 6, level: "warn", msg: "CDX-KSK-201: \u30CF\u30FC\u30C8\u30D3\u30FC\u30C8 15\u5206\u9045\u5EF6", time: "2026-05-06 09:15", device: "CDX-KSK-201", ack: false },
  { id: 7, level: "info", msg: "\u30DD\u30EA\u30B7\u30FC\u914D\u4FE1\u5B8C\u4E86: nftables \u30EB\u30FC\u30EB\u66F4\u65B0 (v2.1)", time: "2026-05-05 18:00", device: null, ack: true },
  { id: 8, level: "info", msg: "Ring 2 \u66F4\u65B0\u5C55\u958B: cdx-agent 0.2.0 \u914D\u4FE1\u958B\u59CB", time: "2026-05-05 12:00", device: null, ack: true }
];
const AUDIT_LOG = [
  { at: "2026-05-06 09:15:00", actor: "tanaka", action: "iso_build.create", detail: "field \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB ISO \u30D3\u30EB\u30C9\u958B\u59CB", reqId: "req-a1b2c3" },
  { at: "2026-05-06 09:00:00", actor: "system", action: "alert.create", detail: "CDX-FLD-101 \u30AA\u30D5\u30E9\u30A4\u30F3\u691C\u77E5", reqId: "req-d4e5f6" },
  { at: "2026-05-05 15:12:33", actor: "system", action: "iso_build.complete", detail: "b7a1c2d3 standard \u30D3\u30EB\u30C9\u6210\u529F", reqId: "req-g7h8i9" },
  { at: "2026-05-05 14:30:00", actor: "admin", action: "iso_build.create", detail: "standard \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB ISO \u30D3\u30EB\u30C9\u958B\u59CB", reqId: "req-j0k1l2" },
  { at: "2026-05-05 12:00:00", actor: "admin", action: "ring.deploy", detail: "Ring 2 \u3078 cdx-agent 0.2.0 \u5C55\u958B", reqId: "req-m3n4o5" },
  { at: "2026-05-05 11:00:00", actor: "admin", action: "policy.push", detail: "nftables \u30EB\u30FC\u30EB v2.1 \u5168\u7AEF\u672B\u914D\u4FE1", reqId: "req-p6q7r8" },
  { at: "2026-05-04 11:08:45", actor: "system", action: "iso_build.failed", detail: "c8d9e0f1 standard \u30D3\u30EB\u30C9\u5931\u6557", reqId: "req-s9t0u1" },
  { at: "2026-05-04 11:00:00", actor: "admin", action: "iso_build.create", detail: "standard RC1 ISO \u30D3\u30EB\u30C9\u958B\u59CB", reqId: "req-v2w3x4" },
  { at: "2026-05-03 17:20:02", actor: "system", action: "iso_build.complete", detail: "a2b3c4d5 kiosk \u30D3\u30EB\u30C9\u6210\u529F", reqId: "req-y5z6a7" },
  { at: "2026-05-03 16:45:00", actor: "suzuki", action: "iso_build.create", detail: "kiosk \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB ISO \u30D3\u30EB\u30C9\u958B\u59CB", reqId: "req-b8c9d0" }
];
const POLICIES = [
  { name: "AppArmor \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", version: "v1.3", lastPush: "2026-05-05 10:00", applied: 9, total: 10, status: "\u90E8\u5206\u9069\u7528" },
  { name: "sudo \u30DD\u30EA\u30B7\u30FC", version: "v2.0", lastPush: "2026-05-04 14:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u9069\u7528" },
  { name: "nftables \u30EB\u30FC\u30EB", version: "v2.1", lastPush: "2026-05-05 18:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u9069\u7528" },
  { name: "APT \u30DF\u30E9\u30FC\u8A2D\u5B9A", version: "v1.1", lastPush: "2026-05-05 08:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u9069\u7528" },
  { name: "HMAC \u5171\u6709\u9375", version: "rotate-05", lastPush: "2026-05-01 00:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u914D\u5E03" },
  { name: "systemd timer \u8A2D\u5B9A", version: "v1.0", lastPush: "2026-04-28 09:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u9069\u7528" }
];
const RINGS_DATA = [
  { name: "Ring 0 (Canary)", desc: "\u958B\u767A\u691C\u8A3C\u74B0\u5883 \u2014 \u65B0\u7248\u3092\u6700\u521D\u306B\u30C6\u30B9\u30C8", count: 0, color: "#ef4444", devices: [] },
  { name: "Ring 1 (\u65E9\u671F\u691C\u8A3C)", desc: "IT\u90E8\u9580\u7AEF\u672B \u2014 \u672C\u756A\u524D\u306E\u65E9\u671F\u691C\u8A3C", count: 3, color: "#f59e0b", devices: ["CDX-HQ-001", "CDX-HQ-002", "CDX-FLD-102"] },
  { name: "Ring 2 (\u6A19\u6E96\u5C55\u958B)", desc: "\u4E00\u822C\u7AEF\u672B \u2014 \u691C\u8A3C\u6E08\u307F\u7248\u3092\u5C55\u958B", count: 4, color: "#3b82f6", devices: ["CDX-HQ-003", "CDX-BR-010", "CDX-BR-011", "CDX-FLD-101"] },
  { name: "Ring 3 (\u5B89\u5B9A\u904B\u7528)", desc: "\u73FE\u5834\u30FB\u5171\u7528\u7AEF\u672B \u2014 \u6700\u3082\u5B89\u5B9A\u3057\u305F\u7248", count: 3, color: "#22c55e", devices: ["CDX-FLD-103", "CDX-KSK-201", "CDX-KSK-202"] }
];
const sColor = (s) => s === "online" ? "#22c55e" : s === "offline" ? "#94a3b8" : "#f59e0b";
const sBg = (s) => s === "online" ? "#f0fdf4" : s === "offline" ? "#f8fafc" : "#fffbeb";
const sLabel = (s) => s === "online" ? "\u7A3C\u50CD\u4E2D" : s === "offline" ? "\u30AA\u30D5\u30E9\u30A4\u30F3" : "\u8B66\u544A";
const jColor = (s) => s === "succeeded" ? "#22c55e" : s === "running" ? "#3b82f6" : s === "failed" ? "#ef4444" : "#94a3b8";
const jBg = (s) => s === "succeeded" ? "#f0fdf4" : s === "running" ? "#eff6ff" : s === "failed" ? "#fef2f2" : "#f8fafc";
const jLabel = (s) => s === "succeeded" ? "\u6210\u529F" : s === "running" ? "\u5B9F\u884C\u4E2D" : s === "failed" ? "\u5931\u6557" : s === "cancelled" ? "\u30AD\u30E3\u30F3\u30BB\u30EB" : s;
const aColor = (l) => l === "critical" ? "#ef4444" : l === "warn" ? "#f59e0b" : "#3b82f6";
const onlineN = DEVICES_DATA.filter((d) => d.status === "online").length;
const offlineN = DEVICES_DATA.filter((d) => d.status === "offline").length;
const warnN = DEVICES_DATA.filter((d) => d.status === "warning").length;
const oldAgentN = DEVICES_DATA.filter((d) => d.agent !== "0.2.0").length;
const aaDisabledN = DEVICES_DATA.filter((d) => d.apparmor !== "\u6709\u52B9").length;
const usageColor = (v) => v > 80 ? "#ef4444" : v > 60 ? "#f59e0b" : "#22c55e";
const cardStyle = { background: "#fff", borderRadius: 12, border: "1px solid #e8ecf1", padding: "16px 18px" };
const thStyle = { textAlign: "left", padding: "7px 8px", color: "#94a3b8", fontWeight: 500, fontSize: 11 };
const tdStyle = { padding: "8px", fontSize: 12 };
Object.assign(window, {
  DEVICES_DATA,
  ISO_JOBS_DATA,
  ALERTS_DATA,
  AUDIT_LOG,
  POLICIES,
  RINGS_DATA,
  sColor,
  sBg,
  sLabel,
  jColor,
  jBg,
  jLabel,
  aColor,
  onlineN,
  offlineN,
  warnN,
  oldAgentN,
  aaDisabledN,
  usageColor,
  cardStyle,
  thStyle,
  tdStyle
});

/* === proto-page-dashboard.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const DashboardPage = () => {
  const [liveData, setLiveData] = React.useState(null);
  React.useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/v1/dashboard", { signal: ctrl.signal }).then((r) => r.ok ? r.json() : null).then((d) => {
      if (d) setLiveData(d);
    }).catch(() => {
    });
    return () => ctrl.abort();
  }, []);
  const totalDevices = liveData ? liveData.devices.total : DEVICES_DATA.length;
  const liveOnline = liveData ? liveData.devices.online : onlineN;
  const liveOffline = liveData ? liveData.devices.offline : offlineN;
  const liveWarning = liveData ? liveData.devices.warning : warnN;
  const totalIso = liveData ? liveData.iso_builds.total : ISO_JOBS_DATA.length;
  const isoSucceeded = liveData ? liveData.iso_builds.succeeded : ISO_JOBS_DATA.filter((j) => j.status === "succeeded").length;
  const isoRunning = liveData ? liveData.iso_builds.running : ISO_JOBS_DATA.filter((j) => j.status === "running").length;
  const liveTag = liveData ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#d1fae5", color: "#065f46", marginLeft: 4 } }, "LIVE") : null;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 } }, [
    { label: "\u7BA1\u7406\u7AEF\u672B\u6570", val: totalDevices, unit: "\u53F0", color: "#2563eb", sub: "5\u62E0\u70B9 / 3\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB" },
    { label: "\u30AA\u30F3\u30E9\u30A4\u30F3", val: liveOnline, unit: "\u53F0", color: "#22c55e", sub: `${liveOffline} \u505C\u6B62 / ${liveWarning} \u8B66\u544A` },
    { label: "ISO \u30D3\u30EB\u30C9", val: totalIso, unit: "\u4EF6", color: "#8b5cf6", sub: `${isoSucceeded} \u6210\u529F / ${isoRunning} \u5B9F\u884C\u4E2D` },
    { label: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u9069\u5408", val: Math.round((DEVICES_DATA.length - aaDisabledN) / Math.max(DEVICES_DATA.length, 1) * 100), unit: "%", color: aaDisabledN > 0 ? "#f59e0b" : "#22c55e", sub: `AppArmor\u672A\u9069\u7528: ${aaDisabledN}\u53F0` },
    { label: "Agent\u672A\u66F4\u65B0", val: oldAgentN, unit: "\u53F0", color: oldAgentN > 0 ? "#f59e0b" : "#22c55e", sub: "\u6700\u65B0: v0.2.0" }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 4 } }, s.label, i < 3 ? liveTag : null), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 3 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 28, fontWeight: 700, color: s.color } }, s.val), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#94a3b8" } }, s.unit)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 2 } }, s.sub)))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "\u30A2\u30E9\u30FC\u30C8\u30FB\u901A\u77E5"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#94a3b8" } }, "\u672A\u5BFE\u5FDC: ", ALERTS_DATA.filter((a) => !a.ack).length, "\u4EF6")), ALERTS_DATA.slice(0, 5).map((a, i) => /* @__PURE__ */ React.createElement("div", { key: a.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: aColor(a.level), flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, color: "#475569" } }, a.msg), /* @__PURE__ */ React.createElement("span", { style: { color: "#cbd5e1", fontSize: 11, flexShrink: 0 } }, a.time.split(" ")[1]), !a.ack && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#fef2f2", color: "#ef4444", fontWeight: 500 } }, "\u672A\u5BFE\u5FDC")))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "\u7AEF\u672B\u4E00\u89A7"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#2563eb", cursor: "pointer" } }, "\u7AEF\u672B\u7BA1\u7406 \u2192")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid #f1f5f9" } }, ["\u7AEF\u672BID", "\u62E0\u70B9", "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", "\u72B6\u614B", "Agent", "\u30EA\u30F3\u30B0", "\u6700\u7D42HB"].map(
    (h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)
  ))), /* @__PURE__ */ React.createElement("tbody", null, DEVICES_DATA.map((d) => /* @__PURE__ */ React.createElement("tr", { key: d.id, style: { borderBottom: "1px solid #f8fafc" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500 }) }, d.id), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, d.location), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" } }, d.profile)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: sBg(d.status), color: sColor(d.status) } }, /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: sColor(d.status) } }), sLabel(d.status))), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: d.agent === "0.2.0" ? "#475569" : "#f59e0b", fontWeight: d.agent !== "0.2.0" ? 600 : 400 }) }, "v", d.agent), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#64748b", fontSize: 11 }) }, d.ring), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8", fontSize: 11 }) }, d.lastHb.split(" ")[1])))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "ISO \u914D\u5E03\u30B8\u30E7\u30D6"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#2563eb", cursor: "pointer" } }, "ISO\u914D\u5E03 \u2192")), ISO_JOBS_DATA.slice(0, 4).map((j) => /* @__PURE__ */ React.createElement("div", { key: j.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f8fafc" } }, /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: 8, background: jBg(j.status), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 } }, "\u{1F4BF}"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 500, color: "#0f172a" } }, j.profile, " ", /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8" } }, "#", j.id.slice(0, 8))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8" } }, j.gitRef, " \xB7 ", j.requestedBy, " \xB7 ", j.createdAt.split(" ")[0])), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: jBg(j.status), color: jColor(j.status) } }, jLabel(j.status))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3"), [
    { label: "AppArmor", val: `${DEVICES_DATA.length - aaDisabledN}/${DEVICES_DATA.length}`, ok: aaDisabledN === 0 },
    { label: "Agent\u6700\u65B0", val: `${DEVICES_DATA.length - oldAgentN}/${DEVICES_DATA.length}`, ok: oldAgentN === 0 },
    { label: "HMAC\u7F72\u540D", val: "\u6709\u52B9", ok: true },
    { label: "\u30DD\u30EA\u30B7\u30FC", val: "\u9069\u7528\u6E08", ok: true }
  ].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b" } }, r.label), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: r.ok ? "#22c55e" : "#f59e0b" } }, r.val)))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u66F4\u65B0\u30EA\u30F3\u30B0"), RINGS_DATA.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b" } }, r.name.split(" (")[0]), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: r.color } }, r.count)), /* @__PURE__ */ React.createElement("div", { style: { height: 5, background: "#f1f5f9", borderRadius: 3 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${r.count / DEVICES_DATA.length * 100}%`, background: r.color, borderRadius: 3 } })))))))));
};
window.DashboardPage = DashboardPage;

/* === proto-page-devices.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const DevicesPage = () => {
  const [selected, setSelected] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [groupBy, setGroupBy] = React.useState("none");
  const [checkedIds, setCheckedIds] = React.useState([]);
  const [autoRefresh, setAutoRefresh] = React.useState(10);
  const [lastRefresh, setLastRefresh] = React.useState(Date.now());
  const [refreshCount, setRefreshCount] = React.useState(0);
  const [showBulkAction, setShowBulkAction] = React.useState(null);
  const [actionLog, setActionLog] = React.useState([]);
  const [showExport, setShowExport] = React.useState(false);
  const [alertThresholds, setAlertThresholds] = React.useState({ cpu: 80, mem: 80, disk: 90 });
  const [showThresholdEdit, setShowThresholdEdit] = React.useState(false);
  const [liveDevices, setLiveDevices] = React.useState(DEVICES_DATA.map((d) => __spreadProps(__spreadValues({}, d), { _lastSeen: Date.now() - Math.random() * 3e5 })));
  React.useEffect(() => {
    if (autoRefresh === 0) return;
    const interval = setInterval(() => {
      setLiveDevices((prev) => prev.map((d) => __spreadProps(__spreadValues({}, d), {
        cpu: d.status === "offline" ? 0 : Math.max(0, Math.min(100, d.cpu + Math.floor(Math.random() * 11) - 5)),
        mem: d.status === "offline" ? 0 : Math.max(0, Math.min(100, d.mem + Math.floor(Math.random() * 5) - 2)),
        _lastSeen: d.status === "offline" ? d._lastSeen : Date.now() - Math.floor(Math.random() * 5e3)
      })));
      setLastRefresh(Date.now());
      setRefreshCount((c) => c + 1);
    }, autoRefresh * 1e3);
    return () => clearInterval(interval);
  }, [autoRefresh]);
  const manualRefresh = () => {
    setLiveDevices((prev) => prev.map((d) => __spreadProps(__spreadValues({}, d), {
      cpu: d.status === "offline" ? 0 : Math.max(0, Math.min(100, d.cpu + Math.floor(Math.random() * 11) - 5)),
      mem: d.status === "offline" ? 0 : Math.max(0, Math.min(100, d.mem + Math.floor(Math.random() * 5) - 2)),
      _lastSeen: d.status === "offline" ? d._lastSeen : Date.now()
    })));
    setLastRefresh(Date.now());
    setRefreshCount((c) => c + 1);
  };
  const timeSince = (ts) => {
    const sec = Math.floor((Date.now() - ts) / 1e3);
    if (sec < 5) return "\u305F\u3063\u305F\u4ECA";
    if (sec < 60) return sec + "\u79D2\u524D";
    if (sec < 3600) return Math.floor(sec / 60) + "\u5206\u524D";
    return Math.floor(sec / 3600) + "\u6642\u9593\u524D";
  };
  const filtered = liveDevices.filter((d) => filter === "all" || d.status === filter).filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.id.toLowerCase().includes(s) || d.hostname.toLowerCase().includes(s) || d.location.toLowerCase().includes(s) || d.profile.toLowerCase().includes(s);
  });
  const groups = groupBy === "none" ? { "\u5168\u7AEF\u672B": filtered } : groupBy === "location" ? filtered.reduce((acc, d) => {
    (acc[d.location] = acc[d.location] || []).push(d);
    return acc;
  }, {}) : groupBy === "profile" ? filtered.reduce((acc, d) => {
    (acc[d.profile] = acc[d.profile] || []).push(d);
    return acc;
  }, {}) : groupBy === "ring" ? filtered.reduce((acc, d) => {
    (acc[d.ring] = acc[d.ring] || []).push(d);
    return acc;
  }, {}) : { "\u5168\u7AEF\u672B": filtered };
  const toggleCheck = (id) => setCheckedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleAll = () => setCheckedIds(checkedIds.length === filtered.length ? [] : filtered.map((d) => d.id));
  const executeBulkAction = (action) => {
    const targets = checkedIds;
    const now = (/* @__PURE__ */ new Date()).toLocaleTimeString("ja-JP");
    const newLogs = targets.map((id) => ({ at: now, device: id, action, status: "\u5B9F\u884C\u4E2D" }));
    setActionLog((prev) => [...newLogs, ...prev]);
    setShowBulkAction(null);
    setCheckedIds([]);
    setTimeout(() => {
      setActionLog((prev) => prev.map((l) => newLogs.find((n) => n.device === l.device && n.action === l.action) ? __spreadProps(__spreadValues({}, l), { status: "\u5B8C\u4E86" }) : l));
    }, 2e3);
  };
  const executeDeviceAction = (deviceId, action) => {
    const now = (/* @__PURE__ */ new Date()).toLocaleTimeString("ja-JP");
    setActionLog((prev) => [{ at: now, device: deviceId, action, status: "\u5B9F\u884C\u4E2D" }, ...prev]);
    setTimeout(() => {
      setActionLog((prev) => prev.map((l, i) => i === 0 ? __spreadProps(__spreadValues({}, l), { status: "\u5B8C\u4E86" }) : l));
    }, 1500);
  };
  const hasAlert = (d) => d.status !== "offline" && (d.cpu >= alertThresholds.cpu || d.mem >= alertThresholds.mem || d.disk >= alertThresholds.disk);
  const dev = selected ? liveDevices.find((d) => d.id === selected) : null;
  if (dev) {
    const devActions = actionLog.filter((l) => l.device === dev.id);
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setSelected(null), style: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 } }, "\u2190 \u7AEF\u672B\u4E00\u89A7\u3078\u623B\u308B"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: "50%", background: sColor(dev.status) } }), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, dev.id), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, padding: "2px 8px", borderRadius: 6, background: sBg(dev.status), color: sColor(dev.status), fontWeight: 500 } }, sLabel(dev.status)), hasAlert(dev) && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#fef2f2", color: "#ef4444", fontWeight: 600 } }, "\u30EA\u30BD\u30FC\u30B9\u8B66\u544A")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("tbody", null, [["\u30DB\u30B9\u30C8\u540D", dev.hostname], ["\u62E0\u70B9", dev.location], ["IP\u30A2\u30C9\u30EC\u30B9", dev.ip], ["\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", dev.profile], ["OS", dev.os], ["cdx-agent", "v" + dev.agent], ["\u66F4\u65B0\u30EA\u30F3\u30B0", dev.ring], ["AppArmor", dev.apparmor], ["\u6700\u7D42\u901A\u4FE1", timeSince(dev._lastSeen)]].map(([k, v], i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid #f8fafc" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", color: "#94a3b8", fontWeight: 500, width: 140, fontSize: 12 } }, k), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", color: k === "AppArmor" ? v === "\u6709\u52B9" ? "#22c55e" : "#ef4444" : "#0f172a", fontWeight: k === "AppArmor" ? 600 : 400, fontSize: 12 } }, v))))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" } }, ["Agent\u66F4\u65B0\u6307\u793A", "\u30DD\u30EA\u30B7\u30FC\u518D\u914D\u4FE1", "\u30EA\u30D6\u30FC\u30C8\u6307\u793A", "\u30A4\u30F3\u30D9\u30F3\u30C8\u30EA\u53D6\u5F97", "heartbeat\u8981\u6C42"].map((a) => /* @__PURE__ */ React.createElement("button", { key: a, onClick: () => executeDeviceAction(dev.id, a), style: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer", background: "#fff", color: "#475569" } }, a)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30EA\u30BD\u30FC\u30B9\u4F7F\u7528\u72B6\u6CC1"), [{ label: "CPU", val: dev.cpu }, { label: "\u30E1\u30E2\u30EA", val: dev.mem }, { label: "\u30C7\u30A3\u30B9\u30AF", val: dev.disk }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#475569" } }, r.label), /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 6 } }, dev.status !== "offline" && r.val >= alertThresholds[r.label === "CPU" ? "cpu" : r.label === "\u30E1\u30E2\u30EA" ? "mem" : "disk"] && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, color: "#ef4444" } }, "\u95BE\u5024\u8D85\u904E"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: usageColor(r.val) } }, dev.status === "offline" ? "\u2014" : r.val + "%"))), /* @__PURE__ */ React.createElement("div", { style: { height: 8, background: "#f1f5f9", borderRadius: 4, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: dev.status === "offline" ? "0%" : r.val + "%", background: usageColor(r.val), borderRadius: 4, transition: "width 500ms" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 0, bottom: 0, left: alertThresholds[r.label === "CPU" ? "cpu" : r.label === "\u30E1\u30E2\u30EA" ? "mem" : "disk"] + "%", width: 2, background: "#ef4444", opacity: 0.5 } })))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 4 } }, "\u95BE\u5024: CPU ", alertThresholds.cpu, "% / MEM ", alertThresholds.mem, "% / Disk ", alertThresholds.disk, "%")), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u63A5\u7D9A\u30BF\u30A4\u30E0\u30E9\u30A4\u30F3 (\u76F4\u8FD11\u6642\u9593)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2, height: 24, borderRadius: 4, overflow: "hidden" } }, Array.from({ length: 60 }, (_, i) => {
      const isOnline = dev.status !== "offline" || i < 40;
      const isRecent = i > 55;
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, background: isOnline ? isRecent ? "#22c55e" : "#86efac" : "#e2e8f0", transition: "background 300ms" } });
    })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 4 } }, /* @__PURE__ */ React.createElement("span", null, "60\u5206\u524D"), /* @__PURE__ */ React.createElement("span", null, "30\u5206\u524D"), /* @__PURE__ */ React.createElement("span", null, "\u73FE\u5728"))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30CF\u30FC\u30C8\u30D3\u30FC\u30C8\u5C65\u6B74"), dev.status !== "offline" ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, Array.from({ length: 8 }, (_, i) => ({ time: `09:${String(29 - i).padStart(2, "0")}`, status: "ok" })).map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 11 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e" } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", width: 50 } }, h.time), /* @__PURE__ */ React.createElement("span", { style: { color: "#475569" } }, "heartbeat received")))) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#94a3b8" } }, "\u7AEF\u672B\u30AA\u30D5\u30E9\u30A4\u30F3 \u2014 \u30CF\u30FC\u30C8\u30D3\u30FC\u30C8\u672A\u53D7\u4FE1")))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30A4\u30F3\u30D9\u30F3\u30C8\u30EA\u60C5\u5831"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 } }, [{ k: "\u30AB\u30FC\u30CD\u30EB", v: "6.1.0-20-amd64" }, { k: "\u30A2\u30FC\u30AD\u30C6\u30AF\u30C1\u30E3", v: "x86_64" }, { k: "RAM", v: "16 GB DDR4" }, { k: "\u30B9\u30C8\u30EC\u30FC\u30B8", v: "256 GB NVMe SSD" }, { k: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF", v: "Realtek RTL8111" }, { k: "\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7", v: "XFCE 4.18" }, { k: "\u30D6\u30E9\u30A6\u30B6", v: "Chromium 124" }, { k: "ONLYOFFICE", v: "8.0.1" }].map((item, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { padding: "8px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { color: "#94a3b8", fontSize: 10, marginBottom: 2 } }, item.k), /* @__PURE__ */ React.createElement("div", { style: { color: "#0f172a", fontWeight: 500 } }, item.v))))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u7AEF\u672B\u30B3\u30DE\u30F3\u30C9\u5C65\u6B74"), devActions.length > 0 ? /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid #f1f5f9" } }, ["\u65E5\u6642", "\u30A2\u30AF\u30B7\u30E7\u30F3", "\u30B9\u30C6\u30FC\u30BF\u30B9"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, devActions.map((a, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f8fafc" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, a.at), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, a.action), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "\u5B8C\u4E86" ? "#f0fdf4" : "#eff6ff", color: a.status === "\u5B8C\u4E86" ? "#22c55e" : "#3b82f6" } }, a.status)))))) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#94a3b8" } }, "\u3053\u306E\u7AEF\u672B\u3078\u306E\u30B3\u30DE\u30F3\u30C9\u5C65\u6B74\u306F\u3042\u308A\u307E\u305B\u3093")));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, "\u7AEF\u672B\u7BA1\u7406"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#94a3b8", margin: "2px 0 0" } }, "\u767B\u9332\u6E08\u307F\u7AEF\u672B\u306E\u30D5\u30EA\u30FC\u30C8\u7BA1\u7406\u30FB\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u76E3\u8996\u30FB\u30A4\u30F3\u30D9\u30F3\u30C8\u30EA")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: autoRefresh > 0 ? "#f0fdf4" : "#f8fafc", border: "1px solid #e8ecf1" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: autoRefresh > 0 ? "#22c55e" : "#94a3b8", animation: autoRefresh > 0 ? "pulse 2s infinite" : "none" } }), /* @__PURE__ */ React.createElement("select", { value: autoRefresh, onChange: (e) => setAutoRefresh(Number(e.target.value)), style: { border: "none", background: "transparent", fontSize: 11, color: "#475569", cursor: "pointer", outline: "none" } }, /* @__PURE__ */ React.createElement("option", { value: 0 }, "\u624B\u52D5\u66F4\u65B0"), /* @__PURE__ */ React.createElement("option", { value: 5 }, "5\u79D2"), /* @__PURE__ */ React.createElement("option", { value: 10 }, "10\u79D2"), /* @__PURE__ */ React.createElement("option", { value: 30 }, "30\u79D2"), /* @__PURE__ */ React.createElement("option", { value: 60 }, "60\u79D2"))), /* @__PURE__ */ React.createElement("button", { onClick: manualRefresh, style: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer", background: "#fff", color: "#2563eb", fontWeight: 600 } }, "\u{1F504} \u66F4\u65B0"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#cbd5e1" } }, "#", refreshCount))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 14 } }, [
    { label: "\u7DCF\u7AEF\u672B\u6570", val: liveDevices.length + "\u53F0", color: "#2563eb" },
    { label: "\u62E0\u70B9\u6570", val: [...new Set(liveDevices.map((d) => d.location))].length + "\u62E0\u70B9", color: "#8b5cf6" },
    { label: "\u30AA\u30F3\u30E9\u30A4\u30F3", val: liveDevices.filter((d) => d.status === "online").length + "\u53F0", color: "#22c55e" },
    { label: "\u30AA\u30D5\u30E9\u30A4\u30F3", val: liveDevices.filter((d) => d.status === "offline").length + "\u53F0", color: "#94a3b8" },
    { label: "\u8B66\u544A", val: liveDevices.filter((d) => d.status === "warning").length + "\u53F0", color: "#f59e0b" },
    { label: "\u30EA\u30BD\u30FC\u30B9\u8B66\u544A", val: liveDevices.filter((d) => hasAlert(d)).length + "\u53F0", color: liveDevices.filter((d) => hasAlert(d)).length > 0 ? "#ef4444" : "#22c55e" }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: __spreadProps(__spreadValues({}, cardStyle), { padding: "10px 14px", textAlign: "center" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: s.color } }, s.val), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8" } }, s.label)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" } }, [{ id: "all", label: `\u5168\u3066 (${liveDevices.length})` }, { id: "online", label: `\u7A3C\u50CD` }, { id: "offline", label: `\u505C\u6B62` }, { id: "warning", label: `\u8B66\u544A` }].map((f) => /* @__PURE__ */ React.createElement("button", { key: f.id, onClick: () => setFilter(f.id), style: {
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid #e8ecf1",
    fontSize: 11,
    cursor: "pointer",
    background: filter === f.id ? "#eff6ff" : "#fff",
    color: filter === f.id ? "#2563eb" : "#64748b",
    fontWeight: filter === f.id ? 600 : 400
  } }, f.label)), /* @__PURE__ */ React.createElement("span", { style: { color: "#e2e8f0" } }, "|"), /* @__PURE__ */ React.createElement("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "\u{1F50D} \u7AEF\u672BID / \u30DB\u30B9\u30C8\u540D / \u62E0\u70B9\u3067\u691C\u7D22...", style: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, width: 220, color: "#0f172a" } }), /* @__PURE__ */ React.createElement("select", { value: groupBy, onChange: (e) => setGroupBy(e.target.value), style: { padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, color: "#475569" } }, /* @__PURE__ */ React.createElement("option", { value: "none" }, "\u30B0\u30EB\u30FC\u30D7\u306A\u3057"), /* @__PURE__ */ React.createElement("option", { value: "location" }, "\u62E0\u70B9\u5225"), /* @__PURE__ */ React.createElement("option", { value: "profile" }, "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225"), /* @__PURE__ */ React.createElement("option", { value: "ring" }, "\u30EA\u30F3\u30B0\u5225")), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowThresholdEdit(!showThresholdEdit), style: { padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u2699 \u95BE\u5024"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowExport(!showExport), style: { padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u{1F4E5} \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8"))), showThresholdEdit && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12, padding: "12px 16px" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u30EA\u30BD\u30FC\u30B9\u30A2\u30E9\u30FC\u30C8\u95BE\u5024\u8A2D\u5B9A"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16 } }, [{ k: "cpu", label: "CPU" }, { k: "mem", label: "\u30E1\u30E2\u30EA" }, { k: "disk", label: "\u30C7\u30A3\u30B9\u30AF" }].map((t) => /* @__PURE__ */ React.createElement("div", { key: t.k, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b", width: 50 } }, t.label), /* @__PURE__ */ React.createElement("input", { type: "range", min: 50, max: 100, value: alertThresholds[t.k], onChange: (e) => setAlertThresholds((prev) => __spreadProps(__spreadValues({}, prev), { [t.k]: Number(e.target.value) })), style: { width: 100 } }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "#ef4444", width: 35 } }, alertThresholds[t.k], "%"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowThresholdEdit(false), style: { marginLeft: "auto", padding: "4px 12px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, cursor: "pointer" } }, "\u9069\u7528"))), showExport && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12, padding: "14px 16px" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u{1F4E5} \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u5F62\u5F0F ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#94a3b8", fontWeight: 400 } }, "\u5BFE\u8C61: ", filtered.length, "\u53F0")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const header = "\u7AEF\u672BID,\u30B7\u30EA\u30A2\u30EB\u756A\u53F7,\u30DB\u30B9\u30C8\u540D,\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB,\u8A2D\u7F6E\u5834\u6240,IP\u30A2\u30C9\u30EC\u30B9,OS,Agent,\u30EA\u30F3\u30B0,AppArmor,\u72B6\u614B,\u6700\u7D42\u901A\u4FE1";
    const rows = filtered.map((d) => [d.id, d.serial || "", d.hostname, d.profile, d.location, d.ip, d.os, d.agent, d.ring, d.apparmor, d.status, d.lastHb].join(","));
    const blob = new Blob(["\uFEFF" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cdx-devices-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    setShowExport(false);
  }, style: { padding: "7px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "\u{1F4C4} \u7AEF\u672B\u4E00\u89A7CSV\uFF08\u5168\u30D5\u30A3\u30FC\u30EB\u30C9\uFF09"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const header = "\u30B7\u30EA\u30A2\u30EB\u756A\u53F7,\u30DB\u30B9\u30C8\u540D,\u7AEF\u672BID,\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB,\u8A2D\u7F6E\u5834\u6240,\u72B6\u614B,\u767B\u9332\u65E5";
    const rows = filtered.map((d) => [d.serial || "", d.hostname, d.id, d.profile, d.location, d.status, "2026-05-10"].join(","));
    const blob = new Blob(["\uFEFF" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cdx-serial-hostname-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    a.click();
    setShowExport(false);
  }, style: { padding: "7px 14px", borderRadius: 8, background: "#22c55e", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "\u{1F517} \u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u2194\u30DB\u30B9\u30C8\u540D \u7D10\u4ED8\u3051\u53F0\u5E33"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const data = filtered.map((d) => ({ id: d.id, serial: d.serial || "", hostname: d.hostname, profile: d.profile, location: d.location, status: d.status }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cdx-devices-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    a.click();
    setShowExport(false);
  }, style: { padding: "7px 14px", borderRadius: 8, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" } }, "{ }", " JSON"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowExport(false), style: { padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#94a3b8" } }, "\xD7")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 10, color: "#94a3b8" } }, "\u203B\u300C\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u2194\u30DB\u30B9\u30C8\u540D \u7D10\u4ED8\u3051\u53F0\u5E33\u300D\u306F\u5C55\u958B\u5F8C\u306EIT\u8CC7\u7523\u7BA1\u7406\u53F0\u5E33\u3068\u3057\u3066\u5229\u7528\u3067\u304D\u307E\u3059")), checkedIds.length > 0 && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12, padding: "10px 16px", background: "#eff6ff", display: "flex", alignItems: "center", gap: 10 }) }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "#2563eb" } }, checkedIds.length, "\u53F0 \u9078\u629E\u4E2D"), /* @__PURE__ */ React.createElement("span", { style: { color: "#bfdbfe" } }, "|"), ["Agent\u66F4\u65B0\u6307\u793A", "\u30DD\u30EA\u30B7\u30FC\u518D\u914D\u4FE1", "\u30EA\u30D6\u30FC\u30C8\u6307\u793A", "\u30A4\u30F3\u30D9\u30F3\u30C8\u30EA\u53D6\u5F97"].map((a) => /* @__PURE__ */ React.createElement("button", { key: a, onClick: () => executeBulkAction(a), style: { padding: "4px 10px", borderRadius: 5, border: "1px solid #bfdbfe", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb", fontWeight: 500 } }, a)), /* @__PURE__ */ React.createElement("button", { onClick: () => setCheckedIds([]), style: { marginLeft: "auto", padding: "4px 10px", borderRadius: 5, border: "none", fontSize: 10, cursor: "pointer", background: "transparent", color: "#94a3b8" } }, "\u9078\u629E\u89E3\u9664")), Object.entries(groups).map(([groupName, devices]) => /* @__PURE__ */ React.createElement("div", { key: groupName, style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12 }) }, groupBy !== "none" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, groupName, " ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 400, color: "#94a3b8" } }, "(", devices.length, "\u53F0)")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, /* @__PURE__ */ React.createElement("th", { style: __spreadProps(__spreadValues({}, thStyle), { width: 30 }) }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: checkedIds.length === filtered.length && filtered.length > 0, onChange: toggleAll })), ["\u7AEF\u672BID", "\u62E0\u70B9", "\u30DB\u30B9\u30C8\u540D", "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", "Agent", "\u30EA\u30F3\u30B0", "CPU", "MEM", "Disk", "\u72B6\u614B", "\u6700\u7D42\u901A\u4FE1"].map(
    (h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)
  ), /* @__PURE__ */ React.createElement("th", { style: thStyle }, "\u64CD\u4F5C"))), /* @__PURE__ */ React.createElement("tbody", null, devices.map((d) => /* @__PURE__ */ React.createElement("tr", { key: d.id, style: { borderTop: "1px solid #f1f5f9", background: hasAlert(d) ? "#fefce8" : "" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { width: 30 }) }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: checkedIds.includes(d.id), onChange: () => toggleCheck(d.id) })), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500, cursor: "pointer" }), onClick: () => setSelected(d.id) }, d.id), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, d.location), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, d.hostname), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" } }, d.profile)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: d.agent === "0.2.0" ? "#475569" : "#f59e0b", fontWeight: d.agent !== "0.2.0" ? 600 : 400 }) }, "v", d.agent), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#64748b", fontSize: 11 }) }, d.ring), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11 }) }, /* @__PURE__ */ React.createElement("span", { style: { color: usageColor(d.cpu), fontWeight: d.cpu >= alertThresholds.cpu ? 600 : 400 } }, d.status === "offline" ? "\u2014" : d.cpu + "%")), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11 }) }, /* @__PURE__ */ React.createElement("span", { style: { color: usageColor(d.mem), fontWeight: d.mem >= alertThresholds.mem ? 600 : 400 } }, d.status === "offline" ? "\u2014" : d.mem + "%")), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11 }) }, /* @__PURE__ */ React.createElement("span", { style: { color: usageColor(d.disk), fontWeight: d.disk >= alertThresholds.disk ? 600 : 400 } }, d.status === "offline" ? "\u2014" : d.disk + "%")), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: sBg(d.status), color: sColor(d.status) } }, /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: sColor(d.status) } }), sLabel(d.status))), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 10, color: d.status === "offline" ? "#94a3b8" : "#475569" }) }, timeSince(d._lastSeen)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 3 } }, /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    executeDeviceAction(d.id, "heartbeat\u8981\u6C42");
  }, title: "heartbeat\u8981\u6C42", style: { padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb" } }, "\u{1F493}"), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    executeDeviceAction(d.id, "\u30DD\u30EA\u30B7\u30FC\u518D\u914D\u4FE1");
  }, title: "\u30DD\u30EA\u30B7\u30FC\u518D\u914D\u4FE1", style: { padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#f59e0b" } }, "\u{1F4DC}"), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    setSelected(d.id);
  }, title: "\u8A73\u7D30", style: { padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u2192"))))))))), actionLog.length > 0 && /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, "\u30B3\u30DE\u30F3\u30C9\u5B9F\u884C\u5C65\u6B74"), /* @__PURE__ */ React.createElement("button", { onClick: () => setActionLog([]), style: { fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" } }, "\u30AF\u30EA\u30A2")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid #f1f5f9" } }, ["\u65E5\u6642", "\u7AEF\u672BID", "\u30A2\u30AF\u30B7\u30E7\u30F3", "\u30B9\u30C6\u30FC\u30BF\u30B9"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, actionLog.slice(0, 20).map((a, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f8fafc" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, a.at), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500 }) }, a.device), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, a.action), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "\u5B8C\u4E86" ? "#f0fdf4" : "#eff6ff", color: a.status === "\u5B8C\u4E86" ? "#22c55e" : "#3b82f6" } }, a.status))))))));
};
window.DevicesPage = DevicesPage;

/* === proto-page-iso.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const DIST_METHODS = [
  {
    id: "download",
    label: "\u60C5\u30B7\u30B9\u691C\u8A3C\u7528",
    method: "WebUI / S3 \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u914D\u5E03",
    desc: "\u60C5\u30B7\u30B9\u304CISO\u3092\u53D6\u5F97\u3001SHA256\u7167\u5408\u3001VM\u691C\u8A3C\u307E\u305F\u306FUSB\u4F5C\u6210\u3078\u9032\u3081\u308B",
    icon: "\u{1F52C}",
    color: "#8b5cf6",
    phase: 1,
    steps: [
      { label: "\u7BA1\u7406\u8005\u30ED\u30B0\u30A4\u30F3", desc: "ISO Builder UI \u306B\u7BA1\u7406\u8005\u3067\u30ED\u30B0\u30A4\u30F3" },
      { label: "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u9078\u629E", desc: "standard / field / admin \u306A\u3069 profile \u3092\u9078\u629E" },
      { label: "Git Ref \u6307\u5B9A", desc: "\u5BFE\u8C61\u306E git_ref \u307E\u305F\u306F\u30EA\u30EA\u30FC\u30B9\u7248\u3092\u6307\u5B9A" },
      { label: "ISO \u30D3\u30EB\u30C9\u958B\u59CB", desc: "ISO \u30D3\u30EB\u30C9\u30B8\u30E7\u30D6\u3092\u958B\u59CB" },
      { label: "\u30D3\u30EB\u30C9\u7D50\u679C\u78BA\u8A8D", desc: "ISO / build.log / SHA256 \u3092\u78BA\u8A8D" },
      { label: "ISO \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9", desc: "S3/MinIO \u306E\u7F72\u540D\u4ED8\u304D URL \u304B\u3089\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9" },
      { label: "SHA256 \u7167\u5408", desc: "\u30ED\u30FC\u30AB\u30EB\u3067 SHA256 \u3092\u7167\u5408" },
      { label: "\u6B21\u5DE5\u7A0B\u3078", desc: "VM \u691C\u8A3C\u307E\u305F\u306F USB \u4F5C\u6210\u3078\u9032\u3081\u308B" },
      { label: "\u7BA1\u7406\u53F0\u5E33\u8A18\u9332", desc: "\u30D3\u30EB\u30C9\u8005\u30FB\u65E5\u6642\u30FBprofile\u30FBSHA256 \u3092\u8A18\u9332" }
    ],
    logs: [
      "[09:30:00] === \u60C5\u30B7\u30B9\u691C\u8A3C\u7528: WebUI/S3 \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u914D\u5E03 ===",
      "[09:30:01] Step 1: ISO Builder UI \u306B\u7BA1\u7406\u8005\u3067\u30ED\u30B0\u30A4\u30F3",
      "[09:30:02]   \u8A8D\u8A3C\u65B9\u5F0F: HTTP Basic Auth (CDX_ADMIN_TOKEN)",
      "[09:30:03]   \u30ED\u30B0\u30A4\u30F3\u6210\u529F \u2014 \u30E6\u30FC\u30B6\u30FC: admin",
      "[09:30:04] Step 2: \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u9078\u629E",
      "[09:30:04]   \u9078\u629E: standard \u2014 \u672C\u793E\u30FB\u652F\u5E97\u5411\u3051",
      "[09:30:05] Step 3: Git Ref \u6307\u5B9A",
      "[09:30:05]   \u6307\u5B9A: v1.0.0-rc2 (tag)",
      "[09:30:06] Step 4: ISO \u30D3\u30EB\u30C9\u958B\u59CB",
      "[09:30:06]   POST /api/v1/iso-builds \u2192 \u30B8\u30E7\u30D6\u4F5C\u6210: b7a1c2d3",
      "[09:30:07]   Redis Queue \u306B\u30B8\u30E7\u30D6\u6295\u5165\u5B8C\u4E86",
      "[09:30:08]   build-worker \u8D77\u52D5: lb config --distribution bookworm --architectures amd64",
      "[09:30:15]   live-build \u5B9F\u884C\u4E2D...",
      "[09:30:30]   chroot \u74B0\u5883\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u5B8C\u4E86",
      "[09:30:45]   \u30D1\u30C3\u30B1\u30FC\u30B8\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB (base/desktop/business/security/support)",
      "[09:31:00]   hook \u5B9F\u884C: 0100-set-hostname / 0200-install-launcher / 0300-install-agent / 0400-security-hardening",
      "[09:31:30]   squashfs \u4F5C\u6210\u4E2D...",
      "[09:32:00]   ISO \u30A4\u30E1\u30FC\u30B8\u751F\u6210\u5B8C\u4E86",
      "[09:32:01] Step 5: \u30D3\u30EB\u30C9\u7D50\u679C\u78BA\u8A8D",
      "[09:32:02]   ISO: cdx-os-standard-v1.0.0-rc2.iso (1.8 GB)",
      "[09:32:03]   build.log: 342 \u884C \u2014 \u30A8\u30E9\u30FC\u306A\u3057",
      "[09:32:04]   SHA256: a1b2c3d4e5f6789012345678abcdef01234567890abcdef1234567890abcdef12",
      "[09:32:05]   MinIO \u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u5B8C\u4E86: iso/b7a1c2d3/",
      "[09:32:06] Step 6: ISO \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9",
      "[09:32:07]   presigned URL \u751F\u6210: https://minio.internal:9000/iso/b7a1c2d3/cdx-os-standard-v1.0.0-rc2.iso?X-Amz-...",
      "[09:32:08]   \u6709\u52B9\u671F\u9650: 1 \u6642\u9593",
      "[09:32:09]   \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u958B\u59CB...",
      "[09:32:40]   \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u5B8C\u4E86 (1.8 GB)",
      "[09:32:41] Step 7: SHA256 \u7167\u5408",
      "[09:32:42]   $ sha256sum cdx-os-standard-v1.0.0-rc2.iso",
      "[09:32:43]   \u30ED\u30FC\u30AB\u30EB:  a1b2c3d4e5f6789012345678abcdef01234567890abcdef1234567890abcdef12",
      "[09:32:44]   \u30B5\u30FC\u30D0\u30FC: a1b2c3d4e5f6789012345678abcdef01234567890abcdef1234567890abcdef12",
      "[09:32:45]   \u2705 SHA256 \u4E00\u81F4 \u2014 \u6574\u5408\u6027\u78BA\u8A8D\u5B8C\u4E86",
      "[09:32:46] Step 8: \u6B21\u5DE5\u7A0B\u3078",
      "[09:32:47]   \u2192 VM \u691C\u8A3C \u307E\u305F\u306F USB \u30E1\u30E2\u30EA\u4F5C\u6210 \u3078\u9032\u3081\u3066\u304F\u3060\u3055\u3044",
      "[09:32:48] Step 9: \u7BA1\u7406\u53F0\u5E33\u8A18\u9332",
      "[09:32:49]   \u{1F4CB} \u8A18\u9332\u5185\u5BB9:",
      "[09:32:49]     \u30D3\u30EB\u30C9\u8005: admin",
      "[09:32:49]     \u65E5\u6642: 2026-05-06 09:30:00 JST",
      "[09:32:49]     Profile: standard",
      "[09:32:49]     Git Ref: v1.0.0-rc2",
      "[09:32:49]     SHA256: a1b2c3d4...abcdef12",
      "[09:32:49]     \u30B8\u30E7\u30D6ID: b7a1c2d3",
      "[09:32:50]   \u76E3\u67FB\u30ED\u30B0\u306B\u8A18\u9332\u5B8C\u4E86 (iso_build_audit \u30C6\u30FC\u30D6\u30EB)",
      "[09:32:51] \u2705 \u60C5\u30B7\u30B9\u691C\u8A3C\u7528\u914D\u5E03\u30D7\u30ED\u30BB\u30B9\u5B8C\u4E86"
    ]
  },
  {
    id: "vm",
    label: "VM ISO\u30DE\u30A6\u30F3\u30C8",
    method: "\u4EEE\u60F3\u74B0\u5883\u914D\u5E03",
    desc: "\u691C\u8A3C\u30FB\u6559\u80B2\u30FBPoC\u30FB\u56DE\u5E30\u78BA\u8A8D\u3002USB/PXE\u914D\u5E03\u524D\u306E\u6A19\u6E96\u691C\u8A3C\u3068\u3057\u3066\u6271\u3046",
    icon: "\u{1F5A5}\uFE0F",
    color: "#22c55e",
    phase: 2,
    steps: [
      { label: "\u691C\u8A3C\u7528 VM \u4F5C\u6210", desc: "VirtualBox / VMware / KVM \u306B VM \u3092\u4F5C\u6210" },
      { label: "VM \u30B9\u30DA\u30C3\u30AF\u8A2D\u5B9A", desc: "CPU\u30FB\u30E1\u30E2\u30EA\u30FB\u30C7\u30A3\u30B9\u30AF\u3092\u6A19\u6E96\u7AEF\u672B\u76F8\u5F53\u306B\u8A2D\u5B9A" },
      { label: "ISO \u30DE\u30A6\u30F3\u30C8", desc: "ISO \u3092\u4EEE\u60F3 CD/DVD \u3068\u3057\u3066\u30DE\u30A6\u30F3\u30C8" },
      { label: "VM \u8D77\u52D5", desc: "ISO \u304B\u3089\u30D6\u30FC\u30C8\u958B\u59CB" },
      { label: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B9F\u884C", desc: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3092\u6700\u5F8C\u307E\u3067\u5B9F\u884C" },
      { label: "\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u78BA\u8A8D", desc: "\u521D\u56DE\u8D77\u52D5\u5F8C\u3001\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u8868\u793A\u3092\u78BA\u8A8D" },
      { label: "Construction Hub \u78BA\u8A8D", desc: "Construction Hub \u306E\u8D77\u52D5\u3092\u78BA\u8A8D" },
      { label: "cdx-agent \u767B\u9332\u78BA\u8A8D", desc: "\u4E2D\u592E\u7BA1\u7406\u3078\u306E\u767B\u9332\u3092\u78BA\u8A8D" },
      { label: "\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u4FDD\u5B58", desc: "\u554F\u984C\u306A\u3051\u308C\u3070 VM \u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u3092\u4FDD\u5B58" },
      { label: "\u6A19\u6E96\u691C\u8A3C\u5B8C\u4E86", desc: "USB / PXE \u914D\u5E03\u524D\u306E\u6A19\u6E96\u691C\u8A3C\u3068\u3057\u3066\u8A18\u9332" }
    ],
    logs: [
      "[11:00:00] === VM ISO\u30DE\u30A6\u30F3\u30C8\u914D\u5E03 ===",
      "[11:00:01] Step 1: \u691C\u8A3C\u7528 VM \u4F5C\u6210",
      "[11:00:02]   \u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0: VirtualBox 7.0",
      "[11:00:03]   VM\u540D: cdx-test-standard-rc2",
      "[11:00:04]   OS \u30BF\u30A4\u30D7: Debian 13 (64-bit)",
      "[11:00:05] Step 2: VM \u30B9\u30DA\u30C3\u30AF\u8A2D\u5B9A",
      "[11:00:06]   CPU: 2 vCPU",
      "[11:00:07]   \u30E1\u30E2\u30EA: 4096 MB",
      "[11:00:08]   \u30C7\u30A3\u30B9\u30AF: 32 GB (VDI, \u53EF\u5909\u30B5\u30A4\u30BA)",
      "[11:00:09]   \u30CD\u30C3\u30C8\u30EF\u30FC\u30AF: NAT (\u521D\u671F) \u2192 Bridged (\u691C\u8A3C\u6642)",
      "[11:00:10]   \u203B \u6A19\u6E96\u7AEF\u672B\u76F8\u5F53\u306E\u30B9\u30DA\u30C3\u30AF\u8A2D\u5B9A\u5B8C\u4E86",
      "[11:00:11] Step 3: ISO \u30DE\u30A6\u30F3\u30C8",
      "[11:00:12]   \u4EEE\u60F3 CD/DVD \u30C9\u30E9\u30A4\u30D6\u306B ISO \u3092\u8A2D\u5B9A:",
      "[11:00:12]   cdx-os-standard-v1.0.0-rc2.iso (1.8 GB)",
      "[11:00:13]   \u30D6\u30FC\u30C8\u9806\u5E8F: CD/DVD \u2192 HDD",
      "[11:00:14] Step 4: VM \u8D77\u52D5",
      "[11:00:15]   VM \u8D77\u52D5\u4E2D...",
      "[11:00:16]   BIOS \u2192 ISO \u30D6\u30FC\u30C8\u30ED\u30FC\u30C0\u30FC\u691C\u51FA",
      "[11:00:17]   Debian Installer \u8D77\u52D5",
      "[11:00:18] Step 5: \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B9F\u884C",
      "[11:00:19]   \u8A00\u8A9E: \u65E5\u672C\u8A9E",
      "[11:00:20]   \u30AD\u30FC\u30DC\u30FC\u30C9: jp106",
      "[11:00:21]   \u30C7\u30A3\u30B9\u30AF\u30D1\u30FC\u30C6\u30A3\u30B7\u30E7\u30F3: \u30AC\u30A4\u30C9 \u2014 \u30C7\u30A3\u30B9\u30AF\u5168\u4F53\u3092\u4F7F\u7528",
      "[11:00:22]   \u57FA\u672C\u30B7\u30B9\u30C6\u30E0\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u4E2D...",
      "[11:00:30]   \u30D1\u30C3\u30B1\u30FC\u30B8\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u4E2D (base/desktop/business/security/support)...",
      "[11:00:45]   GRUB \u30D6\u30FC\u30C8\u30ED\u30FC\u30C0\u30FC\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB",
      "[11:00:50]   \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2014 \u518D\u8D77\u52D5",
      "[11:00:55] Step 6: \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u78BA\u8A8D",
      "[11:00:56]   \u518D\u8D77\u52D5\u4E2D...",
      "[11:01:00]   XFCE \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u8868\u793A: \u2705 \u6B63\u5E38",
      "[11:01:01]   \u89E3\u50CF\u5EA6: 1920x1080",
      "[11:01:02]   \u65E5\u672C\u8A9E\u5165\u529B (fcitx5): \u2705 \u52D5\u4F5C\u78BA\u8A8D",
      "[11:01:03] Step 7: Construction Hub \u78BA\u8A8D",
      "[11:01:04]   Construction Hub \u81EA\u52D5\u8D77\u52D5: \u2705",
      "[11:01:05]   \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB: standard",
      "[11:01:06]   \u30AB\u30FC\u30C9\u8868\u793A: 8\u30A2\u30D7\u30EA (\u65E5\u5831/\u5199\u771F/\u56F3\u9762/\u6848\u4EF6/\u7533\u8ACB/\u30CA\u30EC\u30C3\u30B8/\u30E1\u30FC\u30EB/IT\u30B5\u30DD\u30FC\u30C8)",
      "[11:01:07]   \u30B5\u30FC\u30D0\u30FC\u63A5\u7D9A\u72B6\u614B: \u63A5\u7D9A\u78BA\u8A8D\u4E2D...",
      "[11:01:08] Step 8: cdx-agent \u767B\u9332\u78BA\u8A8D",
      "[11:01:09]   cdx-agent version: 0.2.0 \u2705",
      "[11:01:10]   systemctl status cdx-agent-heartbeat.timer: active \u2705",
      "[11:01:11]   systemctl status cdx-agent-inventory.timer: active \u2705",
      "[11:01:12]   heartbeat \u9001\u4FE1\u30C6\u30B9\u30C8: 200 OK \u2705",
      "[11:01:13]   \u7BA1\u7406 WebUI \u3067\u7AEF\u672B\u51FA\u73FE\u78BA\u8A8D: CDX-TEST-001 \u2705",
      "[11:01:14]   AppArmor \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB: enforced \u2705",
      "[11:01:15] Step 9: \u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u4FDD\u5B58",
      "[11:01:16]   \u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u540D: clean-install-standard-rc2",
      "[11:01:17]   \u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u4FDD\u5B58\u5B8C\u4E86 \u2705",
      "[11:01:18] Step 10: \u6A19\u6E96\u691C\u8A3C\u5B8C\u4E86",
      "[11:01:19]   \u{1F4CB} \u691C\u8A3C\u7D50\u679C:",
      "[11:01:19]     \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u8868\u793A: \u2705",
      "[11:01:19]     Construction Hub: \u2705",
      "[11:01:19]     cdx-agent \u767B\u9332: \u2705",
      "[11:01:19]     AppArmor: \u2705",
      "[11:01:19]     heartbeat/inventory: \u2705",
      "[11:01:20]   \u2192 USB\u914D\u5E03\u30FBPXE\u914D\u5E03\u524D\u306E\u6A19\u6E96\u691C\u8A3C\u3068\u3057\u3066\u8A18\u9332",
      "[11:01:21] \u2705 VM ISO\u30DE\u30A6\u30F3\u30C8\u914D\u5E03\u30D7\u30ED\u30BB\u30B9\u5B8C\u4E86 \u2014 \u6B21\u5DE5\u7A0B\u3078\u9032\u884C\u53EF"
    ]
  },
  {
    id: "usb",
    label: "USB\u30E1\u30E2\u30EA\u914D\u5E03",
    method: "\u7269\u7406\u30E1\u30C7\u30A3\u30A2\u914D\u5E03",
    desc: "1\u53F0\u69CB\u7BC9\u30FB\u73FE\u5834PC\u30FB\u30CD\u30C3\u30C8\u4E0D\u5B89\u5B9A\u62E0\u70B9\u5411\u3051",
    icon: "\u{1F4BE}",
    color: "#2563eb",
    phase: 3,
    steps: [
      { label: "\u691C\u8A3C\u6E08\u307F ISO \u53D6\u5F97", desc: "WebUI/S3 \u304B\u3089\u691C\u8A3C\u6E08\u307F ISO \u3092\u53D6\u5F97" },
      { label: "SHA256 \u7167\u5408", desc: "ISO \u306E\u6574\u5408\u6027\u3092\u78BA\u8A8D" },
      { label: "USB \u66F8\u8FBC\u307F", desc: "Rufus \u7B49\u3067 USB \u30E1\u30E2\u30EA\u3078 ISO \u3092\u66F8\u8FBC\u307F" },
      { label: "USB \u30E9\u30D9\u30EB\u4ED8\u3051", desc: "profile / \u65E5\u4ED8 / \u30D0\u30FC\u30B8\u30E7\u30F3\u3092\u660E\u8A18" },
      { label: "BIOS/UEFI \u8A2D\u5B9A", desc: "\u5BFE\u8C61 PC \u306E USB \u30D6\u30FC\u30C8\u3092\u6709\u52B9\u5316" },
      { label: "USB \u8D77\u52D5\u30FB\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB", desc: "USB \u304B\u3089\u8D77\u52D5\u3057\u3066\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB" },
      { label: "Construction Hub \u78BA\u8A8D", desc: "\u521D\u56DE\u8D77\u52D5\u5F8C\u306E\u8868\u793A\u3092\u78BA\u8A8D" },
      { label: "cdx-agent \u78BA\u8A8D", desc: "\u767B\u9332\u30FB\u30CF\u30FC\u30C8\u30D3\u30FC\u30C8\u9001\u4FE1\u3092\u78BA\u8A8D" },
      { label: "USB \u7BA1\u7406", desc: "\u4FDD\u7BA1\u30FB\u66F4\u65B0\u30FB\u5EC3\u68C4\u30EB\u30FC\u30EB\u306B\u5F93\u3044\u7BA1\u7406" }
    ],
    logs: [
      "[10:00:00] === USB\u30E1\u30E2\u30EA\u914D\u5E03 ===",
      "[10:00:01] Step 1: \u691C\u8A3C\u6E08\u307F ISO \u53D6\u5F97",
      "[10:00:02]   ISO Builder WebUI \u306B\u30ED\u30B0\u30A4\u30F3",
      "[10:00:03]   \u5BFE\u8C61: standard \u2014 b7a1c2d3 (v1.0.0-rc2)",
      "[10:00:04]   \u30B9\u30C6\u30FC\u30BF\u30B9: succeeded \u2705 (VM\u691C\u8A3C\u6E08\u307F)",
      "[10:00:05]   presigned URL \u751F\u6210...",
      "[10:00:06]   \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u4E2D... cdx-os-standard-v1.0.0-rc2.iso (1.8 GB)",
      "[10:00:35]   \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u5B8C\u4E86",
      "[10:00:36] Step 2: SHA256 \u7167\u5408",
      "[10:00:37]   $ sha256sum cdx-os-standard-v1.0.0-rc2.iso",
      "[10:00:38]   \u30ED\u30FC\u30AB\u30EB:  a1b2c3d4e5f6...abcdef12",
      "[10:00:39]   \u30B5\u30FC\u30D0\u30FC: a1b2c3d4e5f6...abcdef12",
      "[10:00:40]   \u2705 SHA256 \u4E00\u81F4",
      "[10:00:41] Step 3: USB \u66F8\u8FBC\u307F",
      "[10:00:42]   \u30C4\u30FC\u30EB: Rufus 4.4 (Windows) / dd (Linux)",
      "[10:00:43]   \u5BFE\u8C61\u30C7\u30D0\u30A4\u30B9: /dev/sdb (SanDisk Ultra 32GB)",
      "[10:00:44]   \u26A0\uFE0F \u66F8\u8FBC\u307F\u5148\u30C7\u30D0\u30A4\u30B9\u3092\u5FC5\u305A\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044",
      "[10:00:45]   Windows: Rufus \u2192 ISO\u30A4\u30E1\u30FC\u30B8\u9078\u629E \u2192 DD\u30A4\u30E1\u30FC\u30B8\u30E2\u30FC\u30C9 \u2192 \u958B\u59CB",
      "[10:00:46]   Linux: sudo dd if=cdx-os-standard-v1.0.0-rc2.iso of=/dev/sdb bs=4M status=progress conv=fsync",
      "[10:01:30]   \u66F8\u8FBC\u307F\u5B8C\u4E86 (1.8 GB \u2192 USB)",
      "[10:01:31]   sync \u5B9F\u884C\u5B8C\u4E86",
      "[10:01:32] Step 4: USB \u30E9\u30D9\u30EB\u4ED8\u3051",
      "[10:01:33]   \u30E9\u30D9\u30EB: CDX-OS / standard / v1.0.0-rc2 / 2026-05-06",
      "[10:01:34]   USB \u672C\u4F53\u306B\u7269\u7406\u30E9\u30D9\u30EB\u30B7\u30FC\u30EB\u3092\u8CBC\u4ED8",
      "[10:01:35] Step 5: BIOS/UEFI \u8A2D\u5B9A",
      "[10:01:36]   \u5BFE\u8C61PC: \u5DDD\u5D0E\u73FE\u5834A \u7AEF\u672B",
      "[10:01:37]   BIOS \u8D77\u52D5 \u2192 Boot Order \u2192 USB \u3092\u6700\u512A\u5148\u306B\u8A2D\u5B9A",
      "[10:01:38]   Secure Boot: \u6709\u52B9\u306E\u307E\u307E (Debian \u7F72\u540D\u6E08\u307F\u30AB\u30FC\u30CD\u30EB\u5BFE\u5FDC)",
      "[10:01:39] Step 6: USB \u8D77\u52D5\u30FB\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB",
      "[10:01:40]   USB \u304B\u3089\u8D77\u52D5\u4E2D...",
      "[10:01:41]   Debian Installer \u8D77\u52D5",
      "[10:01:42]   \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B9F\u884C\u4E2D... (\u7D0415\u5206)",
      "[10:01:55]   \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2014 USB \u3092\u629C\u3044\u3066\u518D\u8D77\u52D5",
      "[10:02:00] Step 7: Construction Hub \u78BA\u8A8D",
      "[10:02:01]   XFCE \u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u8D77\u52D5: \u2705",
      "[10:02:02]   Construction Hub \u8868\u793A: \u2705",
      "[10:02:03]   \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB: standard \u2014 8\u30A2\u30D7\u30EA\u8868\u793A",
      "[10:02:04] Step 8: cdx-agent \u78BA\u8A8D",
      "[10:02:05]   cdx-agent heartbeat: \u9001\u4FE1\u6210\u529F \u2705",
      "[10:02:06]   cdx-agent inventory: \u9001\u4FE1\u6210\u529F \u2705",
      "[10:02:07]   \u7BA1\u7406 WebUI: CDX-FLD-NEW-001 \u51FA\u73FE \u2705",
      "[10:02:08]   AppArmor: enforced \u2705",
      "[10:02:09] Step 9: USB \u7BA1\u7406",
      "[10:02:10]   \u{1F4CB} USB \u7BA1\u7406\u30EB\u30FC\u30EB:",
      "[10:02:10]     \u4FDD\u7BA1: \u65BD\u9320\u30AD\u30E3\u30D3\u30CD\u30C3\u30C8\u306B\u4FDD\u7BA1",
      "[10:02:10]     \u66F4\u65B0: \u65B0ISO\u7248\u30EA\u30EA\u30FC\u30B9\u6642\u306B\u518D\u66F8\u8FBC\u307F",
      "[10:02:10]     \u5EC3\u68C4: 3\u4E16\u4EE3\u524D\u306E\u7248\u306F\u7269\u7406\u7834\u58CA\u51E6\u5206",
      "[10:02:10]     \u53F0\u5E33: USB ID / \u4F5C\u6210\u65E5 / \u7248 / \u4F7F\u7528\u5148\u3092\u8A18\u9332",
      "[10:02:11] \u2705 USB\u30E1\u30E2\u30EA\u914D\u5E03\u30D7\u30ED\u30BB\u30B9\u5B8C\u4E86"
    ]
  },
  {
    id: "pxe",
    label: "PXE/iPXE + HTTP",
    method: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30D6\u30FC\u30C8\u914D\u5E03",
    desc: "\u672C\u793E\u30FB\u652F\u5E97\u30FB\u540C\u4E00LAN\u5185\u306E\u8907\u6570\u53F0\u5C55\u958B",
    icon: "\u{1F310}",
    color: "#f59e0b",
    phase: 4,
    steps: [
      { label: "PXE \u30B5\u30FC\u30D0\u30FC\u7528\u610F", desc: "Construction-DX-OS \u3092 PXE \u30B5\u30FC\u30D0\u30FC\u3068\u3057\u3066\u69CB\u7BC9" },
      { label: "Firewall \u8A2D\u5B9A", desc: "TFTP(69)/HTTP(80)/DHCP(67-68) \u30DD\u30FC\u30C8\u958B\u653E" },
      { label: "DHCP \u8A2D\u5B9A", desc: "BIOS/UEFI \u4E21\u5BFE\u5FDC\u306E PXE \u30D6\u30FC\u30C8\u8A2D\u5B9A" },
      { label: "DHCP Relay \u8A2D\u5B9A", desc: "\u8907\u6570\u30B5\u30D6\u30CD\u30C3\u30C8\u5BFE\u5FDC (\u652F\u5E97LAN\u5411\u3051)" },
      { label: "ISO \u304B\u3089\u30D6\u30FC\u30C8\u30D5\u30A1\u30A4\u30EB\u62BD\u51FA", desc: "vmlinuz / initrd.gz \u3092 ISO \u304B\u3089\u53D6\u5F97" },
      { label: "TFTP \u914D\u7F6E", desc: "BIOS (pxelinux) + UEFI (grub-efi) \u4E21\u5BFE\u5FDC" },
      { label: "iPXE \u30C1\u30A7\u30A4\u30F3\u30ED\u30FC\u30C9\u8A2D\u5B9A", desc: "DHCP \u2192 iPXE \u3078\u306E chainload \u69CB\u6210" },
      { label: "HTTP \u914D\u7F6E", desc: "ISO\u30FBpreseed \u3092 HTTP \u3067\u914D\u4FE1 (\u5E2F\u57DF\u5236\u5FA1\u4ED8\u304D)" },
      { label: "iPXE \u30E1\u30CB\u30E5\u30FC\u4F5C\u6210", desc: "profile \u5225\u306B\u8D77\u52D5\u9805\u76EE\u3092\u5206\u3051\u308B" },
      { label: "\u30B5\u30FC\u30D3\u30B9\u7BA1\u7406", desc: "dnsmasq / nginx / tftp \u306E systemd \u7BA1\u7406" },
      { label: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30D6\u30FC\u30C8", desc: "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8 PC \u3092\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30D6\u30FC\u30C8" },
      { label: "\u30D5\u30A1\u30A4\u30EB\u53D6\u5F97\u78BA\u8A8D", desc: "HTTP \u7D4C\u7531\u3067\u5FC5\u8981\u30D5\u30A1\u30A4\u30EB\u53D6\u5F97\u3092\u78BA\u8A8D" },
      { label: "\u7AEF\u672B\u767B\u9332\u78BA\u8A8D", desc: "\u4E2D\u592E\u7BA1\u7406 WebUI \u3067\u7AEF\u672B\u767B\u9332\u3092\u78BA\u8A8D" },
      { label: "PXE \u30B5\u30FC\u30D0\u30FC\u76E3\u8996", desc: "\u30B5\u30FC\u30D3\u30B9\u7A3C\u50CD\u72B6\u614B\u3092 cdx-server \u304B\u3089\u76E3\u8996" },
      { label: "\u30ED\u30B0\u4FDD\u5B58", desc: "HTTP/DHCP/TFTP \u30ED\u30B0\u3092\u4FDD\u5B58" },
      { label: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u624B\u9806\u78BA\u8A8D", desc: "\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5931\u6557\u6642\u306E\u5BFE\u5FDC\u30D5\u30ED\u30FC\u78BA\u8A8D" }
    ],
    logs: [
      "[13:00:00] === PXE/iPXE + HTTP \u914D\u5E03 ===",
      "[13:00:01] Step 1: PXE \u30B5\u30FC\u30D0\u30FC\u7528\u610F (Construction-DX-OS \u304CPXE\u30B5\u30FC\u30D0\u30FC)",
      "[13:00:02]   \u30B5\u30FC\u30D0\u30FC: 192.168.1.1 (\u65B0\u5BBF\u672C\u793E LAN)",
      "[13:00:03]   OS: Debian 13 (Construction-DX-OS \u30B5\u30FC\u30D0\u30FC)",
      "[13:00:04]   \u5FC5\u8981\u30D1\u30C3\u30B1\u30FC\u30B8\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB:",
      "[13:00:04]     apt install -y dnsmasq nginx tftpd-hpa syslinux-common pxelinux grub-efi-amd64-signed shim-signed",
      "[13:00:05]   \u5BFE\u8C61\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF: 192.168.1.0/24 (\u672C\u793ELAN)",
      "",
      "[13:00:06] Step 2: Firewall \u8A2D\u5B9A (nftables/ufw)",
      "[13:00:07]   PXE\u30B5\u30FC\u30D0\u30FC\u306B\u5FC5\u8981\u306A\u30DD\u30FC\u30C8\u3092\u958B\u653E:",
      "[13:00:07]     ufw allow 67/udp   # DHCP server",
      "[13:00:07]     ufw allow 68/udp   # DHCP client",
      "[13:00:07]     ufw allow 69/udp   # TFTP",
      "[13:00:07]     ufw allow 80/tcp   # HTTP (ISO/preseed\u914D\u4FE1)",
      "[13:00:07]     ufw allow 4011/udp # PXE proxy DHCP (iPXE chainload)",
      "[13:00:08]   ufw reload \u2705",
      "[13:00:09]   nftables \u30EB\u30FC\u30EB\u78BA\u8A8D:",
      "[13:00:09]     nft list ruleset | grep -E '(67|68|69|80|4011)' \u2705",
      "",
      "[13:00:10] Step 3: DHCP \u8A2D\u5B9A (BIOS/UEFI \u4E21\u5BFE\u5FDC)",
      "[13:00:11]   /etc/dnsmasq.d/pxe.conf:",
      "[13:00:11]     # \u57FA\u672C\u8A2D\u5B9A",
      "[13:00:11]     dhcp-range=192.168.1.100,192.168.1.200,255.255.255.0,12h",
      "[13:00:11]     dhcp-option=option:dns-server,192.168.1.1",
      "[13:00:12]     enable-tftp",
      "[13:00:12]     tftp-root=/srv/tftp",
      "[13:00:13]     # BIOS \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8 \u2192 pxelinux.0",
      "[13:00:13]     dhcp-match=set:bios,option:client-arch,0",
      "[13:00:13]     dhcp-boot=tag:bios,pxelinux.0",
      "[13:00:14]     # UEFI \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8 \u2192 grubnetx64.efi.signed",
      "[13:00:14]     dhcp-match=set:efi64,option:client-arch,7",
      "[13:00:14]     dhcp-match=set:efi64,option:client-arch,9",
      "[13:00:14]     dhcp-boot=tag:efi64,grub/grubnetx64.efi.signed",
      "[13:00:15]   BIOS/UEFI \u81EA\u52D5\u5224\u5225\u8A2D\u5B9A\u5B8C\u4E86 \u2705",
      "[13:00:16]   systemctl restart dnsmasq \u2705",
      "",
      "[13:00:17] Step 4: DHCP Relay \u8A2D\u5B9A (\u8907\u6570\u30B5\u30D6\u30CD\u30C3\u30C8\u5BFE\u5FDC)",
      "[13:00:18]   \u652F\u5E97LAN (192.168.2.0/24, 192.168.3.0/24) \u304B\u3089\u306E PXE \u30D6\u30FC\u30C8\u5BFE\u5FDC:",
      "[13:00:19]   \u652F\u5E97\u30EB\u30FC\u30BF\u30FC\u306B DHCP Relay Agent \u8A2D\u5B9A:",
      "[13:00:19]     ip helper-address 192.168.1.1   (Cisco IOS)",
      "[13:00:19]     dhcp-relay 192.168.1.1          (YAMAHA RTX)",
      "[13:00:20]   dnsmasq \u8FFD\u52A0\u8A2D\u5B9A:",
      "[13:00:20]     dhcp-range=192.168.2.100,192.168.2.200,255.255.255.0,12h",
      "[13:00:20]     dhcp-range=192.168.3.100,192.168.3.200,255.255.255.0,12h",
      "[13:00:21]   \u26A0\uFE0F \u65E2\u5B58DHCP \u30B5\u30FC\u30D0\u30FC\u3068\u306E\u7AF6\u5408\u306B\u6CE8\u610F \u2014 dnsmasq \u3092 proxy \u30E2\u30FC\u30C9\u306B\u3059\u308B\u304B\u3001\u65E2\u5B58\u3092\u505C\u6B62",
      "[13:00:22]   DHCP Relay \u30C6\u30B9\u30C8 (\u652F\u5E97VLAN\u304B\u3089): \u2705 \u5FDC\u7B54\u78BA\u8A8D",
      "",
      "[13:00:23] Step 5: ISO \u304B\u3089\u30D6\u30FC\u30C8\u30D5\u30A1\u30A4\u30EB\u62BD\u51FA",
      "[13:00:24]   ISO \u30DE\u30A6\u30F3\u30C8:",
      "[13:00:24]     mkdir -p /mnt/cdx-iso",
      "[13:00:24]     mount -o loop cdx-os-standard-v1.0.0-rc2.iso /mnt/cdx-iso",
      "[13:00:25]   vmlinuz \u62BD\u51FA:",
      "[13:00:25]     cp /mnt/cdx-iso/install.amd/vmlinuz /srv/tftp/boot/vmlinuz",
      "[13:00:26]   initrd.gz \u62BD\u51FA:",
      "[13:00:26]     cp /mnt/cdx-iso/install.amd/initrd.gz /srv/tftp/boot/initrd.gz",
      "[13:00:27]   UEFI \u7528\u30AB\u30FC\u30CD\u30EB:",
      "[13:00:27]     cp /mnt/cdx-iso/install.amd/vmlinuz /srv/tftp/grub/vmlinuz",
      "[13:00:27]     cp /mnt/cdx-iso/install.amd/initrd.gz /srv/tftp/grub/initrd.gz",
      "[13:00:28]   umount /mnt/cdx-iso",
      "[13:00:29]   \u2705 \u30D6\u30FC\u30C8\u30D5\u30A1\u30A4\u30EB\u62BD\u51FA\u5B8C\u4E86",
      "",
      "[13:00:30] Step 6: TFTP \u914D\u7F6E (BIOS + UEFI \u4E21\u5BFE\u5FDC)",
      "[13:00:31]   /srv/tftp/ \u30C7\u30A3\u30EC\u30AF\u30C8\u30EA\u69CB\u6210:",
      "[13:00:31]     \u251C\u2500\u2500 pxelinux.0                    (BIOS \u30D6\u30FC\u30C8\u30ED\u30FC\u30C0\u30FC)",
      "[13:00:31]     \u251C\u2500\u2500 ldlinux.c32                   (SYSLINUX \u30E2\u30B8\u30E5\u30FC\u30EB)",
      "[13:00:31]     \u251C\u2500\u2500 menu.c32                      (\u30E1\u30CB\u30E5\u30FC\u30E2\u30B8\u30E5\u30FC\u30EB)",
      "[13:00:31]     \u251C\u2500\u2500 libutil.c32                   (\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3)",
      "[13:00:31]     \u251C\u2500\u2500 pxelinux.cfg/",
      "[13:00:31]     \u2502   \u2514\u2500\u2500 default                   (BIOS \u7528\u30E1\u30CB\u30E5\u30FC)",
      "[13:00:31]     \u251C\u2500\u2500 grub/",
      "[13:00:31]     \u2502   \u251C\u2500\u2500 grubnetx64.efi.signed    (UEFI \u30D6\u30FC\u30C8\u30ED\u30FC\u30C0\u30FC)",
      "[13:00:31]     \u2502   \u251C\u2500\u2500 grub.cfg                  (UEFI \u7528\u30E1\u30CB\u30E5\u30FC)",
      "[13:00:31]     \u2502   \u251C\u2500\u2500 vmlinuz                   (\u30AB\u30FC\u30CD\u30EB)",
      "[13:00:31]     \u2502   \u2514\u2500\u2500 initrd.gz                 (\u521D\u671FRAM)",
      "[13:00:31]     \u2514\u2500\u2500 boot/",
      "[13:00:31]         \u251C\u2500\u2500 vmlinuz                    (\u30AB\u30FC\u30CD\u30EB - BIOS\u7528)",
      "[13:00:31]         \u2514\u2500\u2500 initrd.gz                  (\u521D\u671FRAM - BIOS\u7528)",
      "[13:00:32]   BIOS \u7528\u30D5\u30A1\u30A4\u30EB\u30B3\u30D4\u30FC:",
      "[13:00:32]     cp /usr/lib/PXELINUX/pxelinux.0 /srv/tftp/",
      "[13:00:32]     cp /usr/lib/syslinux/modules/bios/{ldlinux,menu,libutil}.c32 /srv/tftp/",
      "[13:00:33]   UEFI \u7528\u30D5\u30A1\u30A4\u30EB\u30B3\u30D4\u30FC:",
      "[13:00:33]     cp /usr/lib/shim/shimx64.efi.signed /srv/tftp/grub/",
      "[13:00:33]     cp /usr/lib/grub/x86_64-efi-signed/grubnetx64.efi.signed /srv/tftp/grub/",
      "[13:00:34]   TFTP \u30D5\u30A1\u30A4\u30EB\u914D\u7F6E\u5B8C\u4E86 \u2705",
      "",
      "[13:00:35] Step 7: iPXE \u30C1\u30A7\u30A4\u30F3\u30ED\u30FC\u30C9\u8A2D\u5B9A",
      "[13:00:36]   iPXE \u306B\u3088\u308BHTTP\u7D4C\u7531\u306E\u9AD8\u901F\u30D6\u30FC\u30C8\u5BFE\u5FDC:",
      "[13:00:36]   /srv/tftp/boot.ipxe:",
      "[13:00:36]     #!ipxe",
      "[13:00:36]     menu Construction-DX-OS Network Install",
      "[13:00:37]     item standard [standard] \u672C\u793E\u30FB\u652F\u5E97\u5411\u3051",
      "[13:00:37]     item field    [field] \u73FE\u5834\u5411\u3051",
      "[13:00:37]     item kiosk    [kiosk] \u5171\u7528\u7AEF\u672B\u5411\u3051",
      "[13:00:37]     choose target && goto ${target}",
      "[13:00:38]     :standard",
      "[13:00:38]     kernel http://192.168.1.1/boot/vmlinuz",
      "[13:00:38]     initrd http://192.168.1.1/boot/initrd.gz",
      "[13:00:38]     imgargs vmlinuz auto=true url=http://192.168.1.1/preseed/standard.cfg",
      "[13:00:38]     boot",
      "[13:00:39]   dnsmasq iPXE chainload \u8A2D\u5B9A:",
      "[13:00:39]     dhcp-userclass=set:ipxe,iPXE",
      "[13:00:39]     dhcp-boot=tag:ipxe,http://192.168.1.1/boot.ipxe",
      "[13:00:39]     dhcp-boot=tag:!ipxe,undionly.kpxe",
      "[13:00:40]   \u2705 iPXE \u30C1\u30A7\u30A4\u30F3\u30ED\u30FC\u30C9\u8A2D\u5B9A\u5B8C\u4E86",
      "",
      "[13:00:41] Step 8: HTTP \u914D\u7F6E (\u5E2F\u57DF\u5236\u5FA1\u4ED8\u304D)",
      "[13:00:42]   /etc/nginx/sites-enabled/cdx-pxe.conf:",
      "[13:00:42]     server {",
      "[13:00:42]       listen 80;",
      "[13:00:42]       server_name pxe.cdx.internal;",
      "[13:00:43]       # ISO \u914D\u4FE1 (\u5E2F\u57DF\u5236\u5FA1: \u540C\u664210\u53F0\u5BFE\u5FDC)",
      "[13:00:43]       location /iso/ {",
      "[13:00:43]         root /srv/cdx;",
      "[13:00:43]         autoindex on;",
      "[13:00:43]         limit_rate 100m;             # 100MB/s per connection",
      "[13:00:43]         limit_conn addr 10;          # \u540C\u4E00IP\u304B\u3089\u6700\u592710\u63A5\u7D9A",
      "[13:00:43]       }",
      "[13:00:44]       # preseed / iPXE \u30B9\u30AF\u30EA\u30D7\u30C8",
      "[13:00:44]       location /preseed/ { root /srv/cdx; }",
      "[13:00:44]       location /boot/    { root /srv/cdx; }",
      "[13:00:44]       # \u30A2\u30AF\u30BB\u30B9\u30ED\u30B0 (\u914D\u5E03\u8FFD\u8DE1\u7528)",
      "[13:00:44]       access_log /var/log/nginx/cdx-pxe-access.log combined;",
      "[13:00:44]       error_log  /var/log/nginx/cdx-pxe-error.log;",
      "[13:00:44]     }",
      "[13:00:45]   \u5E2F\u57DF\u5236\u5FA1\u8A2D\u5B9A (http \u30D6\u30ED\u30C3\u30AF):",
      "[13:00:45]     limit_conn_zone $binary_remote_addr zone=addr:10m;",
      "[13:00:46]   ISO \u914D\u7F6E: /srv/cdx/iso/cdx-os-standard-v1.0.0-rc2.iso",
      "[13:00:47]   preseed \u914D\u7F6E: /srv/cdx/preseed/{standard,field,kiosk}.cfg",
      "[13:00:48]   nginx -t \u2705 / systemctl reload nginx \u2705",
      "",
      "[13:00:49] Step 9: iPXE \u30E1\u30CB\u30E5\u30FC\u4F5C\u6210 (BIOS + UEFI)",
      "[13:00:50]   BIOS \u7528 \u2014 pxelinux.cfg/default:",
      "[13:00:50]     UI menu.c32",
      "[13:00:50]     MENU TITLE \u5EFA\u8A2DDX OS \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB (BIOS)",
      "[13:00:51]     LABEL standard",
      "[13:00:51]       MENU LABEL [standard] \u672C\u793E\u30FB\u652F\u5E97\u5411\u3051",
      "[13:00:51]       KERNEL boot/vmlinuz",
      "[13:00:51]       APPEND initrd=boot/initrd.gz url=http://192.168.1.1/preseed/standard.cfg",
      "[13:00:52]     LABEL field",
      "[13:00:52]       MENU LABEL [field] \u73FE\u5834\u5411\u3051",
      "[13:00:52]       KERNEL boot/vmlinuz",
      "[13:00:52]       APPEND initrd=boot/initrd.gz url=http://192.168.1.1/preseed/field.cfg",
      "[13:00:53]     LABEL kiosk",
      "[13:00:53]       MENU LABEL [kiosk] \u5171\u7528\u7AEF\u672B\u5411\u3051",
      "[13:00:53]       KERNEL boot/vmlinuz",
      "[13:00:53]       APPEND initrd=boot/initrd.gz url=http://192.168.1.1/preseed/kiosk.cfg",
      "[13:00:54]   UEFI \u7528 \u2014 grub/grub.cfg:",
      "[13:00:54]     menuentry '[standard] \u672C\u793E\u30FB\u652F\u5E97\u5411\u3051' {",
      "[13:00:54]       linux grub/vmlinuz auto=true url=http://192.168.1.1/preseed/standard.cfg",
      "[13:00:54]       initrd grub/initrd.gz",
      "[13:00:54]     }",
      "[13:00:55]     menuentry '[field] \u73FE\u5834\u5411\u3051' {",
      "[13:00:55]       linux grub/vmlinuz auto=true url=http://192.168.1.1/preseed/field.cfg",
      "[13:00:55]       initrd grub/initrd.gz",
      "[13:00:55]     }",
      "[13:00:56]     menuentry '[kiosk] \u5171\u7528\u7AEF\u672B\u5411\u3051' {",
      "[13:00:56]       linux grub/vmlinuz auto=true url=http://192.168.1.1/preseed/kiosk.cfg",
      "[13:00:56]       initrd grub/initrd.gz",
      "[13:00:56]     }",
      "[13:00:57]   \u2705 BIOS/UEFI \u4E21\u5BFE\u5FDC\u30E1\u30CB\u30E5\u30FC\u4F5C\u6210\u5B8C\u4E86",
      "",
      "[13:01:00] Step 10: \u30B5\u30FC\u30D3\u30B9\u7BA1\u7406 (systemd)",
      "[13:01:01]   PXE \u30B5\u30FC\u30D0\u30FC\u95A2\u9023\u30B5\u30FC\u30D3\u30B9:",
      "[13:01:01]     systemctl enable --now dnsmasq.service     \u2705 DHCP+TFTP",
      "[13:01:01]     systemctl enable --now nginx.service       \u2705 HTTP\u914D\u4FE1",
      "[13:01:01]     systemctl enable --now tftpd-hpa.service   \u2705 TFTP (fallback)",
      "[13:01:02]   \u30B5\u30FC\u30D3\u30B9\u81EA\u52D5\u8D77\u52D5\u78BA\u8A8D:",
      "[13:01:02]     systemctl is-enabled dnsmasq: enabled \u2705",
      "[13:01:02]     systemctl is-enabled nginx:   enabled \u2705",
      "[13:01:03]   systemd unit \u30D5\u30A1\u30A4\u30EB (\u30AB\u30B9\u30BF\u30E0\u76E3\u8996):",
      "[13:01:03]     /etc/systemd/system/cdx-pxe-health.timer (5\u5206\u9593\u9694)",
      "[13:01:03]     /etc/systemd/system/cdx-pxe-health.service (\u30D8\u30EB\u30B9\u30C1\u30A7\u30C3\u30AF)",
      "",
      "[13:01:05] Step 11: \u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u30D6\u30FC\u30C8",
      "[13:01:06]   \u5BFE\u8C61 PC \u306E BIOS/UEFI \u2192 Network Boot \u6709\u52B9",
      "[13:01:07]   \u26A0\uFE0F UEFI \u306E\u5834\u5408: Secure Boot \u5BFE\u5FDC (shimx64.efi.signed \u7D4C\u7531)",
      "[13:01:08]   PC \u8D77\u52D5 \u2192 DHCP \u53D6\u5F97 \u2192 BIOS/UEFI \u81EA\u52D5\u5224\u5225 \u2192 \u30D6\u30FC\u30C8\u30ED\u30FC\u30C0\u30FC\u30ED\u30FC\u30C9",
      "[13:01:09]   \u30E1\u30CB\u30E5\u30FC\u8868\u793A: [standard] [field] [kiosk]",
      "[13:01:10]   standard \u9078\u629E \u2192 \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u958B\u59CB",
      "",
      "[13:01:12] Step 12: \u30D5\u30A1\u30A4\u30EB\u53D6\u5F97\u78BA\u8A8D",
      "[13:01:13]   HTTP \u30A2\u30AF\u30BB\u30B9\u30ED\u30B0:",
      "[13:01:13]     192.168.1.105 GET /preseed/standard.cfg 200",
      "[13:01:13]     192.168.1.105 GET /iso/cdx-os-standard-v1.0.0-rc2.iso 200 (1.8GB)",
      "[13:01:14]   TFTP \u30ED\u30B0:",
      "[13:01:14]     192.168.1.105 pxelinux.0 \u2192 OK",
      "[13:01:14]     192.168.1.105 boot/vmlinuz \u2192 OK",
      "[13:01:15]   \u2705 \u5FC5\u8981\u30D5\u30A1\u30A4\u30EB\u5168\u3066\u53D6\u5F97\u6210\u529F",
      "[13:01:20]   \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2014 \u518D\u8D77\u52D5",
      "",
      "[13:01:25] Step 13: \u7AEF\u672B\u767B\u9332\u78BA\u8A8D",
      "[13:01:26]   \u4E2D\u592E\u7BA1\u7406 WebUI \u2192 \u30C7\u30D0\u30A4\u30B9\u4E00\u89A7",
      "[13:01:27]   \u65B0\u7AEF\u672B\u51FA\u73FE: CDX-HQ-NEW-001 \u2705",
      "[13:01:28]   heartbeat: \u53D7\u4FE1\u4E2D \u2705",
      "[13:01:29]   AppArmor: enforced \u2705",
      "",
      "[13:01:30] Step 14: PXE \u30B5\u30FC\u30D0\u30FC\u76E3\u8996",
      "[13:01:31]   cdx-server \u304B\u3089\u306E\u76E3\u8996\u8A2D\u5B9A:",
      "[13:01:31]     GET http://192.168.1.1:80/health \u2192 HTTP 200 \u2705",
      "[13:01:32]     TFTP \u30DD\u30FC\u30C8 (69/udp) \u758E\u901A\u78BA\u8A8D \u2705",
      "[13:01:33]     DHCP \u5FDC\u7B54\u30C6\u30B9\u30C8: nmap --script broadcast-dhcp-discover \u2705",
      "[13:01:34]   Prometheus \u30E1\u30C8\u30EA\u30AF\u30B9:",
      "[13:01:34]     cdx_pxe_dhcp_offers_total: 12",
      "[13:01:34]     cdx_pxe_tftp_transfers_total: 12",
      "[13:01:34]     cdx_pxe_http_iso_downloads_total: 8",
      "[13:01:35]   \u30A2\u30E9\u30FC\u30C8\u8A2D\u5B9A:",
      "[13:01:35]     dnsmasq \u505C\u6B62 \u2192 critical \u30A2\u30E9\u30FC\u30C8",
      "[13:01:35]     nginx \u505C\u6B62 \u2192 critical \u30A2\u30E9\u30FC\u30C8",
      "[13:01:35]     TFTP \u8EE2\u9001\u5931\u6557 \u2192 warning \u30A2\u30E9\u30FC\u30C8",
      "",
      "[13:01:37] Step 15: \u30ED\u30B0\u4FDD\u5B58",
      "[13:01:38]   HTTP \u30A2\u30AF\u30BB\u30B9\u30ED\u30B0: /var/log/nginx/cdx-pxe-access.log",
      "[13:01:39]   DHCP \u30ED\u30B0: /var/log/dnsmasq.log",
      "[13:01:40]   TFTP \u30ED\u30B0: /var/log/tftpd-hpa.log",
      "[13:01:41]   \u30ED\u30B0\u4FDD\u7BA1\u5148: /srv/cdx/logs/deploy-20260506/",
      "[13:01:42]   \u30ED\u30B0\u30ED\u30FC\u30C6\u30FC\u30B7\u30E7\u30F3: logrotate \u8A2D\u5B9A\u6E08\u307F (7\u65E5\u4FDD\u6301)",
      "",
      "[13:01:43] Step 16: \u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u624B\u9806\u78BA\u8A8D",
      "[13:01:44]   \u{1F4CB} \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5931\u6557\u6642\u306E\u5BFE\u5FDC\u30D5\u30ED\u30FC:",
      "[13:01:44]     1. DHCP \u672A\u53D6\u5F97 \u2192 \u30B1\u30FC\u30D6\u30EB/\u30B9\u30A4\u30C3\u30C1/VLAN \u78BA\u8A8D",
      "[13:01:44]     2. TFTP \u8EE2\u9001\u5931\u6557 \u2192 tftp-hpa \u30ED\u30B0\u78BA\u8A8D / \u30D5\u30A1\u30A4\u30EB\u30D1\u30FC\u30DF\u30C3\u30B7\u30E7\u30F3\u78BA\u8A8D",
      "[13:01:44]     3. ISO \u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u5931\u6557 \u2192 nginx error.log / \u30C7\u30A3\u30B9\u30AF\u5BB9\u91CF\u78BA\u8A8D",
      "[13:01:44]     4. preseed \u30A8\u30E9\u30FC \u2192 preseed.cfg \u6587\u6CD5\u30C1\u30A7\u30C3\u30AF / debconf-get-selections \u78BA\u8A8D",
      "[13:01:44]     5. \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u9014\u4E2D\u5931\u6557 \u2192 Alt+F4 \u3067\u30ED\u30B0\u78BA\u8A8D / \u30E1\u30E2\u30EA\u4E0D\u8DB3\u30C1\u30A7\u30C3\u30AF",
      "[13:01:45]     6. cdx-agent \u767B\u9332\u5931\u6557 \u2192 API \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u758E\u901A / \u30C8\u30FC\u30AF\u30F3\u6709\u52B9\u6027\u78BA\u8A8D",
      "[13:01:46]   \u5FA9\u65E7\u624B\u6BB5:",
      "[13:01:46]     \u2192 USB \u30E1\u30E2\u30EA\u914D\u5E03 (Phase 3) \u306B\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF",
      "[13:01:46]     \u2192 VM \u74B0\u5883\u3067 preseed.cfg \u3092\u518D\u691C\u8A3C (Phase 2)",
      "[13:01:47] \u2705 PXE/iPXE + HTTP \u914D\u5E03\u30D7\u30ED\u30BB\u30B9\u5B8C\u4E86 (\u516816\u30B9\u30C6\u30C3\u30D7)"
    ]
  },
  {
    id: "pxe-auto",
    label: "PXE + preseed \u5B8C\u5168\u81EA\u52D5",
    method: "\u30BC\u30ED\u30BF\u30C3\u30C1\u914D\u5E03",
    desc: "\u5927\u91CF\u5C55\u958B\u30FB5\u4EBAIT\u90E8\u9580\u3067\u306E\u7701\u529B\u5316",
    icon: "\u{1F680}",
    color: "#ef4444",
    phase: 5,
    steps: [
      { label: "preseed.cfg \u4F5C\u6210", desc: "profile \u5225\u306E preseed.cfg \u3092\u4F5C\u6210" },
      { label: "PXE \u30E1\u30CB\u30E5\u30FC\u7D71\u5408", desc: "BIOS/UEFI \u4E21\u5BFE\u5FDC\u30E1\u30CB\u30E5\u30FC\u306B preseed \u7D71\u5408" },
      { label: "\u57FA\u672C\u8A2D\u5B9A\u81EA\u52D5\u5316", desc: "\u8A00\u8A9E\u30FB\u30AD\u30FC\u30DC\u30FC\u30C9\u30FB\u30BF\u30A4\u30E0\u30BE\u30FC\u30F3\u3092\u81EA\u52D5\u8A2D\u5B9A" },
      { label: "\u30C7\u30A3\u30B9\u30AF\u30FB\u30E6\u30FC\u30B6\u30FC\u81EA\u52D5\u5316", desc: "\u30D1\u30FC\u30C6\u30A3\u30B7\u30E7\u30F3\u30FB\u30E6\u30FC\u30B6\u30FC\u4F5C\u6210\u3092\u81EA\u52D5\u5316" },
      { label: "\u30D1\u30C3\u30B1\u30FC\u30B8\u81EA\u52D5\u6295\u5165", desc: "\u5FC5\u8981\u30D1\u30C3\u30B1\u30FC\u30B8\u3068\u521D\u671F\u8A2D\u5B9A\u3092\u81EA\u52D5\u6295\u5165" },
      { label: "post-install \u5B9F\u884C", desc: "\u30DB\u30B9\u30C8\u540D\u898F\u5247\u9069\u7528\u30FBcdx-agent \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB" },
      { label: "\u81EA\u52D5\u767B\u9332", desc: "\u521D\u56DE\u8D77\u52D5\u6642\u306B\u4E2D\u592E\u7BA1\u7406\u3078\u81EA\u52D5\u767B\u9332" },
      { label: "\u79D8\u5BC6\u60C5\u5831\u306E\u5B89\u5168\u7BA1\u7406", desc: "\u767B\u9332\u30C8\u30FC\u30AF\u30F3\u306F\u671F\u9650\u4ED8\u304D\u53D6\u5F97\u65B9\u5F0F\u3092\u4F7F\u7528" },
      { label: "\u5E2F\u57DF\u30FB\u4E26\u5217\u5236\u5FA1", desc: "\u540C\u6642\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u53F0\u6570\u306E\u5E2F\u57DF\u7BA1\u7406" },
      { label: "PXE\u30B5\u30FC\u30D0\u30FC\u76E3\u8996", desc: "\u30B5\u30FC\u30D3\u30B9\u7A3C\u50CD\u3092cdx-server\u304B\u3089\u5E38\u6642\u76E3\u8996" },
      { label: "\u5C0F\u898F\u6A21\u30EA\u30CF\u30FC\u30B5\u30EB", desc: "5\u53F0\u7A0B\u5EA6\u3067\u4E8B\u524D\u691C\u8A3C\u3092\u5B9F\u65BD" },
      { label: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u624B\u9806", desc: "\u5931\u6557\u6642\u306E\u5207\u308A\u623B\u3057\u30D5\u30ED\u30FC\u78BA\u8A8D" },
      { label: "\u672C\u5C55\u958B\u30FB\u8A18\u9332", desc: "\u6210\u529F\u7387\u30FB\u5931\u6557\u7406\u7531\u30FB\u6240\u8981\u6642\u9593\u3092\u8A18\u9332" }
    ],
    logs: [
      "[14:00:00] === PXE + preseed \u5B8C\u5168\u81EA\u52D5\u5316 (\u30BC\u30ED\u30BF\u30C3\u30C1) ===",
      "[14:00:01] Step 1: preseed.cfg \u4F5C\u6210 (profile\u5225)",
      "[14:00:02]   standard.cfg \u751F\u6210\u4E2D...",
      "[14:00:03]   field.cfg \u751F\u6210\u4E2D...",
      "[14:00:04]   kiosk.cfg \u751F\u6210\u4E2D...",
      "",
      "[14:00:05] Step 2: PXE \u30E1\u30CB\u30E5\u30FC\u306B preseed \u81EA\u52D5\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u9805\u76EE\u3092\u8FFD\u52A0",
      "[14:00:06]   BIOS \u7528 \u2014 pxelinux.cfg/default:",
      "[14:00:06]     LABEL standard-auto",
      "[14:00:06]       MENU LABEL [standard] \u5B8C\u5168\u81EA\u52D5\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB",
      "[14:00:06]       KERNEL boot/vmlinuz",
      "[14:00:06]       APPEND initrd=boot/initrd.gz auto=true priority=critical url=http://192.168.1.1/preseed/standard.cfg",
      "[14:00:07]   UEFI \u7528 \u2014 grub/grub.cfg:",
      "[14:00:07]     menuentry '[standard] \u5B8C\u5168\u81EA\u52D5\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB' {",
      "[14:00:07]       linux grub/vmlinuz auto=true priority=critical url=http://192.168.1.1/preseed/standard.cfg",
      "[14:00:07]       initrd grub/initrd.gz",
      "[14:00:07]     }",
      "[14:00:08]   \u2705 BIOS/UEFI \u4E21\u5BFE\u5FDC\u30E1\u30CB\u30E5\u30FC\u7D71\u5408\u5B8C\u4E86",
      "",
      "[14:00:09] Step 3: \u57FA\u672C\u8A2D\u5B9A\u81EA\u52D5\u5316",
      "[14:00:10]   preseed.cfg \u2014 \u30ED\u30B1\u30FC\u30EB\u30FB\u30AD\u30FC\u30DC\u30FC\u30C9\u30FB\u30BF\u30A4\u30E0\u30BE\u30FC\u30F3:",
      "[14:00:10]     d-i debian-installer/locale string ja_JP.UTF-8",
      "[14:00:10]     d-i keyboard-configuration/xkb-keymap select jp",
      "[14:00:10]     d-i time/zone string Asia/Tokyo",
      "[14:00:10]     d-i clock-setup/ntp boolean true",
      "",
      "[14:00:11] Step 4: \u30C7\u30A3\u30B9\u30AF\u30FB\u30E6\u30FC\u30B6\u30FC\u81EA\u52D5\u5316",
      "[14:00:12]   preseed.cfg \u2014 \u30D1\u30FC\u30C6\u30A3\u30B7\u30E7\u30F3:",
      "[14:00:12]     d-i partman-auto/method string regular",
      "[14:00:12]     d-i partman-auto/choose_recipe select atomic",
      "[14:00:12]     d-i partman/confirm boolean true",
      "[14:00:12]     d-i partman/confirm_nooverwrite boolean true",
      "[14:00:13]   preseed.cfg \u2014 \u30E6\u30FC\u30B6\u30FC:",
      "[14:00:13]     d-i passwd/root-login boolean false",
      "[14:00:13]     d-i passwd/user-fullname string CDX User",
      "[14:00:13]     d-i passwd/username string cdxuser",
      "[14:00:13]     d-i passwd/user-password-crypted string $6$rounds=...",
      "",
      "[14:00:14] Step 5: \u30D1\u30C3\u30B1\u30FC\u30B8\u81EA\u52D5\u6295\u5165",
      "[14:00:15]   preseed.cfg \u2014 \u30D1\u30C3\u30B1\u30FC\u30B8\u9078\u629E:",
      "[14:00:15]     d-i pkgsel/include string xfce4 xfce4-terminal chromium onlyoffice-desktopeditors",
      "[14:00:15]     d-i pkgsel/include string cdx-agent apparmor apparmor-utils nftables",
      "",
      "[14:00:16] Step 6: post-install \u5B9F\u884C",
      "[14:00:17]   preseed.cfg \u2014 late_command:",
      "[14:00:17]     d-i preseed/late_command string \\",
      "[14:00:18]       # \u30DB\u30B9\u30C8\u540D\u898F\u5247\u9069\u7528 (\u62E0\u70B9\u30B3\u30FC\u30C9-\u9023\u756A)",
      "[14:00:18]       in-target bash -c 'hostnamectl set-hostname cdx-$(cat /sys/class/dmi/id/product_serial | tail -c 6)'; \\",
      "[14:00:19]       # cdx-agent \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u30FB\u6709\u52B9\u5316",
      "[14:00:19]       in-target bash -c '\\",
      "[14:00:19]         systemctl enable cdx-agent-heartbeat.timer; \\",
      "[14:00:19]         systemctl enable cdx-agent-inventory.timer; \\",
      "[14:00:20]         apparmor_parser -r /etc/apparmor.d/usr.bin.cdx-agent; \\",
      "[14:00:20]       '",
      "",
      "[14:00:21] Step 7: \u81EA\u52D5\u767B\u9332",
      "[14:00:22]   \u521D\u56DE\u8D77\u52D5\u6642 cdx-agent \u81EA\u52D5\u767B\u9332\u30D5\u30ED\u30FC:",
      "[14:00:22]     1. cdx-agent \u304C API \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u306B\u63A5\u7D9A",
      "[14:00:22]     2. POST /api/v1/devices/register (Bearer Token)",
      "[14:00:22]     3. shared_secret \u53D7\u9818 \u2192 /etc/cdx-agent/shared_secret \u306B\u4FDD\u5B58",
      "[14:00:22]     4. heartbeat timer \u8D77\u52D5 \u2192 \u30B5\u30FC\u30D0\u30FC\u3067\u7AEF\u672B\u51FA\u73FE\u78BA\u8A8D",
      "",
      "[14:00:23] Step 8: \u79D8\u5BC6\u60C5\u5831\u306E\u5B89\u5168\u7BA1\u7406",
      "[14:00:24]   \u26A0\uFE0F \u767B\u9332\u30C8\u30FC\u30AF\u30F3\u30FB\u79D8\u5BC6\u60C5\u5831\u306E\u7BA1\u7406\u30EB\u30FC\u30EB:",
      "[14:00:24]     \u2705 ISO/preseed \u306B\u76F4\u66F8\u304D\u3057\u306A\u3044",
      "[14:00:24]     \u2705 \u671F\u9650\u4ED8\u304D\u53D6\u5F97\u65B9\u5F0F\u3092\u4F7F\u7528:",
      "[14:00:24]       \u2192 post-install \u6642\u306B\u4E00\u6642\u30C8\u30FC\u30AF\u30F3 API \u304B\u3089\u53D6\u5F97",
      "[14:00:24]       \u2192 \u30C8\u30FC\u30AF\u30F3\u6709\u52B9\u671F\u9650: 30\u5206",
      "[14:00:24]       \u2192 \u767B\u9332\u5B8C\u4E86\u5F8C\u306B\u30C8\u30FC\u30AF\u30F3\u3092\u81EA\u52D5\u7121\u52B9\u5316",
      "[14:00:25]     \u2705 CDX_REGISTRATION_TOKEN \u306F\u74B0\u5883\u5909\u6570\u3067\u7BA1\u7406",
      "",
      "[14:00:26] Step 9: \u5E2F\u57DF\u30FB\u4E26\u5217\u5236\u5FA1",
      "[14:00:27]   \u540C\u6642\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u6642\u306E\u5E2F\u57DF\u7BA1\u7406\u8A2D\u5B9A:",
      "[14:00:27]   nginx \u5E2F\u57DF\u5236\u5FA1 (Phase 4 \u3067\u8A2D\u5B9A\u6E08\u307F):",
      "[14:00:27]     limit_rate 100m;          # 100MB/s per connection",
      "[14:00:27]     limit_conn addr 10;       # \u540C\u4E00IP\u304B\u3089\u6700\u592710\u63A5\u7D9A",
      "[14:00:28]   \u63A8\u5968\u540C\u6642\u5C55\u958B\u53F0\u6570:",
      "[14:00:28]     1GbE LAN: \u6700\u5927 8\u53F0\u4E26\u5217 (ISO 1.8GB \xD7 8 = ~15\u5206)",
      "[14:00:28]     10GbE LAN: \u6700\u5927 30\u53F0\u4E26\u5217",
      "[14:00:29]   QoS \u8A2D\u5B9A (\u30AA\u30D7\u30B7\u30E7\u30F3):",
      "[14:00:29]     tc qdisc add dev eth0 root tbf rate 800mbit burst 256k latency 50ms",
      "[14:00:30]   \u26A0\uFE0F \u696D\u52D9\u6642\u9593\u5E2F\u3092\u907F\u3051\u3066\u5C55\u958B\u63A8\u5968 (\u663C\u4F11\u307F or \u591C\u9593)",
      "",
      "[14:00:31] Step 10: PXE \u30B5\u30FC\u30D0\u30FC\u76E3\u8996",
      "[14:00:32]   cdx-server \u304B\u3089\u306E\u76E3\u8996\u9805\u76EE:",
      "[14:00:32]     \u30B5\u30FC\u30D3\u30B9\u7A3C\u50CD: dnsmasq / nginx / tftpd-hpa",
      "[14:00:33]     HTTP \u30D8\u30EB\u30B9\u30C1\u30A7\u30C3\u30AF: GET http://pxe-server/health",
      "[14:00:33]     TFTP \u30DD\u30FC\u30C8\u758E\u901A: 69/udp",
      "[14:00:34]     DHCP \u5FDC\u7B54\u30C6\u30B9\u30C8: broadcast-dhcp-discover",
      "[14:00:34]   Prometheus \u30E1\u30C8\u30EA\u30AF\u30B9\u9023\u643A:",
      "[14:00:34]     cdx_pxe_service_up{service='dnsmasq'}: 1",
      "[14:00:34]     cdx_pxe_service_up{service='nginx'}: 1",
      "[14:00:34]     cdx_pxe_active_installs: 0",
      "[14:00:35]   \u30A2\u30E9\u30FC\u30C8\u30EB\u30FC\u30EB:",
      "[14:00:35]     dnsmasq down > 1min \u2192 critical (PXE \u4E0D\u80FD)",
      "[14:00:35]     nginx down > 1min \u2192 critical (ISO\u914D\u4FE1\u4E0D\u80FD)",
      "[14:00:35]     disk usage > 90% \u2192 warning (ISO\u4FDD\u7BA1\u9818\u57DF)",
      "[14:00:36]   \u2705 \u76E3\u8996\u8A2D\u5B9A\u5B8C\u4E86",
      "",
      "[14:00:37] Step 11: \u5C0F\u898F\u6A21\u30EA\u30CF\u30FC\u30B5\u30EB",
      "[14:00:38]   \u5BFE\u8C61: 5\u53F0 (\u5927\u962A\u652F\u5E97 \u30C6\u30B9\u30C8\u6A5F)",
      "[14:00:39]   \u30EA\u30CF\u30FC\u30B5\u30EB\u958B\u59CB...",
      "[14:00:40]     \u7AEF\u672B 1/5: PXE \u30D6\u30FC\u30C8 \u2192 UEFI \u691C\u51FA \u2192 grub \u30E1\u30CB\u30E5\u30FC \u2192 \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u958B\u59CB",
      "[14:00:41]     \u7AEF\u672B 2/5: PXE \u30D6\u30FC\u30C8 \u2192 BIOS \u691C\u51FA \u2192 pxelinux \u30E1\u30CB\u30E5\u30FC \u2192 \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u958B\u59CB",
      "[14:00:42]     \u7AEF\u672B 3/5: PXE \u30D6\u30FC\u30C8 \u2192 UEFI \u691C\u51FA \u2192 \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u958B\u59CB",
      "[14:00:43]     \u7AEF\u672B 4/5: PXE \u30D6\u30FC\u30C8 \u2192 UEFI \u691C\u51FA \u2192 \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u958B\u59CB",
      "[14:00:44]     \u7AEF\u672B 5/5: PXE \u30D6\u30FC\u30C8 \u2192 BIOS \u691C\u51FA \u2192 \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u958B\u59CB",
      "[14:00:55]     \u7AEF\u672B 1/5: \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2192 cdx-agent \u767B\u9332 \u2705",
      "[14:00:56]     \u7AEF\u672B 2/5: \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2192 cdx-agent \u767B\u9332 \u2705",
      "[14:00:57]     \u7AEF\u672B 3/5: \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2192 cdx-agent \u767B\u9332 \u2705",
      "[14:00:58]     \u7AEF\u672B 4/5: \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2192 cdx-agent \u767B\u9332 \u2705",
      "[14:00:59]     \u7AEF\u672B 5/5: \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2192 cdx-agent \u767B\u9332 \u2705",
      "[14:01:00]   \u30EA\u30CF\u30FC\u30B5\u30EB\u7D50\u679C: 5/5 \u6210\u529F (\u6210\u529F\u7387 100%)",
      "[14:01:01]   BIOS\u7AEF\u672B: 2\u53F0 / UEFI\u7AEF\u672B: 3\u53F0 \u2014 \u4E21\u65B9\u6B63\u5E38\u52D5\u4F5C \u2705",
      "[14:01:02]   \u5E73\u5747\u6240\u8981\u6642\u9593: 23\u5206/\u53F0",
      "",
      "[14:01:03] Step 12: \u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u624B\u9806",
      "[14:01:04]   \u{1F4CB} \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5931\u6557\u6642\u306E\u5BFE\u5FDC\u30D5\u30ED\u30FC:",
      "[14:01:04]     1. PXE \u30D6\u30FC\u30C8\u5931\u6557 \u2192 DHCP/TFTP \u30ED\u30B0\u78BA\u8A8D \u2192 \u30B1\u30FC\u30D6\u30EB/VLAN \u30C1\u30A7\u30C3\u30AF",
      "[14:01:04]     2. UEFI \u30D6\u30FC\u30C8\u5931\u6557 \u2192 Secure Boot \u8A2D\u5B9A\u78BA\u8A8D \u2192 shimx64 \u30D1\u30B9\u78BA\u8A8D",
      "[14:01:04]     3. preseed \u30A8\u30E9\u30FC \u2192 debconf-get-selections \u3067\u691C\u8A3C \u2192 cfg \u4FEE\u6B63",
      "[14:01:05]     4. \u30D1\u30C3\u30B1\u30FC\u30B8\u53D6\u5F97\u5931\u6557 \u2192 HTTP \u30ED\u30B0\u78BA\u8A8D \u2192 APT \u30DF\u30E9\u30FC\u758E\u901A\u30C1\u30A7\u30C3\u30AF",
      "[14:01:05]     5. post-install \u5931\u6557 \u2192 /var/log/installer/syslog \u78BA\u8A8D",
      "[14:01:05]     6. cdx-agent \u767B\u9332\u5931\u6557 \u2192 API \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u758E\u901A \u2192 \u30C8\u30FC\u30AF\u30F3\u6709\u52B9\u6027\u78BA\u8A8D",
      "[14:01:06]   \u5FA9\u65E7\u624B\u6BB5:",
      "[14:01:06]     \u2192 USB \u30E1\u30E2\u30EA\u914D\u5E03 (Phase 3) \u306B\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF",
      "[14:01:06]     \u2192 VM \u3067 preseed.cfg \u3092\u518D\u691C\u8A3C (Phase 2)",
      "[14:01:06]     \u2192 \u5931\u6557\u7AEF\u672B\u306E\u307F\u624B\u52D5\u3067 PXE \u518D\u5B9F\u884C",
      "",
      "[14:01:08] Step 13: \u672C\u5C55\u958B\u30FB\u8A18\u9332",
      "[14:01:09]   \u{1F4CB} \u5C55\u958B\u8A18\u9332:",
      "[14:01:09]     \u30EA\u30CF\u30FC\u30B5\u30EB: 5\u53F0 / \u6210\u529F\u7387 100%",
      "[14:01:09]     BIOS/UEFI\u6DF7\u5728: \u6B63\u5E38\u5BFE\u5FDC\u78BA\u8A8D",
      "[14:01:09]     \u5931\u6557\u7406\u7531: \u306A\u3057",
      "[14:01:09]     \u5E73\u5747\u6240\u8981\u6642\u9593: 23\u5206/\u53F0",
      "[14:01:10]     \u63A8\u5B9A\u672C\u5C55\u958B\u6642\u9593: 30\u53F0 \xD7 23\u5206 \xF7 8\u4E26\u5217 (1GbE) = \u7D041.5\u6642\u9593",
      "[14:01:11]   \u5E2F\u57DF\u4F7F\u7528\u91CF: \u30D4\u30FC\u30AF 800Mbps (8\u53F0\u4E26\u5217\u6642)",
      "[14:01:12]   PXE \u30B5\u30FC\u30D0\u30FC\u8CA0\u8377: CPU 15% / MEM 2.1GB / Disk I/O \u6B63\u5E38",
      "[14:01:13]   \u2192 \u672C\u5C55\u958B\u627F\u8A8D\u5F8C\u3001\u5BFE\u8C61\u7AEF\u672B\u306E\u96FB\u6E90\u3092 ON \u306B\u3057\u3066\u304F\u3060\u3055\u3044",
      "[14:01:14] \u2705 PXE + preseed \u5B8C\u5168\u81EA\u52D5\u5316 \u6E96\u5099\u5B8C\u4E86 (\u516813\u30B9\u30C6\u30C3\u30D7)"
    ]
  }
];
const IsoPage = () => {
  var _a, _b, _c;
  const [selected, setSelected] = React.useState(null);
  const [showNew, setShowNew] = React.useState(false);
  const [distMethod, setDistMethod] = React.useState(null);
  const [distRunning, setDistRunning] = React.useState(false);
  const [distStep, setDistStep] = React.useState(-1);
  const [distLogLines, setDistLogLines] = React.useState([]);
  const [distIso, setDistIso] = React.useState("");
  const logRef = React.useRef(null);
  const job = selected ? ISO_JOBS_DATA.find((j) => j.id === selected) : null;
  const dm = distMethod ? DIST_METHODS.find((m) => m.id === distMethod) : null;
  const startDistribution = () => {
    const currentDm = DIST_METHODS.find((m) => m.id === distMethod);
    if (!currentDm || !distIso) return;
    setDistRunning(true);
    setDistStep(0);
    setDistLogLines([]);
    let idx = 0;
    const logs = currentDm.logs;
    const stepCount = currentDm.steps.length;
    const interval = setInterval(() => {
      if (idx < logs.length) {
        const logLine = logs[idx];
        setDistLogLines((prev) => [...prev, logLine]);
        const stepIdx = Math.min(Math.floor(idx / logs.length * stepCount), stepCount - 1);
        setDistStep(stepIdx);
        idx++;
      } else {
        clearInterval(interval);
        setDistStep(stepCount);
        setDistRunning(false);
      }
    }, 250);
  };
  React.useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [distLogLines]);
  if (dm) {
    const successIsos = ISO_JOBS_DATA.filter((j) => j.status === "succeeded");
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setDistMethod(null);
      setDistRunning(false);
      setDistStep(-1);
      setDistLogLines([]);
    }, style: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 } }, "\u2190 ISO \u914D\u5E03\u4E00\u89A7\u3078\u623B\u308B"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 28 } }, dm.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, dm.label), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: dm.color, fontWeight: 600, margin: "2px 0 0" } }, dm.method), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#94a3b8", margin: "2px 0 0" } }, dm.desc)), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", padding: "4px 12px", borderRadius: 6, background: "#f1f5f9", fontSize: 11, color: "#64748b" } }, "\u5C0E\u5165\u30D5\u30A7\u30FC\u30BA ", dm.phase, "/5")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u914D\u5E03\u8A2D\u5B9A"), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u5BFE\u8C61 ISO"), /* @__PURE__ */ React.createElement("select", { value: distIso, onChange: (e) => setDistIso(e.target.value), style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#0f172a" } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "ISO \u3092\u9078\u629E..."), successIsos.map((j) => /* @__PURE__ */ React.createElement("option", { key: j.id, value: j.id }, j.profile, " \u2014 #", j.id.slice(0, 8), " (", j.gitRef, ", ", j.size, ")")))), (dm.id === "pxe" || dm.id === "pxe-auto") && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u5BFE\u8C61\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF"), /* @__PURE__ */ React.createElement("input", { type: "text", defaultValue: "192.168.1.0/24", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxSizing: "border-box" } })), dm.id === "pxe-auto" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u5C55\u958B\u53F0\u6570"), /* @__PURE__ */ React.createElement("input", { type: "number", defaultValue: 10, style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxSizing: "border-box" } })), dm.id === "usb" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u66F8\u8FBC\u307F\u30C4\u30FC\u30EB"), /* @__PURE__ */ React.createElement("select", { style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 } }, /* @__PURE__ */ React.createElement("option", null, "Rufus (Windows)"), /* @__PURE__ */ React.createElement("option", null, "dd (Linux)"), /* @__PURE__ */ React.createElement("option", null, "balenaEtcher (\u30AF\u30ED\u30B9\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0)"))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u30E1\u30E2"), /* @__PURE__ */ React.createElement("textarea", { rows: 2, placeholder: "\u914D\u5E03\u306E\u76EE\u7684\u3084\u5BFE\u8C61...", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, resize: "vertical", boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("button", { onClick: startDistribution, disabled: !distIso || distRunning, style: {
      width: "100%",
      padding: "10px",
      borderRadius: 8,
      border: "none",
      fontSize: 13,
      fontWeight: 600,
      cursor: distIso && !distRunning ? "pointer" : "not-allowed",
      background: distIso && !distRunning ? dm.color : "#e2e8f0",
      color: distIso && !distRunning ? "#fff" : "#94a3b8"
    } }, distRunning ? "\u5B9F\u884C\u4E2D..." : distStep >= (((_a = dm.steps) == null ? void 0 : _a.length) || 0) ? "\u2705 \u5B8C\u4E86 \u2014 \u518D\u5B9F\u884C" : "\u914D\u5E03\u30D7\u30ED\u30BB\u30B9\u958B\u59CB")), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30D7\u30ED\u30BB\u30B9\u30B9\u30C6\u30C3\u30D7 (", dm.steps.length, ")"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, dm.steps.map((s, i) => {
      const done = distStep > i;
      const active = distStep === i;
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, background: active ? `${dm.color}10` : done ? "#f0fdf4" : "#f8fafc", border: active ? `1.5px solid ${dm.color}` : "1.5px solid transparent" } }, /* @__PURE__ */ React.createElement("div", { style: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        background: done ? "#22c55e" : active ? dm.color : "#e8ecf1",
        color: done || active ? "#fff" : "#94a3b8"
      } }, done ? "\u2713" : i + 1), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: active ? dm.color : done ? "#22c55e" : "#475569" } }, s.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#94a3b8" } }, s.desc)));
    })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { flex: 1, display: "flex", flexDirection: "column" }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "\u914D\u5E03\u30D7\u30ED\u30BB\u30B9\u30ED\u30B0"), distRunning && /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: dm.color, fontWeight: 500 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: dm.color, animation: "pulse 1.2s ease-in-out infinite" } }), "\u5B9F\u884C\u4E2D..."), !distRunning && distStep >= (((_b = dm.steps) == null ? void 0 : _b.length) || 0) && distLogLines.length > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "#22c55e" } }, "\u2705 \u5B8C\u4E86")), distLogLines.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 13 } }, "ISO \u3092\u9078\u629E\u3057\u3066\u300C\u914D\u5E03\u30D7\u30ED\u30BB\u30B9\u958B\u59CB\u300D\u3092\u30AF\u30EA\u30C3\u30AF") : /* @__PURE__ */ React.createElement("pre", { ref: logRef, style: { background: "#0f172a", color: "#e2e8f0", padding: "14px 16px", borderRadius: 8, fontSize: 11, lineHeight: 1.65, flex: 1, overflowY: "auto", margin: 0, minHeight: 300, maxHeight: 520 } }, distLogLines.map((line, i) => {
      if (typeof line !== "string") return null;
      const isSuccess = line.includes("\u2705");
      const isWarn = line.includes("\u26A0\uFE0F");
      const isHeader = line.includes("===");
      const isStep = line.startsWith("[") && line.includes("] Step ");
      const isCheck = line.includes("\u25A1");
      const isTree = line.includes("\u251C") || line.includes("\u2514") || line.includes("\u2502");
      const isConfig = line.includes("d-i ") || line.includes("dhcp-") || line.includes("LABEL ") || line.includes("KERNEL ") || line.includes("APPEND ") || line.includes("MENU ");
      const color = isHeader ? "#93c5fd" : isSuccess ? "#4ade80" : isWarn ? "#fbbf24" : isStep ? "#c4b5fd" : isConfig ? "#67e8f9" : isCheck ? "#94a3b8" : isTree ? "#64748b" : "#e2e8f0";
      const fontWeight = isHeader || isStep ? "bold" : "normal";
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { color, fontWeight } }, line);
    }), distRunning && /* @__PURE__ */ React.createElement("span", { style: { color: dm.color } }, "\u258C"))), distStep >= (((_c = dm.steps) == null ? void 0 : _c.length) || 0) && distLogLines.length > 0 && /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u914D\u5E03\u7D50\u679C\u30B5\u30DE\u30EA\u30FC"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "#22c55e" } }, "\u5B8C\u4E86"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#64748b" } }, "\u30B9\u30C6\u30FC\u30BF\u30B9")), /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", background: "#f8fafc", borderRadius: 8, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a" } }, dm.steps.length), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#64748b" } }, "\u30B9\u30C6\u30C3\u30D7")), /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", background: "#f8fafc", borderRadius: 8, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a" } }, distLogLines.length), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#64748b" } }, "\u30ED\u30B0\u884C\u6570")), /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", background: "#f8fafc", borderRadius: 8, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: dm.color } }, "Phase ", dm.phase), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#64748b" } }, "\u5C0E\u5165\u9806"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { style: { padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "\u30ED\u30B0\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9"), /* @__PURE__ */ React.createElement("button", { style: { padding: "6px 14px", borderRadius: 6, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" } }, "\u76E3\u67FB\u30ED\u30B0\u306B\u8A18\u9332"), dm.phase < 5 && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          const next = DIST_METHODS.find((m) => m.phase === dm.phase + 1);
          if (next) {
            setDistMethod(next.id);
            setDistStep(-1);
            setDistLogLines([]);
            setDistIso("");
          }
        },
        style: { padding: "6px 14px", borderRadius: 6, background: "#f8fafc", color: "#2563eb", border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600, cursor: "pointer" }
      },
      "\u6B21\u306E\u5C0E\u5165\u30D5\u30A7\u30FC\u30BA\u3078 \u2192"
    ))))));
  }
  if (showNew) {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNew(false), style: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 } }, "\u2190 \u30B8\u30E7\u30D6\u4E00\u89A7\u3078\u623B\u308B"), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { maxWidth: 600 }) }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" } }, "\u65B0\u898F ISO \u30D3\u30EB\u30C9"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 } }, "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB"), /* @__PURE__ */ React.createElement("select", { style: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#0f172a" } }, /* @__PURE__ */ React.createElement("option", null, "standard \u2014 \u672C\u793E\u30FB\u652F\u5E97\u5411\u3051"), /* @__PURE__ */ React.createElement("option", null, "field \u2014 \u73FE\u5834\u5411\u3051\uFF08\u30AA\u30D5\u30E9\u30A4\u30F3\u5BFE\u5FDC\uFF09"), /* @__PURE__ */ React.createElement("option", null, "kiosk \u2014 \u5171\u7528\u7AEF\u672B\u5411\u3051\uFF08\u5236\u9650\u30E2\u30FC\u30C9\uFF09"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 } }, "Git Ref (\u30D6\u30E9\u30F3\u30C1 / \u30BF\u30B0)"), /* @__PURE__ */ React.createElement("input", { type: "text", defaultValue: "main", style: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#0f172a", boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 } }, "\u30E1\u30E2 (\u4EFB\u610F)"), /* @__PURE__ */ React.createElement("textarea", { rows: 3, placeholder: "\u30D3\u30EB\u30C9\u306E\u76EE\u7684\u3084\u5099\u8003...", style: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#0f172a", resize: "vertical", boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNew(false), style: { padding: "8px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" } }, "\u30D3\u30EB\u30C9\u958B\u59CB"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNew(false), style: { padding: "8px 20px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" } }, "\u30AD\u30E3\u30F3\u30BB\u30EB"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 20, padding: "16px", background: "#f8fafc", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 10 } }, "ISO \u30D3\u30EB\u30C9\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, [
      { label: "\u30B8\u30E7\u30D6\u4F5C\u6210", desc: "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u30FBGit Ref \u6307\u5B9A", icon: "\u{1F4DD}" },
      { label: "Queue \u6295\u5165", desc: "Redis Queue \u3067\u30AD\u30E5\u30FC\u30A4\u30F3\u30B0", icon: "\u{1F4E4}" },
      { label: "live-build", desc: "Debian build host \u3067\u5B9F\u884C", icon: "\u{1F528}" },
      { label: "\u30A2\u30FC\u30C6\u30A3\u30D5\u30A1\u30AF\u30C8\u4FDD\u7BA1", desc: "MinIO/S3 \u306B ISO+log+SHA256", icon: "\u{1FAA3}" },
      { label: "\u914D\u5E03", desc: "DL / USB / VM / PXE", icon: "\u2B07\uFE0F" }
    ].map((s, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "10px", background: "#fff", borderRadius: 8, textAlign: "center", border: "1px solid #e8ecf1" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, marginBottom: 4 } }, s.icon), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#0f172a", marginBottom: 1 } }, s.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#94a3b8" } }, s.desc)), i < 4 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", color: "#cbd5e1", fontSize: 14 } }, "\u2192")))))));
  }
  if (job) {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setSelected(null), style: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 } }, "\u2190 \u30B8\u30E7\u30D6\u4E00\u89A7\u3078\u623B\u308B"), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, "\u{1F4BF}"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, "ISO Build #", job.id.slice(0, 8)), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: jBg(job.status), color: jColor(job.status) } }, jLabel(job.status))), /* @__PURE__ */ React.createElement("table", { style: { width: "auto", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("tbody", null, [["\u30B8\u30E7\u30D6ID", job.id], ["\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", job.profile], ["Git Ref", job.gitRef], ["\u8981\u6C42\u8005", job.requestedBy], ["\u4F5C\u6210\u65E5\u6642", job.createdAt], ["\u958B\u59CB\u65E5\u6642", job.startedAt || "\u2014"], ["\u5B8C\u4E86\u65E5\u6642", job.finishedAt || "\u2014"], ["ISO\u30B5\u30A4\u30BA", job.size], ["SHA256", job.sha256 || "\u2014"], ["\u30E1\u30E2", job.notes || "\u2014"]].map(([k, v], i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid #f8fafc" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 16px 8px 0", color: "#94a3b8", fontWeight: 500, fontSize: 12, width: 120 } }, k), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 0", color: "#0f172a", fontSize: 12 } }, k === "Git Ref" || k === "SHA256" || k === "\u30B8\u30E7\u30D6ID" ? /* @__PURE__ */ React.createElement("code", { style: { background: "#f1f5f9", padding: "2px 6px", borderRadius: 3, fontSize: 11 } }, v) : v))), job.error && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 16px 8px 0", color: "#ef4444", fontWeight: 500, fontSize: 12 } }, "\u30A8\u30E9\u30FC"), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 0" } }, /* @__PURE__ */ React.createElement("pre", { style: { background: "#fef2f2", color: "#dc2626", padding: "8px 12px", borderRadius: 6, fontSize: 11, margin: 0, whiteSpace: "pre-wrap" } }, job.error))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 16 } }, job.status === "succeeded" && /* @__PURE__ */ React.createElement("button", { style: { padding: "8px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" } }, "\u2B07 ISO \u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9"), job.status === "running" && /* @__PURE__ */ React.createElement("button", { style: { padding: "8px 16px", borderRadius: 8, background: "#dc2626", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" } }, "\u{1F6D1} \u30AD\u30E3\u30F3\u30BB\u30EB"))), job.status === "running" && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u30D3\u30EB\u30C9\u30ED\u30B0 (\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0 SSE)"), /* @__PURE__ */ React.createElement("pre", { style: { background: "#0f172a", color: "#e2e8f0", padding: "14px 16px", borderRadius: 8, fontSize: 11, lineHeight: 1.6, maxHeight: 240, overflowY: "auto", margin: 0 } }, `[09:15:30] Starting ISO build for profile: field
[09:15:31] Git ref: main (commit a8243ba)
[09:15:32] Running: lb config --distribution bookworm --architectures amd64
[09:16:01] P: Setting up chroot environment
[09:16:45] P: Installing core packages (base/desktop/business/security/support)
[09:18:22] P: Running hooks 0100-0400
[09:19:12] P: Building ISO image...
[09:19:13] \u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2591\u2591\u2591\u2591\u2591\u2591 72% \u2014 Creating squashfs...`)), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u76E3\u67FB\u30ED\u30B0"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid #f1f5f9" } }, ["\u65E5\u6642", "\u30A2\u30AF\u30BF\u30FC", "\u30A2\u30AF\u30B7\u30E7\u30F3", "Request ID"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, AUDIT_LOG.filter((a) => job && (a.detail.includes(job.id.slice(0, 8)) || a.detail.includes(job.profile))).slice(0, 4).map((a, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f8fafc" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, a.at), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, a.actor), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, a.action), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("code", { style: { fontSize: 10, color: "#94a3b8" } }, a.reqId))))))));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, "ISO \u914D\u5E03"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#94a3b8", margin: "2px 0 0" } }, "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225 ISO \u306E\u30D3\u30EB\u30C9\u30FB\u914D\u5E03\u30FB\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u7BA1\u7406")), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNew(true), style: { padding: "8px 18px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" } }, "+ \u65B0\u898F ISO \u30D3\u30EB\u30C9")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 } }, [
    { label: "\u7DCF\u30D3\u30EB\u30C9\u6570", val: ISO_JOBS_DATA.length, color: "#2563eb" },
    { label: "\u6210\u529F", val: ISO_JOBS_DATA.filter((j) => j.status === "succeeded").length, color: "#22c55e" },
    { label: "\u5B9F\u884C\u4E2D", val: ISO_JOBS_DATA.filter((j) => j.status === "running").length, color: "#3b82f6" },
    { label: "\u5931\u6557", val: ISO_JOBS_DATA.filter((j) => j.status === "failed").length, color: "#ef4444" }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: __spreadProps(__spreadValues({}, cardStyle), { padding: "14px 16px", textAlign: "center" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: s.color } }, s.val), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8" } }, s.label)))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30D3\u30EB\u30C9\u30B8\u30E7\u30D6\u4E00\u89A7"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u30B8\u30E7\u30D6ID", "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", "Git Ref", "\u72B6\u614B", "\u8981\u6C42\u8005", "\u4F5C\u6210\u65E5\u6642", "\u5B8C\u4E86\u65E5\u6642", "\u30B5\u30A4\u30BA"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, ISO_JOBS_DATA.map((j) => /* @__PURE__ */ React.createElement(
    "tr",
    {
      key: j.id,
      style: { borderTop: "1px solid #f1f5f9", cursor: "pointer" },
      onClick: () => setSelected(j.id),
      onMouseEnter: (e) => e.currentTarget.style.background = "#fafbfd",
      onMouseLeave: (e) => e.currentTarget.style.background = ""
    },
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500 }) }, j.id.slice(0, 8)),
    /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" } }, j.profile)),
    /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("code", { style: { fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 3 } }, j.gitRef)),
    /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: jBg(j.status), color: jColor(j.status) } }, jLabel(j.status))),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, j.requestedBy),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, j.createdAt),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, j.finishedAt || "\u2014"),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, j.size)
  ))))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "ISO \u914D\u5E03\u65B9\u6CD5"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8" } }, "\u5C0E\u5165\u9806\u5E8F: Phase 1\u21922\u21923\u21924\u21925")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 } }, DIST_METHODS.sort((a, b) => a.phase - b.phase).map((m) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: m.id,
      onClick: () => setDistMethod(m.id),
      style: { padding: "16px", background: "#f8fafc", borderRadius: 12, borderTop: `3px solid ${m.color}`, cursor: "pointer", transition: "all 150ms" },
      onMouseEnter: (e) => {
        e.currentTarget.style.boxShadow = `0 4px 16px ${m.color}20`;
        e.currentTarget.style.transform = "translateY(-2px)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, m.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${m.color}15`, color: m.color } }, "Phase ", m.phase)),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 } }, m.label),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, fontWeight: 600, color: m.color, marginBottom: 6 } }, m.method),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 10, lineHeight: 1.4 } }, m.desc),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3 } }, m.steps.slice(0, 4).map((s, j) => /* @__PURE__ */ React.createElement("div", { key: j, style: { display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#475569" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 14, height: 14, borderRadius: "50%", background: "#fff", border: `1.5px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: m.color, flexShrink: 0 } }, j + 1), s.label)), m.steps.length > 4 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", paddingLeft: 19 } }, "...\u4ED6 ", m.steps.length - 4, " \u30B9\u30C6\u30C3\u30D7")),
    /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, padding: "6px 0", borderTop: "1px solid #e8ecf1", textAlign: "center", fontSize: 11, color: m.color, fontWeight: 600 } }, "\u958B\u59CB \u2192")
  )))));
};
window.IsoPage = IsoPage;

/* === proto-page-deployment.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const DEPLOY_PROFILES_DEFAULT = {
  standard: {
    defaultUser: "cdxuser",
    passwordPolicy: "force_change",
    autoLogin: false,
    adJoin: true,
    adDomain: "mirai.local",
    adDcHost: "VMSV3001",
    adJoinUser: "svc-domainjoin",
    adOuPath: "OU=Workstations,OU=Standard,DC=mirai,DC=local",
    adLoginUser: "",
    hostnamePrefix: "CDX-HQ-",
    hostnameAuto: true,
    timezone: "Asia/Tokyo",
    locale: "ja_JP.UTF-8"
  },
  field: {
    defaultUser: "cdxfield",
    passwordPolicy: "force_change",
    autoLogin: false,
    adJoin: true,
    adDomain: "mirai.local",
    adDcHost: "VMSV3001",
    adJoinUser: "svc-domainjoin",
    adOuPath: "OU=Workstations,OU=Field,DC=mirai,DC=local",
    adLoginUser: "",
    hostnamePrefix: "CDX-FLD-",
    hostnameAuto: true,
    timezone: "Asia/Tokyo",
    locale: "ja_JP.UTF-8"
  },
  kiosk: {
    defaultUser: "kiosk",
    passwordPolicy: "fixed",
    autoLogin: true,
    adJoin: false,
    adDomain: "",
    adDcHost: "",
    adJoinUser: "",
    adOuPath: "",
    adLoginUser: "",
    hostnamePrefix: "CDX-KSK-",
    hostnameAuto: true,
    timezone: "Asia/Tokyo",
    locale: "ja_JP.UTF-8"
  }
};
Object.assign(window, { DEPLOY_PROFILES_DEFAULT });
function DeploymentPage() {
  const [activeProf, setActiveProf] = React.useState("standard");
  const [configs, setConfigs] = React.useState(
    JSON.parse(JSON.stringify(DEPLOY_PROFILES_DEFAULT))
  );
  const [saved, setSaved] = React.useState(false);
  const [showPreseed, setShowPreseed] = React.useState(false);
  const cfg = configs[activeProf];
  const set = (key, val) => {
    setConfigs((prev) => __spreadProps(__spreadValues({}, prev), {
      [activeProf]: __spreadProps(__spreadValues({}, prev[activeProf]), { [key]: val })
    }));
    setSaved(false);
  };
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3e3);
  };
  const profiles = [
    { id: "standard", label: "standard", desc: "\u4E8B\u52D9\u30FB\u672C\u793E", icon: "\u{1F4BC}", color: "#3b82f6" },
    { id: "field", label: "field", desc: "\u73FE\u5834\u30FB\u5DE1\u56DE", icon: "\u{1F9BA}", color: "#f59e0b" },
    { id: "kiosk", label: "kiosk", desc: "\u53D7\u4ED8\u30FB\u5171\u7528", icon: "\u{1F4FA}", color: "#8b5cf6" }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 } }, "\u{1F510} OS\u30FB\u8A8D\u8A3C\u8A2D\u5B9A"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#64748b" } }, "ISO \u30D3\u30EB\u30C9\u6642\u306B preseed.cfg \u3078\u713C\u304D\u8FBC\u3080\u3001\u30ED\u30B0\u30A4\u30F3\u30A2\u30AB\u30A6\u30F3\u30C8\u30FBActive Directory \u53C2\u52A0\u30FB\u30DB\u30B9\u30C8\u540D\u306E\u8A2D\u5B9A\u3092\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225\u306B\u7BA1\u7406\u3057\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("div", { style: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    padding: "10px 16px",
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 20
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F4A1}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#1d4ed8" } }, "\u3053\u3053\u3067\u8A2D\u5B9A\u3057\u305F\u5185\u5BB9\u306F ", /* @__PURE__ */ React.createElement("strong", null, "ISO \u914D\u5E03\u30DA\u30FC\u30B8\u3067\u306E\u30D3\u30EB\u30C9\u6642"), " \u306B\u81EA\u52D5\u7684\u306B\u53CD\u6620\u3055\u308C\u307E\u3059\u3002 \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u3054\u3068\u306B\u7570\u306A\u308B\u8A2D\u5B9A\u3092\u4FDD\u5B58\u3067\u304D\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 20 } }, profiles.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, onClick: () => setActiveProf(p.id), style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    border: "2px solid",
    borderColor: activeProf === p.id ? p.color : "#e2e8f0",
    background: activeProf === p.id ? p.color + "15" : "#fff",
    cursor: "pointer",
    transition: "all 120ms"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, p.icon), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "left" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: activeProf === p.id ? 700 : 500, color: activeProf === p.id ? p.color : "#0f172a" } }, p.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8" } }, p.desc))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement(SectionTitle, { icon: "\u{1F464}", title: "\u30ED\u30B0\u30A4\u30F3\u8A2D\u5B9A" }), /* @__PURE__ */ React.createElement(FormField, { label: "\u30C7\u30D5\u30A9\u30EB\u30C8\u30E6\u30FC\u30B6\u30FC\u540D", required: true }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: cfg.defaultUser,
      onChange: (e) => set("defaultUser", e.target.value),
      placeholder: "\u4F8B: cdxuser",
      style: inputStyle
    }
  ), /* @__PURE__ */ React.createElement("div", { style: hintStyle }, "OS \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5F8C\u306B\u4F5C\u6210\u3055\u308C\u308B\u30ED\u30FC\u30AB\u30EB\u30E6\u30FC\u30B6\u30FC\u540D")), /* @__PURE__ */ React.createElement(FormField, { label: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30DD\u30EA\u30B7\u30FC" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, [
    { val: "force_change", label: "\u521D\u56DE\u30ED\u30B0\u30A4\u30F3\u6642\u306B\u5909\u66F4\u3092\u5F37\u5236", desc: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u63A8\u5968" },
    { val: "fixed", label: "\u56FA\u5B9A\u30D1\u30B9\u30EF\u30FC\u30C9", desc: "kiosk \u7B49\u306E\u81EA\u52D5\u904B\u7528\u5411\u3051" }
  ].map((opt) => /* @__PURE__ */ React.createElement("label", { key: opt.val, style: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "radio",
      name: `pw-${activeProf}`,
      checked: cfg.passwordPolicy === opt.val,
      onChange: () => set("passwordPolicy", opt.val),
      style: { accentColor: "#2563eb" }
    }
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#0f172a" } }, opt.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8" } }, opt.desc)))))), /* @__PURE__ */ React.createElement(FormField, { label: "\u81EA\u52D5\u30ED\u30B0\u30A4\u30F3" }, /* @__PURE__ */ React.createElement(
    ToggleSwitch,
    {
      checked: cfg.autoLogin,
      onChange: (v) => set("autoLogin", v),
      label: cfg.autoLogin ? "\u6709\u52B9\uFF08\u96FB\u6E90ON \u3067\u81EA\u52D5\u30ED\u30B0\u30A4\u30F3\uFF09" : "\u7121\u52B9",
      color: "#8b5cf6"
    }
  ), cfg.autoLogin && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, hintStyle), { color: "#7c3aed", marginTop: 4 }) }, "\u26A0\uFE0F kiosk \u7AEF\u672B\u5C02\u7528\u3002\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u4E0A\u3001\u4E00\u822C\u7AEF\u672B\u306B\u306F\u63A8\u5968\u3057\u307E\u305B\u3093\u3002"))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement(SectionTitle, { icon: "\u{1F3F7}\uFE0F", title: "\u30DB\u30B9\u30C8\u540D\u30FB\u30ED\u30B1\u30FC\u30EB\u8A2D\u5B9A" }), /* @__PURE__ */ React.createElement(FormField, { label: "\u30DB\u30B9\u30C8\u540D\u30D7\u30EC\u30D5\u30A3\u30C3\u30AF\u30B9" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: cfg.hostnamePrefix,
      onChange: (e) => set("hostnamePrefix", e.target.value),
      placeholder: "\u4F8B: CDX-HQ-",
      style: inputStyle
    }
  ), /* @__PURE__ */ React.createElement("div", { style: hintStyle }, "\u7AEF\u672B\u756A\u53F7\u3068\u7D44\u307F\u5408\u308F\u305B\u3066\u81EA\u52D5\u63A1\u756A (\u4F8B: CDX-HQ-001)")), /* @__PURE__ */ React.createElement(FormField, { label: "\u30DB\u30B9\u30C8\u540D\u63A1\u756A" }, /* @__PURE__ */ React.createElement(
    ToggleSwitch,
    {
      checked: cfg.hostnameAuto,
      onChange: (v) => set("hostnameAuto", v),
      label: cfg.hostnameAuto ? "\u81EA\u52D5\u63A1\u756A\uFF08DHCP/PXE \u304B\u3089\u6255\u3044\u51FA\u3057\uFF09" : "\u624B\u52D5\u8A2D\u5B9A",
      color: "#3b82f6"
    }
  )), /* @__PURE__ */ React.createElement(FormField, { label: "\u30BF\u30A4\u30E0\u30BE\u30FC\u30F3" }, /* @__PURE__ */ React.createElement("select", { value: cfg.timezone, onChange: (e) => set("timezone", e.target.value), style: __spreadProps(__spreadValues({}, inputStyle), { padding: "7px 10px" }) }, /* @__PURE__ */ React.createElement("option", { value: "Asia/Tokyo" }, "Asia/Tokyo (JST +0900)"), /* @__PURE__ */ React.createElement("option", { value: "UTC" }, "UTC +0000"), /* @__PURE__ */ React.createElement("option", { value: "Asia/Osaka" }, "Asia/Osaka (JST +0900)"))), /* @__PURE__ */ React.createElement(FormField, { label: "\u30ED\u30B1\u30FC\u30EB" }, /* @__PURE__ */ React.createElement("select", { value: cfg.locale, onChange: (e) => set("locale", e.target.value), style: __spreadProps(__spreadValues({}, inputStyle), { padding: "7px 10px" }) }, /* @__PURE__ */ React.createElement("option", { value: "ja_JP.UTF-8" }, "ja_JP.UTF-8\uFF08\u65E5\u672C\u8A9E\uFF09"), /* @__PURE__ */ React.createElement("option", { value: "en_US.UTF-8" }, "en_US.UTF-8\uFF08\u82F1\u8A9E\uFF09")))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { gridColumn: "1 / -1" }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement(SectionTitle, { icon: "\u{1F3E2}", title: "Active Directory \u53C2\u52A0\u8A2D\u5B9A", noMargin: true }), /* @__PURE__ */ React.createElement(
    ToggleSwitch,
    {
      checked: cfg.adJoin,
      onChange: (v) => set("adJoin", v),
      label: cfg.adJoin ? "AD \u53C2\u52A0\u3042\u308A" : "AD \u53C2\u52A0\u306A\u3057\uFF08\u30ED\u30FC\u30AB\u30EB\u8A8D\u8A3C\uFF09",
      color: "#22c55e"
    }
  )), cfg.adJoin ? /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, /* @__PURE__ */ React.createElement(FormField, { label: "AD \u30C9\u30E1\u30A4\u30F3\u540D", required: true }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: cfg.adDomain,
      onChange: (e) => set("adDomain", e.target.value),
      placeholder: "\u4F8B: corp.kensetsu-dx.co.jp",
      style: inputStyle
    }
  ), /* @__PURE__ */ React.createElement("div", { style: hintStyle }, "FQDN \u5F62\u5F0F\u3067\u5165\u529B")), /* @__PURE__ */ React.createElement(FormField, { label: "\u30C9\u30E1\u30A4\u30F3\u30B3\u30F3\u30C8\u30ED\u30FC\u30E9 IP / FQDN", required: true }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: cfg.adDcHost,
      onChange: (e) => set("adDcHost", e.target.value),
      placeholder: "\u4F8B: 192.168.1.10 \u307E\u305F\u306F dc.corp.example.co.jp",
      style: inputStyle
    }
  )), /* @__PURE__ */ React.createElement(FormField, { label: "AD \u53C2\u52A0\u30A2\u30AB\u30A6\u30F3\u30C8\u540D\uFF08\u30C9\u30E1\u30A4\u30F3\u53C2\u52A0\u7528 SVC\uFF09", required: true }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: cfg.adJoinUser,
      onChange: (e) => set("adJoinUser", e.target.value),
      placeholder: "\u4F8B: svc-domainjoin",
      style: inputStyle
    }
  ), /* @__PURE__ */ React.createElement("div", { style: hintStyle }, "\u30C9\u30E1\u30A4\u30F3\u53C2\u52A0\u5C02\u7528\u306E\u30B5\u30FC\u30D3\u30B9\u30A2\u30AB\u30A6\u30F3\u30C8\u3002\u6700\u5C0F\u6A29\u9650\uFF08\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u53C2\u52A0\u306E\u307F\uFF09\u63A8\u5968\u3002")), /* @__PURE__ */ React.createElement(FormField, { label: "OU \u30D1\u30B9\uFF08\u53C2\u52A0\u5148 OU\uFF09" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: cfg.adOuPath,
      onChange: (e) => set("adOuPath", e.target.value),
      placeholder: "\u4F8B: OU=Workstations,OU=HQ,DC=corp,DC=kensetsu-dx,DC=co,DC=jp",
      style: inputStyle
    }
  ), /* @__PURE__ */ React.createElement("div", { style: hintStyle }, "\u7A7A\u6B04\u6642\u306F\u30C7\u30D5\u30A9\u30EB\u30C8 OU (Computers) \u306B\u53C2\u52A0")), /* @__PURE__ */ React.createElement(FormField, { label: "\u30C9\u30E1\u30A4\u30F3\u30ED\u30B0\u30A4\u30F3 \u30E6\u30FC\u30B6\u30FC\u540D\u5F62\u5F0F" }, /* @__PURE__ */ React.createElement(
    "select",
    {
      value: cfg.adLoginUser,
      onChange: (e) => set("adLoginUser", e.target.value),
      style: __spreadProps(__spreadValues({}, inputStyle), { padding: "7px 10px" })
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "SAM \u30A2\u30AB\u30A6\u30F3\u30C8\u540D\uFF08\u4F8B: tanaka\uFF09"),
    /* @__PURE__ */ React.createElement("option", { value: "upn" }, "UPN \u5F62\u5F0F\uFF08\u4F8B: tanaka@corp.kensetsu-dx.co.jp\uFF09"),
    /* @__PURE__ */ React.createElement("option", { value: "netbios" }, "NetBIOS \u5F62\u5F0F\uFF08\u4F8B: CORP\\tanaka\uFF09")
  ), /* @__PURE__ */ React.createElement("div", { style: hintStyle }, "\u30ED\u30B0\u30A4\u30F3\u753B\u9762\u3067\u3069\u306E\u5F62\u5F0F\u306E\u30E6\u30FC\u30B6\u30FC\u540D\u3092\u4F7F\u3046\u304B\u3092\u8A2D\u5B9A")), /* @__PURE__ */ React.createElement("div", { style: {
    gridColumn: "1 / -1",
    background: cfg.adDomain && cfg.adJoinUser ? "#f0fdf4" : "#fffbeb",
    borderRadius: 8,
    padding: "10px 14px",
    border: `1px solid ${cfg.adDomain && cfg.adJoinUser ? "#bbf7d0" : "#fde68a"}`,
    fontSize: 11
  } }, cfg.adDomain && cfg.adJoinUser ? /* @__PURE__ */ React.createElement("div", { style: { color: "#15803d" } }, "\u2705 ", /* @__PURE__ */ React.createElement("strong", null, cfg.adJoinUser), " \u30A2\u30AB\u30A6\u30F3\u30C8\u3067 ", /* @__PURE__ */ React.createElement("strong", null, cfg.adDomain), " \u30C9\u30E1\u30A4\u30F3\u306B\u53C2\u52A0\u3057\u307E\u3059\u3002", cfg.adOuPath && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("br", null), "OU: ", /* @__PURE__ */ React.createElement("code", { style: { fontSize: 10 } }, cfg.adOuPath))) : /* @__PURE__ */ React.createElement("div", { style: { color: "#92400e" } }, "\u26A0\uFE0F AD\u30C9\u30E1\u30A4\u30F3\u540D\u3068\u53C2\u52A0\u30A2\u30AB\u30A6\u30F3\u30C8\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002"))) : /* @__PURE__ */ React.createElement("div", { style: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "14px 16px",
    fontSize: 12,
    color: "#64748b",
    display: "flex",
    gap: 10,
    alignItems: "center"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F513}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 500, marginBottom: 2 } }, "\u30ED\u30FC\u30AB\u30EB\u8A8D\u8A3C\u30E2\u30FC\u30C9"), /* @__PURE__ */ React.createElement("div", null, "AD \u306B\u53C2\u52A0\u3057\u307E\u305B\u3093\u3002\u30C7\u30D5\u30A9\u30EB\u30C8\u30E6\u30FC\u30B6\u30FC\u306E\u30ED\u30FC\u30AB\u30EB\u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u30ED\u30B0\u30A4\u30F3\u3057\u307E\u3059\u3002 \u30AD\u30AA\u30B9\u30AF\u7AEF\u672B\u30FB\u30B9\u30BF\u30F3\u30C9\u30A2\u30ED\u30F3\u73FE\u5834\u7AEF\u672B\u5411\u3051\u3067\u3059\u3002"))))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#64748b" } }, "\u8A2D\u5B9A\u306F\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225\u306B\u4FDD\u5B58\u3055\u308C\u3001ISO \u30D3\u30EB\u30C9\u6642\u306B\u81EA\u52D5\u53CD\u6620\u3055\u308C\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, saved && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#16a34a", fontWeight: 500 } }, "\u2705 \u4FDD\u5B58\u3057\u307E\u3057\u305F"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowPreseed(true), style: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#475569"
  } }, "\u{1F4C4} preseed.cfg \u30D7\u30EC\u30D3\u30E5\u30FC"), /* @__PURE__ */ React.createElement("button", { onClick: handleSave, style: {
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600
  } }, "\u{1F4BE} \u8A2D\u5B9A\u3092\u4FDD\u5B58"))), showPreseed && /* @__PURE__ */ React.createElement(PreseedModal, { cfg, profile: activeProf, onClose: () => setShowPreseed(false) }));
}
function PreseedModal({ cfg, profile, onClose }) {
  const lines = [
    `# preseed.cfg \u2014 ${profile} profile (auto-generated)`,
    `# Generated by cdx-server OS\u30FB\u8A8D\u8A3C\u8A2D\u5B9A`,
    ``,
    `### Locale`,
    `d-i debian-installer/locale string ${cfg.locale}`,
    `d-i keyboard-configuration/xkb-keymap select jp`,
    ``,
    `### Clock`,
    `d-i time/zone string ${cfg.timezone}`,
    `d-i clock-setup/utc boolean true`,
    ``,
    `### User account`,
    `d-i passwd/user-fullname string ${cfg.defaultUser}`,
    `d-i passwd/username string ${cfg.defaultUser}`,
    `d-i passwd/user-password-crypted password $6$rounds=4096$CHANGEME`,
    cfg.passwordPolicy === "force_change" ? `# Force password change on first login (via chage -d 0)` : `# Fixed password \u2014 no expiry`,
    ``,
    cfg.autoLogin ? `### Auto-login (kiosk)
d-i passwd/auto-login boolean true
d-i passwd/auto-login-user string ${cfg.defaultUser}` : `### Auto-login disabled`,
    ``,
    `### Hostname`,
    cfg.hostnameAuto ? `d-i netcfg/hostname string ${cfg.hostnamePrefix}{{AUTO}}` : `d-i netcfg/hostname string ${cfg.hostnamePrefix}001`,
    ``,
    cfg.adJoin && (cfg.adDomain || "mirai.local") ? [
      `### Active Directory (realm join via post-install script)`,
      `# Domain:     ${cfg.adDomain}`,
      `# DC:         ${cfg.adDcHost}`,
      `# Join user:  ${cfg.adJoinUser}`,
      `# OU:         ${cfg.adOuPath || "(default)"}`,
      `# Login fmt:  ${cfg.adLoginUser || "SAM (username)"}`,
      `d-i preseed/late_command string \\`,
      `    in-target realm join --user=${cfg.adJoinUser} \\`,
      `    --computer-ou="${cfg.adOuPath}" \\`,
      `    ${cfg.adDomain}`
    ].join("\n") : `# AD join: disabled (local auth only)`
  ].join("\n");
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e3
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    width: 700,
    maxWidth: "90vw",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,.2)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#0f172a" } }, "\u{1F4C4} preseed.cfg \u30D7\u30EC\u30D3\u30E5\u30FC \u2014 ", profile, " \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB"), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: "#94a3b8"
  } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 10 } }, "ISO \u30D3\u30EB\u30C9\u6642\u306B\u81EA\u52D5\u751F\u6210\u3055\u308C\u308B\u8A2D\u5B9A\u30D5\u30A1\u30A4\u30EB\u306E\u30D7\u30EC\u30D3\u30E5\u30FC\u3067\u3059\u3002\u30D1\u30B9\u30EF\u30FC\u30C9\u30CF\u30C3\u30B7\u30E5\u306F\u5B9F\u969B\u306E\u30D3\u30EB\u30C9\u6642\u306B\u7F6E\u63DB\u3055\u308C\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("pre", { style: {
    background: "#1e1e2e",
    color: "#cdd6f4",
    borderRadius: 8,
    padding: "14px 16px",
    overflowY: "auto",
    flex: 1,
    fontSize: 11,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap"
  } }, lines), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: {
    padding: "8px 20px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#475569"
  } }, "\u9589\u3058\u308B"), /* @__PURE__ */ React.createElement("button", { style: {
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600
  } }, "\u{1F4CB} \u30AF\u30EA\u30C3\u30D7\u30DC\u30FC\u30C9\u306B\u30B3\u30D4\u30FC"))));
}
function SectionTitle({ icon, title, noMargin }) {
  return /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: noMargin ? 0 : 14, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", null, icon), title);
}
function FormField({ label, required, children }) {
  return /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 } }, label, required && /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444", marginLeft: 3 } }, "*")), children);
}
function ToggleSwitch({ checked, onChange, label, color = "#22c55e" }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => onChange(!checked),
      style: {
        width: 40,
        height: 22,
        borderRadius: 11,
        cursor: "pointer",
        background: checked ? color : "#e2e8f0",
        position: "relative",
        transition: "background 200ms",
        flexShrink: 0
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      top: 3,
      left: checked ? 21 : 3,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      transition: "left 200ms"
    } })
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: checked ? "#0f172a" : "#94a3b8" } }, label));
}
const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  outline: "none",
  fontFamily: "inherit"
};
const hintStyle = { fontSize: 10, color: "#94a3b8", marginTop: 3, lineHeight: 1.4 };

/* === proto-page-register.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const CSV_TEMPLATE_HEADER = "serial_number,hostname,profile,ou,ad_user_sam,ad_user_cn,location,notes";
const CSV_TEMPLATE_ROWS = [
  'SN-HQ-001001,CDX-HQ-001,standard,"OU=Workstations,OU=Standard,DC=mirai,DC=local",T001,\u7530\u4E2D \u592A\u90CE,\u65B0\u5BBF\u672C\u793E,\u672C\u793E1F-A\u68DF',
  'SN-HQ-001002,CDX-HQ-002,standard,"OU=Workstations,OU=Standard,DC=mirai,DC=local",T002,\u9234\u6728 \u82B1\u5B50,\u65B0\u5BBF\u672C\u793E,\u672C\u793E1F-B\u68DF',
  'SN-FLD-002001,CDX-FLD-001,field,"OU=Workstations,OU=Field,DC=mirai,DC=local",T010,\u5409\u7530 \u6D69\u4E8C,\u5DDD\u5D0E\u73FE\u5834A,',
  'SN-FLD-002002,CDX-FLD-002,field,"OU=Workstations,OU=Field,DC=mirai,DC=local",T005,\u4F0A\u85E4 \u7F8E\u54B2,\u6A2A\u6D5C\u73FE\u5834B,',
  "SN-KSK-003001,CDX-KSK-001,kiosk,,,,\u540D\u53E4\u5C4B\u652F\u5E97,\u53D7\u4ED8\u30ED\u30D3\u30FC"
];
const DEPLOY_REGISTER_MOCK = [
  { id: 1, serial: "SN-HQ-001001", hostname: "CDX-HQ-001", profile: "standard", ou: "OU=Workstations,OU=Standard,DC=mirai,DC=local", sam: "T001", cn: "\u7530\u4E2D \u592A\u90CE", location: "\u65B0\u5BBF\u672C\u793E", notes: "\u672C\u793E1F-A\u68DF", status: "deployed", registeredAt: "2026-05-10" },
  { id: 2, serial: "SN-HQ-001002", hostname: "CDX-HQ-002", profile: "standard", ou: "OU=Workstations,OU=Standard,DC=mirai,DC=local", sam: "T002", cn: "\u9234\u6728 \u82B1\u5B50", location: "\u65B0\u5BBF\u672C\u793E", notes: "\u672C\u793E1F-B\u68DF", status: "deployed", registeredAt: "2026-05-10" },
  { id: 3, serial: "SN-HQ-001003", hostname: "CDX-HQ-003", profile: "standard", ou: "OU=Workstations,OU=Standard,DC=mirai,DC=local", sam: "T004", cn: "\u4F50\u85E4 \u4E09\u90CE", location: "\u65B0\u5BBF\u672C\u793E", notes: "", status: "deployed", registeredAt: "2026-05-11" },
  { id: 4, serial: "SN-BR-002001", hostname: "CDX-BR-010", profile: "standard", ou: "OU=Workstations,OU=Standard,DC=mirai,DC=local", sam: "T003", cn: "\u5C71\u7530 \u6B21\u90CE", location: "\u5927\u962A\u652F\u5E97", notes: "", status: "deployed", registeredAt: "2026-05-11" },
  { id: 5, serial: "SN-BR-002002", hostname: "CDX-BR-011", profile: "standard", ou: "OU=Workstations,OU=Standard,DC=mirai,DC=local", sam: "T006", cn: "\u6E21\u8FBA \u5065\u4E00", location: "\u5927\u962A\u652F\u5E97", notes: "", status: "deployed", registeredAt: "2026-05-12" },
  { id: 6, serial: "SN-FLD-003001", hostname: "CDX-FLD-101", profile: "field", ou: "OU=Workstations,OU=Field,DC=mirai,DC=local", sam: "T008", cn: "\u5C0F\u6797 \u6B63\u9053", location: "\u5DDD\u5D0E\u73FE\u5834A", notes: "", status: "pending", registeredAt: "2026-05-13" },
  { id: 7, serial: "SN-FLD-003002", hostname: "CDX-FLD-102", profile: "field", ou: "OU=Workstations,OU=Field,DC=mirai,DC=local", sam: "T010", cn: "\u5409\u7530 \u6D69\u4E8C", location: "\u6A2A\u6D5C\u73FE\u5834B", notes: "", status: "deployed", registeredAt: "2026-05-12" },
  { id: 8, serial: "SN-FLD-003003", hostname: "CDX-FLD-103", profile: "field", ou: "OU=Workstations,OU=Field,DC=mirai,DC=local", sam: "T005", cn: "\u4F0A\u85E4 \u7F8E\u54B2", location: "\u5343\u8449\u73FE\u5834C", notes: "", status: "deployed", registeredAt: "2026-05-12" },
  { id: 9, serial: "SN-KSK-004001", hostname: "CDX-KSK-201", profile: "kiosk", ou: "", sam: "", cn: "", location: "\u540D\u53E4\u5C4B\u652F\u5E97", notes: "\u53D7\u4ED8\u30ED\u30D3\u30FC", status: "deployed", registeredAt: "2026-05-10" },
  { id: 10, serial: "SN-KSK-004002", hostname: "CDX-KSK-202", profile: "kiosk", ou: "", sam: "", cn: "", location: "\u798F\u5CA1\u652F\u5E97", notes: "\u53D7\u4ED8\u30ED\u30D3\u30FC", status: "deployed", registeredAt: "2026-05-10" }
];
const STATUS_META = {
  deployed: { label: "\u5C55\u958B\u6E08\u307F", color: "#22c55e", bg: "#f0fdf4" },
  pending: { label: "\u672A\u5C55\u958B", color: "#f59e0b", bg: "#fffbeb" },
  error: { label: "\u30A8\u30E9\u30FC", color: "#ef4444", bg: "#fef2f2" },
  planned: { label: "\u8A08\u753B\u4E2D", color: "#8b5cf6", bg: "#f5f3ff" }
};
Object.assign(window, { DEPLOY_REGISTER_MOCK, CSV_TEMPLATE_HEADER, CSV_TEMPLATE_ROWS, STATUS_META });
function RegisterPage() {
  var _a, _b, _c;
  const [activeTab, setActiveTab] = React.useState("list");
  const [records, setRecords] = React.useState(DEPLOY_REGISTER_MOCK);
  const [search, setSearch] = React.useState("");
  const [profileFilter, setProfileFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [csvText, setCsvText] = React.useState("");
  const [csvPreview, setCsvPreview] = React.useState([]);
  const [csvError, setCsvError] = React.useState("");
  const [importDone, setImportDone] = React.useState(false);
  const [showTemplate, setShowTemplate] = React.useState(false);
  const [fsStatus, setFsStatus] = React.useState(null);
  const [fsLoading, setFsLoading] = React.useState(false);
  const [fsQueue, setFsQueue] = React.useState([]);
  const [fsScanDone, setFsScanDone] = React.useState(false);
  const [fsConfirming, setFsConfirming] = React.useState(null);
  const [fsHostname, setFsHostname] = React.useState("");
  const [fsProfile, setFsProfile] = React.useState("standard");
  const [fsLocation, setFsLocation] = React.useState("");
  const fetchFsStatus = async () => {
    setFsLoading(true);
    try {
      const r = await fetch("/api/v1/serial/status");
      setFsStatus(await r.json());
    } catch (e) {
      setFsStatus({ mounted: false, error: "API\u5230\u9054\u4E0D\u53EF" });
    }
    setFsLoading(false);
  };
  const triggerFsScan = async () => {
    setFsLoading(true);
    setFsScanDone(false);
    try {
      const r = await fetch("/api/v1/serial/scan", { method: "POST" });
      const data = await r.json();
      setFsQueue((prev) => [...data.items, ...prev]);
      setFsScanDone(true);
      setFsStatus((prev) => prev ? __spreadProps(__spreadValues({}, prev), { pending_images: 0, queue_size: data.processed }) : null);
    } catch (e) {
    }
    setFsLoading(false);
  };
  const fetchFsQueue = async () => {
    const r = await fetch("/api/v1/serial/queue");
    const data = await r.json();
    setFsQueue(data.items || []);
  };
  const confirmFsItem = async (item) => {
    if (!fsHostname) return;
    const r = await fetch(`/api/v1/serial/confirm/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serial_number: item.serial_confirmed, hostname: fsHostname, profile: fsProfile, location: fsLocation })
    });
    if (r.ok) {
      const confirmed = await r.json();
      setFsQueue((prev) => prev.map((i) => i.id === item.id ? confirmed : i));
      setRecords((prev) => [...prev, {
        id: Date.now(),
        serial: confirmed.serial_confirmed,
        hostname: confirmed.hostname,
        profile: confirmed.profile,
        ou: confirmed.profile !== "kiosk" ? `OU=Workstations,OU=Standard,DC=mirai,DC=local` : "",
        sam: "",
        cn: "",
        location: confirmed.location,
        notes: "GMSV0002 OCR\u30B9\u30AD\u30E3\u30F3",
        status: "planned",
        registeredAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      }]);
      setFsConfirming(null);
      setFsHostname("");
      setFsLocation("");
    }
  };
  const discardFsItem = async (id) => {
    await fetch(`/api/v1/serial/queue/${id}`, { method: "DELETE" });
    setFsQueue((prev) => prev.filter((i) => i.id !== id));
  };
  const [ocrImage, setOcrImage] = React.useState(null);
  const [ocrStatus, setOcrStatus] = React.useState("idle");
  const [ocrResult, setOcrResult] = React.useState("");
  const [ocrConfirmed, setOcrConfirmed] = React.useState("");
  const fileInputRef = React.useRef(null);
  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setOcrImage(ev.target.result);
      setOcrStatus("analyzing");
      setOcrResult("");
      setTimeout(() => {
        const mockSerial = "SN-" + file.name.replace(/\.[^.]+$/, "").toUpperCase().slice(0, 12).replace(/[^A-Z0-9-]/g, "-") || "SN-UNKNOWN";
        const candidates = ["SN-HQ-005001", "SN-FLD-006002", "SN-KSK-007001", mockSerial];
        const extracted = candidates[Math.floor(Math.random() * 2)];
        setOcrResult(extracted);
        setOcrConfirmed(extracted);
        setOcrStatus("done");
      }, 1500);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const appendOcrToCsv = () => {
    if (!ocrConfirmed) return;
    const newRow = `${ocrConfirmed},,standard,"OU=Workstations,OU=Standard,DC=mirai,DC=local",,,`;
    setCsvText((prev) => prev ? prev + "\n" + newRow : CSV_TEMPLATE_HEADER + "\n" + newRow);
    setOcrImage(null);
    setOcrStatus("idle");
    setOcrResult("");
    setOcrConfirmed("");
    setActiveTab("import");
  };
  const tabs = [
    { id: "list", label: "\u5C55\u958B\u53F0\u5E33", icon: "\u{1F4CB}" },
    { id: "fileserver", label: "\u30D5\u30A1\u30A4\u30EB\u30B5\u30FC\u30D0\u30FC\u9023\u643A", icon: "\u{1F5A5}\uFE0F" },
    { id: "camera", label: "\u30AB\u30E1\u30E9\u8AAD\u307F\u53D6\u308A", icon: "\u{1F4F7}" },
    { id: "import", label: "CSV \u30A4\u30F3\u30DD\u30FC\u30C8", icon: "\u{1F4E5}" },
    { id: "export", label: "\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8", icon: "\u{1F4E4}" }
  ];
  const filtered = records.filter((r) => {
    if (profileFilter !== "all" && r.profile !== profileFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.hostname.toLowerCase().includes(q) || r.serial.toLowerCase().includes(q) || r.cn.toLowerCase().includes(q) || r.sam.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
    }
    return true;
  });
  const stats = {
    total: records.length,
    deployed: records.filter((r) => r.status === "deployed").length,
    pending: records.filter((r) => r.status === "pending").length,
    error: records.filter((r) => r.status === "error").length
  };
  const parseCsv = (text) => {
    setCsvError("");
    const lines = text.trim().split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      setCsvError("2\u884C\u4EE5\u4E0A\u5FC5\u8981\u3067\u3059\uFF08\u30D8\u30C3\u30C0\u30FC\uFF0B\u30C7\u30FC\u30BF\uFF09");
      return;
    }
    const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const required = ["serial_number", "hostname", "profile"];
    const missing = required.filter((f) => !header.includes(f));
    if (missing.length) {
      setCsvError(`\u5FC5\u9808\u5217\u304C\u4E0D\u8DB3: ${missing.join(", ")}`);
      return;
    }
    const rows = lines.slice(1).map((line, idx) => {
      const cols = line.match(new RegExp('(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)', "g")) || [];
      const obj = {};
      header.forEach((h, i) => {
        obj[h] = (cols[i] || "").replace(/^"|"$/g, "").trim();
      });
      return {
        id: Date.now() + idx,
        serial: obj.serial_number || "",
        hostname: obj.hostname || "",
        profile: obj.profile || "standard",
        ou: obj.ou || "",
        sam: obj.ad_user_sam || "",
        cn: obj.ad_user_cn || "",
        location: obj.location || "",
        notes: obj.notes || "",
        status: "planned",
        registeredAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
      };
    });
    setCsvPreview(rows);
  };
  const handleImport = () => {
    if (csvPreview.length === 0) return;
    setRecords((prev) => [...prev, ...csvPreview]);
    setCsvPreview([]);
    setCsvText("");
    setImportDone(true);
    setActiveTab("list");
    setTimeout(() => setImportDone(false), 3e3);
  };
  const buildCsvRow = (r, cols) => cols.map((c) => {
    const v = r[c] || "";
    return v.includes(",") ? `"${v}"` : v;
  }).join(",");
  const downloadCsv = (filename, header, rows) => {
    const content = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const exportFull = () => {
    const cols = ["serial", "hostname", "profile", "ou", "sam", "cn", "location", "notes", "status", "registeredAt"];
    const header = "\u30B7\u30EA\u30A2\u30EB\u756A\u53F7,\u30DB\u30B9\u30C8\u540D,\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB,OU\u30D1\u30B9,\u793E\u54E1\u756A\u53F7,\u6C0F\u540D,\u8A2D\u7F6E\u5834\u6240,\u5099\u8003,\u30B9\u30C6\u30FC\u30BF\u30B9,\u767B\u9332\u65E5";
    downloadCsv(
      `cdx-deploy-register-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`,
      header,
      records.map((r) => buildCsvRow(r, cols))
    );
  };
  const exportSerialHostname = () => {
    const header = "\u30B7\u30EA\u30A2\u30EB\u756A\u53F7,\u30DB\u30B9\u30C8\u540D,\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB,\u8A2D\u7F6E\u5834\u6240,\u767B\u9332\u65E5";
    downloadCsv(
      `cdx-serial-hostname-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`,
      header,
      records.map((r) => [r.serial, r.hostname, r.profile, r.location, r.registeredAt].join(","))
    );
  };
  const exportAdUsers = () => {
    const header = "\u30DB\u30B9\u30C8\u540D,\u30B7\u30EA\u30A2\u30EB\u756A\u53F7,\u793E\u54E1\u756A\u53F7(sAMAccountName),\u6C0F\u540D(CN),\u8A2D\u7F6E\u5834\u6240,OU\u30D1\u30B9";
    const rows = records.filter((r) => r.sam).map((r) => [r.hostname, r.serial, r.sam, r.cn, r.location, r.ou].join(","));
    downloadCsv(`cdx-ad-user-assign-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`, header, rows);
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 } }, "\u{1F4CB} \u5C55\u958B\u53F0\u5E33"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#64748b" } }, "CSV\u4E00\u62EC\u30A4\u30F3\u30DD\u30FC\u30C8\u3067\u7AEF\u672B\u306E\u30DB\u30B9\u30C8\u540D\u30FB\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u30FBAD\u30E6\u30FC\u30B6\u30FC\u3092\u7BA1\u7406\u3057\u307E\u3059\u3002 ISO\u5C55\u958B\u6642\u306B\u81EA\u52D5\u53C2\u7167\u3055\u308C\u3001\u30DB\u30B9\u30C8\u540D\u2194\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u306E\u7D10\u4ED8\u3051\u53F0\u5E33\u3092\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u3067\u304D\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 } }, [
    { label: "\u767B\u9332\u53F0\u6570", value: stats.total, icon: "\u{1F4CB}", color: "#3b82f6" },
    { label: "\u5C55\u958B\u6E08\u307F", value: stats.deployed, icon: "\u2705", color: "#22c55e" },
    { label: "\u672A\u5C55\u958B", value: stats.pending, icon: "\u23F3", color: "#f59e0b" },
    { label: "\u30A8\u30E9\u30FC", value: stats.error, icon: "\u274C", color: "#ef4444" }
  ].map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, style: __spreadProps(__spreadValues({}, cardStyle), { display: "flex", alignItems: "center", gap: 12 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22 } }, c.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8", marginBottom: 2 } }, c.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: c.color } }, c.value))))), importDone && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: "10px 16px",
    marginBottom: 16,
    fontSize: 12,
    color: "#15803d",
    fontWeight: 600
  } }, "\u2705 CSV\u30A4\u30F3\u30DD\u30FC\u30C8\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e8ecf1" } }, tabs.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, onClick: () => setActiveTab(t.id), style: {
    padding: "8px 16px",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: activeTab === t.id ? 600 : 400,
    color: activeTab === t.id ? "#2563eb" : "#64748b",
    borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
    marginBottom: -2,
    display: "flex",
    alignItems: "center",
    gap: 6
  } }, /* @__PURE__ */ React.createElement("span", null, t.icon), t.label))), activeTab === "list" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }) }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "\u30DB\u30B9\u30C8\u540D / \u30B7\u30EA\u30A2\u30EB\u756A\u53F7 / \u6C0F\u540D / \u5834\u6240...",
      value: search,
      onChange: (e) => setSearch(e.target.value),
      style: { flex: "1 1 200px", padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: profileFilter,
      onChange: (e) => setProfileFilter(e.target.value),
      style: { padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "all" }, "\u5168\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB"),
    /* @__PURE__ */ React.createElement("option", { value: "standard" }, "standard"),
    /* @__PURE__ */ React.createElement("option", { value: "field" }, "field"),
    /* @__PURE__ */ React.createElement("option", { value: "kiosk" }, "kiosk")
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: statusFilter,
      onChange: (e) => setStatusFilter(e.target.value),
      style: { padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "all" }, "\u5168\u30B9\u30C6\u30FC\u30BF\u30B9"),
    /* @__PURE__ */ React.createElement("option", { value: "deployed" }, "\u5C55\u958B\u6E08\u307F"),
    /* @__PURE__ */ React.createElement("option", { value: "pending" }, "\u672A\u5C55\u958B"),
    /* @__PURE__ */ React.createElement("option", { value: "planned" }, "\u8A08\u753B\u4E2D"),
    /* @__PURE__ */ React.createElement("option", { value: "error" }, "\u30A8\u30E9\u30FC")
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#64748b" } }, filtered.length, " \u4EF6")), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { overflow: "auto" }) }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 800 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u30DB\u30B9\u30C8\u540D", "\u30B7\u30EA\u30A2\u30EB\u756A\u53F7", "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", "AD\u30E6\u30FC\u30B6\u30FC\uFF08CN / SAM\uFF09", "\u8A2D\u7F6E\u5834\u6240", "OU\u30D1\u30B9", "\u30B9\u30C6\u30FC\u30BF\u30B9", "\u767B\u9332\u65E5"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: __spreadProps(__spreadValues({}, thStyle), { fontSize: 10 }) }, h)))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((r) => {
    const sm = STATUS_META[r.status] || STATUS_META.planned;
    return /* @__PURE__ */ React.createElement("tr", { key: r.id, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#2563eb" }) }, r.hostname), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontSize: 11, color: "#475569" }) }, r.serial), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9" } }, r.profile)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, r.cn ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#0f172a" } }, r.cn), /* @__PURE__ */ React.createElement("code", { style: { fontSize: 10, color: "#3b82f6" } }, r.sam)) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#94a3b8" } }, "\u2014")), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#64748b", fontSize: 11 }) }, r.location), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontSize: 9, color: "#94a3b8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }) }, r.ou || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: sm.bg, color: sm.color } }, sm.label)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11, color: "#94a3b8" }) }, r.registeredAt));
  }))))), activeTab === "fileserver" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "14px 16px",
    border: "1px solid #e8ecf1",
    fontSize: 11
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, color: "#0f172a", marginBottom: 8, fontSize: 12 } }, "\u{1F3D7}\uFE0F \u9023\u643A\u30D5\u30ED\u30FC"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", color: "#475569" } }, ["\u{1F4F1} iPhone\u64AE\u5F71", "\u2192", "\u{1F4C2} GMSV0002 \u5171\u6709\u30D5\u30A9\u30EB\u30C0", "\u2192", "\u{1F5A5}\uFE0F cdx-server \u30DE\u30A6\u30F3\u30C8", "\u2192", "\u{1F50D} easyocr OCR\u51E6\u7406", "\u2192", "\u{1F4CB} \u5C55\u958B\u53F0\u5E33 \u53D6\u308A\u8FBC\u307F\u30AD\u30E5\u30FC", "\u2192", "\u2705 \u30DB\u30B9\u30C8\u540D\u78BA\u5B9A"].map((s, i) => /* @__PURE__ */ React.createElement("span", { key: i, style: { fontWeight: s === "\u2192" ? 400 : 600, color: s === "\u2192" ? "#cbd5e1" : "#0f172a", fontSize: s === "\u2192" ? 14 : 11 } }, s))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, color: "#64748b" } }, "SMB\u30DE\u30A6\u30F3\u30C8: ", /* @__PURE__ */ React.createElement("code", { style: { background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 } }, "/mnt/gmsv0002-serial"), "\xA0| OCR\u30A8\u30F3\u30B8\u30F3: ", /* @__PURE__ */ React.createElement("code", { style: { background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 } }, "easyocr"), "\xA0| \u5BFE\u5FDC\u5F62\u5F0F: ", /* @__PURE__ */ React.createElement("code", { style: { background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 } }, "JPEG\u30FBPNG\u30FBHEIC\u30FBBMP\u30FBTIFF"), "\xA0| \u8A8D\u8A3C: cdx-server \u30ED\u30B0\u30A4\u30F3\u30E6\u30FC\u30B6\u30FC\u306E\u307F")), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, "\u{1F5A5}\uFE0F GMSV0002 \u63A5\u7D9A\u30B9\u30C6\u30FC\u30BF\u30B9"), /* @__PURE__ */ React.createElement("button", { onClick: fetchFsStatus, disabled: fsLoading, style: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "none",
    background: fsLoading ? "#93c5fd" : "#2563eb",
    color: "#fff",
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600
  } }, fsLoading ? "\u78BA\u8A8D\u4E2D..." : "\u{1F50D} \u72B6\u614B\u78BA\u8A8D")), fsStatus === null ? /* @__PURE__ */ React.createElement("div", { style: { color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "12px 0" } }, "\u300C\u72B6\u614B\u78BA\u8A8D\u300D\u3092\u62BC\u3057\u3066GMSV0002\u306E\u63A5\u7D9A\u72B6\u614B\u3092\u78BA\u8A8D\u3057\u307E\u3059") : /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 } }, [
    { label: "SMB\u30DE\u30A6\u30F3\u30C8", value: fsStatus.mounted ? "\u30DE\u30A6\u30F3\u30C8\u6E08\u307F" : "\u672A\u30DE\u30A6\u30F3\u30C8", ok: fsStatus.mounted, icon: "\u{1F517}" },
    { label: "\u65B0\u7740\u753B\u50CF", value: `${(_a = fsStatus.pending_images) != null ? _a : 0}\u4EF6`, ok: ((_b = fsStatus.pending_images) != null ? _b : 0) >= 0, icon: "\u{1F5BC}\uFE0F" },
    { label: "OCR\u30AD\u30E5\u30FC", value: `${(_c = fsStatus.queue_size) != null ? _c : fsQueue.length}\u4EF6`, ok: true, icon: "\u{1F4CB}" },
    { label: "\u30AD\u30E5\u30FCDB", value: fsStatus.queue_backend === "postgres" ? "PostgreSQL (\u6C38\u7D9A)" : "In-Memory", ok: true, icon: "\u{1F4BE}" },
    { label: "\u30E2\u30FC\u30C9", value: fsStatus.mock_mode ? "\u30C6\u30B9\u30C8(Mock)" : "\u672C\u756A(easyocr)", ok: true, icon: "\u2699\uFE0F" }
  ].map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, style: { background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: `1px solid ${c.ok ? "#e8ecf1" : "#fecaca"}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8", marginBottom: 2 } }, c.icon, " ", c.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: c.ok ? "#0f172a" : "#ef4444" } }, c.value))))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u{1F4E1} \u65B0\u7740\u753B\u50CF\u3092OCR\u51E6\u7406"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", marginBottom: fsScanDone ? 10 : 0 } }, /* @__PURE__ */ React.createElement("button", { onClick: triggerFsScan, disabled: fsLoading, style: {
    padding: "9px 22px",
    borderRadius: 8,
    border: "none",
    background: fsLoading ? "#93c5fd" : "#2563eb",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600
  } }, fsLoading ? "\u23F3 OCR\u51E6\u7406\u4E2D..." : "\u{1F50D} GMSV0002\u304B\u3089\u30B9\u30AD\u30E3\u30F3\u5B9F\u884C"), /* @__PURE__ */ React.createElement("button", { onClick: fetchFsQueue, style: {
    padding: "9px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#475569"
  } }, "\u{1F504} \u30AD\u30E5\u30FC\u3092\u66F4\u65B0")), fsScanDone && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#16a34a", fontWeight: 500 } }, "\u2705 \u30B9\u30AD\u30E3\u30F3\u5B8C\u4E86\u3002\u4E0B\u306E\u30AD\u30E5\u30FC\u3067\u78BA\u8A8D\u30FB\u30DB\u30B9\u30C8\u540D\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002")), fsQueue.length > 0 && /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u{1F4CB} OCR\u53D6\u308A\u8FBC\u307F\u30AD\u30E5\u30FC (", fsQueue.length, "\u4EF6)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, fsQueue.map((item) => /* @__PURE__ */ React.createElement("div", { key: item.id, style: {
    background: item.status === "confirmed" ? "#f0fdf4" : "#f8fafc",
    borderRadius: 10,
    padding: "12px 14px",
    border: `1px solid ${item.status === "confirmed" ? "#bbf7d0" : "#e8ecf1"}`
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: item.status !== "confirmed" && fsConfirming !== item.id ? 0 : 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 10,
    fontWeight: 600,
    background: item.status === "confirmed" ? "#dcfce7" : "#eff6ff",
    color: item.status === "confirmed" ? "#16a34a" : "#2563eb"
  } }, item.status === "confirmed" ? "\u2705 \u78BA\u5B9A" : "\u23F3 \u672A\u78BA\u5B9A"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#64748b" } }, "\u5143\u30D5\u30A1\u30A4\u30EB: "), /* @__PURE__ */ React.createElement("code", { style: { fontSize: 11, color: "#475569" } }, item.filename)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#64748b" } }, "OCR\u7D50\u679C: "), /* @__PURE__ */ React.createElement("code", { style: { fontSize: 13, fontWeight: 700, color: "#2563eb" } }, item.serial_confirmed)), item.hostname && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#64748b" } }, "\u30DB\u30B9\u30C8\u540D: "), /* @__PURE__ */ React.createElement("code", { style: { fontSize: 12, fontWeight: 600, color: "#22c55e" } }, item.hostname))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, item.status !== "confirmed" && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setFsConfirming(item.id);
        setFsHostname("");
      },
      style: { padding: "5px 12px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600 }
    },
    "\u270F\uFE0F \u30DB\u30B9\u30C8\u540D\u3092\u8A2D\u5B9A"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => discardFsItem(item.id),
      style: { padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#94a3b8" }
    },
    "\u7834\u68C4"
  ))), fsConfirming === item.id && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, marginTop: 8, alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 10, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 } }, "\u30DB\u30B9\u30C8\u540D ", /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: fsHostname,
      onChange: (e) => setFsHostname(e.target.value),
      placeholder: "CDX-HQ-005",
      style: { width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #2563eb", fontSize: 12, outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 10, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 } }, "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: fsProfile,
      onChange: (e) => setFsProfile(e.target.value),
      style: { width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "standard" }, "standard"),
    /* @__PURE__ */ React.createElement("option", { value: "field" }, "field"),
    /* @__PURE__ */ React.createElement("option", { value: "kiosk" }, "kiosk")
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => confirmFsItem(item),
      disabled: !fsHostname,
      style: {
        padding: "8px 16px",
        borderRadius: 8,
        border: "none",
        background: fsHostname ? "#22c55e" : "#e2e8f0",
        color: fsHostname ? "#fff" : "#94a3b8",
        fontSize: 12,
        cursor: "pointer",
        fontWeight: 600
      }
    },
    "\u2705 \u78BA\u5B9A"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setFsConfirming(null),
      style: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#94a3b8" }
    },
    "\u30AD\u30E3\u30F3\u30BB\u30EB"
  )))))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { background: "#fffbeb", border: "1px solid #fde68a" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 8 } }, "\u{1F4D6} GMSV0002 \u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u624B\u9806"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11, color: "#78350f" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 4 } }, "\u2460 GMSV0002 \u5074\uFF08IT\u7BA1\u7406\u8005\uFF09"), /* @__PURE__ */ React.createElement("div", { style: { lineHeight: 1.8 } }, "1. \u5171\u6709\u30D5\u30A9\u30EB\u30C0\u4F5C\u6210: ", /* @__PURE__ */ React.createElement("code", null, "cdx-serial-scans"), /* @__PURE__ */ React.createElement("br", null), "2. \u30A2\u30AF\u30BB\u30B9\u6A29: ", /* @__PURE__ */ React.createElement("code", null, "MIRAI\\svc-cdxserver"), " \u8AAD\u307F\u66F8\u304D", /* @__PURE__ */ React.createElement("br", null), "3. iOS\u30E6\u30FC\u30B6\u30FC\u306B\u8AAD\u307F\u66F8\u304D\u6A29\u9650\u4ED8\u4E0E")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 4 } }, "\u2461 cdx-server \u5074"), /* @__PURE__ */ React.createElement("div", { style: { lineHeight: 1.8 } }, /* @__PURE__ */ React.createElement("code", null, "sudo mount -t cifs //GMSV0002/cdx-serial-scans"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("code", null, "/mnt/gmsv0002-serial -o credentials="), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("code", null, "/etc/cdx-smb.creds,iocharset=utf8"), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("code", null, "SERIAL_SCAN_MOCK=0 SERIAL_SCAN_PATH=/mnt/..."))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 4 } }, "\u2462 iPhone \u5074"), /* @__PURE__ */ React.createElement("div", { style: { lineHeight: 1.8 } }, "\u300C\u30D5\u30A1\u30A4\u30EB\u300D\u30A2\u30D7\u30EA \u2192 \u53F3\u4E0A\u300C\u2026\u300D\u2192\u300C\u30B5\u30FC\u30D0\u30FC\u306B\u63A5\u7D9A\u300D", /* @__PURE__ */ React.createElement("br", null), "smb://GMSV0002 \u2192 \u30E6\u30FC\u30B6\u30FC\u540D\u30FB\u30D1\u30B9\u30EF\u30FC\u30C9\u5165\u529B", /* @__PURE__ */ React.createElement("br", null), "cdx-serial-scans \u30D5\u30A9\u30EB\u30C0\u306B\u5199\u771F\u3092\u4FDD\u5B58")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 4 } }, "\u2463 \u81EA\u52D5\u5316\uFF08\u30AA\u30D7\u30B7\u30E7\u30F3\uFF09"), /* @__PURE__ */ React.createElement("div", { style: { lineHeight: 1.8 } }, "cron: ", /* @__PURE__ */ React.createElement("code", null, "*/5 * * * * curl -X POST .../api/v1/serial/scan"), /* @__PURE__ */ React.createElement("br", null), "\u307E\u305F\u306F inotifywait \u3067\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u691C\u77E5", /* @__PURE__ */ React.createElement("br", null), "easyocr install: ", /* @__PURE__ */ React.createElement("code", null, "pip install easyocr"), /* @__PURE__ */ React.createElement("br", null), "HEIC\u5BFE\u5FDC\uFF08iPhone\u6A19\u6E96\u5F62\u5F0F\uFF09: ", /* @__PURE__ */ React.createElement("code", null, "pip install pillow-heif")))))), activeTab === "camera" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    padding: "12px 16px",
    display: "flex",
    gap: 10,
    alignItems: "flex-start"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20 } }, "\u{1F4F7}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#1d4ed8" } }, "\u7AEF\u672B\u672C\u4F53\u306E\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u30E9\u30D9\u30EB\u3092\u64AE\u5F71\u3059\u308B\u3068\u3001OCR \u3067\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u3092\u81EA\u52D5\u62BD\u51FA\u3057\u307E\u3059\u3002", /* @__PURE__ */ React.createElement("br", null), "\u62BD\u51FA\u7D50\u679C\u3092\u78BA\u8A8D\u5F8C\u3001CSV \u30A4\u30F3\u30DD\u30FC\u30C8\u306B\u8FFD\u8A18\u3067\u304D\u307E\u3059\u3002", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("strong", null, "\u5BFE\u5FDC\u5F62\u5F0F:"), " JPEG\u30FBPNG\u30FB", /* @__PURE__ */ React.createElement("strong", null, "HEIC"), "\uFF08iPhone\u6A19\u6E96\uFF09\u30FBBMP\u30FBTIFF", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("strong", null, "\u672C\u756A\u5B9F\u88C5:"), " Tesseract.js\uFF08\u30D6\u30E9\u30A6\u30B6\u5185OCR\uFF09\u307E\u305F\u306F ", /* @__PURE__ */ React.createElement("code", null, "/api/v1/ocr"), " \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u3092\u4F7F\u7528\u3002")), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u30E9\u30D9\u30EB\u3092\u64AE\u5F71"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("label", { style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: 10,
    cursor: "pointer",
    background: "#2563eb",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F4F7}"), "\u30AB\u30E1\u30E9\u3067\u64AE\u5F71", /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: fileInputRef,
      type: "file",
      accept: "image/jpeg,image/png,image/heic,image/heif,image/bmp,image/tiff",
      capture: "environment",
      onChange: handleImageCapture,
      style: { display: "none" }
    }
  )), /* @__PURE__ */ React.createElement("label", { style: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    borderRadius: 10,
    cursor: "pointer",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    fontSize: 13
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, "\u{1F5BC}\uFE0F"), "\u753B\u50CF\u30D5\u30A1\u30A4\u30EB\u3092\u9078\u629E", /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      accept: "image/jpeg,image/png,image/heic,image/heif,image/bmp,image/tiff",
      onChange: handleImageCapture,
      style: { display: "none" }
    }
  ))), ocrImage && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 } }, "\u64AE\u5F71\u753B\u50CF"), /* @__PURE__ */ React.createElement(
    "img",
    {
      src: ocrImage,
      alt: "serial label",
      style: { width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 } }, "OCR \u89E3\u6790\u7D50\u679C", ocrStatus === "analyzing" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#3b82f6", marginLeft: 8, fontWeight: 400 } }, "\u23F3 \u89E3\u6790\u4E2D..."), ocrStatus === "done" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#22c55e", marginLeft: 8, fontWeight: 400 } }, "\u2705 \u5B8C\u4E86")), ocrStatus === "analyzing" ? /* @__PURE__ */ React.createElement("div", { style: { padding: "12px", background: "#f8fafc", borderRadius: 8, textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#64748b" } }, "Tesseract.js \u3067 OCR \u5B9F\u884C\u4E2D..."), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: "60%", background: "#3b82f6", borderRadius: 2, animation: "none" } }))) : ocrStatus === "done" ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 4 } }, "\u62BD\u51FA\u3055\u308C\u305F\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\uFF08\u7DE8\u96C6\u53EF\uFF09"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: ocrConfirmed,
      onChange: (e) => setOcrConfirmed(e.target.value),
      style: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: "2px solid #22c55e",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "monospace",
        outline: "none",
        color: "#0f172a"
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#64748b", marginTop: 4 } }, "\u8AA4\u8A8D\u8B58\u304C\u3042\u308B\u5834\u5408\u306F\u76F4\u63A5\u7DE8\u96C6\u3057\u3066\u304F\u3060\u3055\u3044")) : null), ocrStatus === "done" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: appendOcrToCsv, style: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#22c55e",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600
  } }, "\u2705 CSV\u306B\u8FFD\u8A18\u3057\u3066\u30A4\u30F3\u30DD\u30FC\u30C8\u3078"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const newRec = {
      id: Date.now(),
      serial: ocrConfirmed,
      hostname: "",
      profile: "standard",
      ou: "OU=Workstations,OU=Standard,DC=mirai,DC=local",
      sam: "",
      cn: "",
      location: "",
      notes: "\u30AB\u30E1\u30E9OCR\u8AAD\u307F\u53D6\u308A",
      status: "planned",
      registeredAt: now
    };
    setRecords((prev) => [...prev, newRec]);
    setOcrImage(null);
    setOcrStatus("idle");
    setActiveTab("list");
  }, style: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#2563eb"
  } }, "\u{1F4CB} \u53F0\u5E33\u306B\u76F4\u63A5\u8FFD\u52A0\uFF08\u30DB\u30B9\u30C8\u540D\u7B49\u306F\u5F8C\u3067\u8A2D\u5B9A\uFF09"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setOcrImage(null);
        setOcrStatus("idle");
        setOcrResult("");
      },
      style: { padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#94a3b8" }
    },
    "\u3084\u308A\u76F4\u3059"
  )))), !ocrImage && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "16px",
    textAlign: "center",
    border: "2px dashed #e2e8f0"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, marginBottom: 8 } }, "\u{1F4E6}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#64748b", lineHeight: 1.6 } }, "\u7AEF\u672B\u3092\u53D7\u3051\u53D6\u3063\u305F\u30891\u53F0\u305A\u3064\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u3092\u64AE\u5F71\u3057\u3066\u304F\u3060\u3055\u3044\u3002", /* @__PURE__ */ React.createElement("br", null), "\u64AE\u5F71 \u2192 OCR\u78BA\u8A8D \u2192 \u53F0\u5E33\u8FFD\u52A0 \u3092\u7E70\u308A\u8FD4\u3059\u3053\u3068\u3067", /* @__PURE__ */ React.createElement("br", null), "\u5927\u91CF\u5C55\u958B\u6642\u306E\u8CC7\u7523\u767B\u9332\u3092\u7D20\u65E9\u304F\u5B8C\u4E86\u3067\u304D\u307E\u3059\u3002"))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u6700\u8FD1\u30B9\u30AD\u30E3\u30F3\u3057\u305F\u7AEF\u672B"), records.filter((r) => r.notes === "\u30AB\u30E1\u30E9OCR\u8AAD\u307F\u53D6\u308A").length > 0 ? /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u30B7\u30EA\u30A2\u30EB\u756A\u53F7", "\u30DB\u30B9\u30C8\u540D", "\u30B9\u30C6\u30FC\u30BF\u30B9", "\u767B\u9332\u65E5"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: __spreadProps(__spreadValues({}, thStyle), { fontSize: 10 }) }, h)))), /* @__PURE__ */ React.createElement("tbody", null, records.filter((r) => r.notes === "\u30AB\u30E1\u30E9OCR\u8AAD\u307F\u53D6\u308A").map((r) => /* @__PURE__ */ React.createElement("tr", { key: r.id, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontWeight: 600, color: "#2563eb" }) }, r.serial), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: r.hostname ? "#0f172a" : "#94a3b8", fontStyle: r.hostname ? "normal" : "italic" }) }, r.hostname || "\u672A\u8A2D\u5B9A"), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: "#f5f3ff", color: "#7c3aed" } }, "\u8A08\u753B\u4E2D")), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11, color: "#94a3b8" }) }, r.registeredAt))))) : /* @__PURE__ */ React.createElement("div", { style: { color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "12px 0", fontStyle: "italic" } }, "\u307E\u3060\u30B9\u30AD\u30E3\u30F3\u5C65\u6B74\u304C\u3042\u308A\u307E\u305B\u3093"))), activeTab === "import" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, "\u{1F4C4} CSV \u30C6\u30F3\u30D7\u30EC\u30FC\u30C8"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowTemplate(!showTemplate), style: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 11,
    cursor: "pointer",
    color: "#2563eb"
  } }, showTemplate ? "\u9589\u3058\u308B" : "\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u3092\u8868\u793A")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: showTemplate ? 10 : 0, lineHeight: 1.7 } }, /* @__PURE__ */ React.createElement("strong", null, "\u5FC5\u9808\u5217:"), " serial_number\uFF08\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\uFF09, hostname\uFF08\u30DB\u30B9\u30C8\u540D\uFF09, profile\uFF08standard/field/kiosk\uFF09", /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("strong", null, "\u4EFB\u610F\u5217:"), " ou\uFF08OU\u30D1\u30B9\uFF09, ad_user_sam\uFF08\u793E\u54E1\u756A\u53F7\uFF09, ad_user_cn\uFF08\u6C0F\u540D\uFF09, location\uFF08\u8A2D\u7F6E\u5834\u6240\uFF09, notes\uFF08\u5099\u8003\uFF09"), showTemplate && /* @__PURE__ */ React.createElement("pre", { style: {
    background: "#1e1e2e",
    color: "#cdd6f4",
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 10,
    overflowX: "auto",
    lineHeight: 1.6,
    whiteSpace: "pre"
  } }, CSV_TEMPLATE_HEADER + "\n" + CSV_TEMPLATE_ROWS.join("\n")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        const content = CSV_TEMPLATE_HEADER + "\n" + CSV_TEMPLATE_ROWS.join("\n");
        const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cdx-deploy-template.csv";
        a.click();
        URL.revokeObjectURL(url);
      },
      style: {
        padding: "7px 16px",
        borderRadius: 8,
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontSize: 12,
        cursor: "pointer",
        fontWeight: 600
      }
    },
    "\u{1F4E5} \u30C6\u30F3\u30D7\u30EC\u30FC\u30C8 CSV \u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9"
  ))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u{1F4CB} CSV\u3092\u8CBC\u308A\u4ED8\u3051"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: csvText,
      onChange: (e) => {
        setCsvText(e.target.value);
        setCsvPreview([]);
        setCsvError("");
      },
      placeholder: CSV_TEMPLATE_HEADER + "\nSN-HQ-001001,CDX-HQ-001,standard,...",
      rows: 8,
      style: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        border: `1px solid ${csvError ? "#fecaca" : "#e2e8f0"}`,
        fontSize: 11,
        fontFamily: "monospace",
        resize: "vertical",
        outline: "none",
        lineHeight: 1.5
      }
    }
  ), csvError && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#ef4444", marginTop: 4 } }, "\u26A0\uFE0F ", csvError), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => parseCsv(csvText), disabled: !csvText.trim(), style: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    background: csvText.trim() ? "#2563eb" : "#e2e8f0",
    color: csvText.trim() ? "#fff" : "#94a3b8",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600
  } }, "\u{1F50D} \u30D7\u30EC\u30D3\u30E5\u30FC\u78BA\u8A8D"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setCsvText("");
        setCsvPreview([]);
        setCsvError("");
      },
      style: { padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#64748b" }
    },
    "\u30AF\u30EA\u30A2"
  ))), csvPreview.length > 0 && /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#16a34a" } }, "\u2705 \u30D7\u30EC\u30D3\u30E5\u30FC (", csvPreview.length, "\u4EF6)"), /* @__PURE__ */ React.createElement("button", { onClick: handleImport, style: {
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    background: "#22c55e",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600
  } }, "\u{1F4E5} ", csvPreview.length, "\u4EF6\u3092\u30A4\u30F3\u30DD\u30FC\u30C8")), /* @__PURE__ */ React.createElement("div", { style: { overflow: "auto" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 700 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f0fdf4" } }, ["\u30DB\u30B9\u30C8\u540D", "\u30B7\u30EA\u30A2\u30EB\u756A\u53F7", "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", "\u793E\u54E1\u756A\u53F7", "\u6C0F\u540D", "\u8A2D\u7F6E\u5834\u6240"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: __spreadProps(__spreadValues({}, thStyle), { fontSize: 10 }) }, h)))), /* @__PURE__ */ React.createElement("tbody", null, csvPreview.map((r, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: "#2563eb" }) }, r.hostname), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontSize: 11 }) }, r.serial), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f1f5f9" } }, r.profile)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11 }) }, /* @__PURE__ */ React.createElement("code", { style: { color: "#3b82f6" } }, r.sam || "\u2014")), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11 }) }, r.cn || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11, color: "#64748b" }) }, r.location)))))))), activeTab === "export" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, [
    {
      title: "\u{1F4CB} \u5C55\u958B\u53F0\u5E33\uFF08\u5168\u30D5\u30A3\u30FC\u30EB\u30C9\uFF09",
      desc: "\u30DB\u30B9\u30C8\u540D\u30FB\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u30FBAD \u30E6\u30FC\u30B6\u30FC\u30FBOU\u30FB\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u542B\u3080\u5B8C\u5168\u306A\u5C55\u958B\u8A18\u9332",
      btn: "\u{1F4E4} \u5168\u30D5\u30A3\u30FC\u30EB\u30C9CSV\u51FA\u529B",
      action: exportFull,
      color: "#2563eb",
      preview: "\u30B7\u30EA\u30A2\u30EB\u756A\u53F7,\u30DB\u30B9\u30C8\u540D,\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB,OU\u30D1\u30B9,\u793E\u54E1\u756A\u53F7,\u6C0F\u540D,...",
      count: records.length
    },
    {
      title: "\u{1F517} \u30DB\u30B9\u30C8\u540D\u2194\u30B7\u30EA\u30A2\u30EB\u756A\u53F7 \u7D10\u4ED8\u3051\u53F0\u5E33",
      desc: "IT\u8CC7\u7523\u7BA1\u7406\u7528\u3002\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u3068\u30DB\u30B9\u30C8\u540D\u306E\u5BFE\u5FDC\u8868\u306E\u307F\u3092\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8",
      btn: "\u{1F4E4} \u30B7\u30EA\u30A2\u30EB\u2194\u30DB\u30B9\u30C8\u540DCSV",
      action: exportSerialHostname,
      color: "#22c55e",
      preview: "\u30B7\u30EA\u30A2\u30EB\u756A\u53F7,\u30DB\u30B9\u30C8\u540D,\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB,\u8A2D\u7F6E\u5834\u6240,\u767B\u9332\u65E5",
      count: records.length
    },
    {
      title: "\u{1F464} AD\u30E6\u30FC\u30B6\u30FC\u5272\u308A\u5F53\u3066\u4E00\u89A7",
      desc: "AD\u7BA1\u7406\u8005\u5411\u3051\u3002\u30DB\u30B9\u30C8\u540D\u30FB\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u30FBAD\u30E6\u30FC\u30B6\u30FC\uFF08CN/SAM\uFF09\u30FBOU\u30D1\u30B9\u306E\u5BFE\u5FDC\u8868",
      btn: "\u{1F4E4} AD\u30E6\u30FC\u30B6\u30FC\u5272\u308A\u5F53\u3066CSV",
      action: exportAdUsers,
      color: "#8b5cf6",
      preview: "\u30DB\u30B9\u30C8\u540D,\u30B7\u30EA\u30A2\u30EB\u756A\u53F7,\u793E\u54E1\u756A\u53F7(sAMAccountName),\u6C0F\u540D(CN),\u8A2D\u7F6E\u5834\u6240,OU\u30D1\u30B9",
      count: records.filter((r) => r.sam).length
    }
  ].map((e) => /* @__PURE__ */ React.createElement("div", { key: e.title, style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 } }, e.title), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#64748b", marginBottom: 8 } }, e.desc), /* @__PURE__ */ React.createElement("div", { style: { background: "#f8fafc", borderRadius: 6, padding: "6px 10px", fontFamily: "monospace", fontSize: 10, color: "#94a3b8" } }, e.preview), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginTop: 6 } }, e.count, " \u4EF6")), /* @__PURE__ */ React.createElement("button", { onClick: e.action, style: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    background: e.color,
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
    flexShrink: 0
  } }, e.btn)))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    fontSize: 11,
    color: "#92400e"
  }) }, "\u{1F4A1} ", /* @__PURE__ */ React.createElement("strong", null, "\u5927\u91CF\u5C55\u958B\u306E\u63A8\u5968\u30D5\u30ED\u30FC:"), /* @__PURE__ */ React.createElement("br", null), "1. \u7AEF\u672B\u306E\u30B7\u30EA\u30A2\u30EB\u756A\u53F7\u4E00\u89A7\u3092CSV\u306B\u5165\u529B\uFF08Excel\u3067\u4F5C\u6210\u53EF\uFF09", /* @__PURE__ */ React.createElement("br", null), "2. \u793E\u540D\u898F\u5B9A\u306E\u30DB\u30B9\u30C8\u540D\u30FB\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u30FBAD\u30E6\u30FC\u30B6\u30FC\u3092\u7D10\u4ED8\u3051", /* @__PURE__ */ React.createElement("br", null), "3. \u3053\u306E\u30DA\u30FC\u30B8\u3067\u30A4\u30F3\u30DD\u30FC\u30C8 \u2192 ISO \u914D\u5E03\u6642\u306B\u81EA\u52D5\u53C2\u7167", /* @__PURE__ */ React.createElement("br", null), "4. \u5C55\u958B\u5F8C\u306B\u300C\u30B7\u30EA\u30A2\u30EB\u2194\u30DB\u30B9\u30C8\u540D\u53F0\u5E33\u300D\u3092\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u3057\u3066IT\u8CC7\u7523\u7BA1\u7406\u53F0\u5E33\u306B\u4FDD\u7BA1")));
}

/* === proto-page-apps.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const APPS_CATALOG = [
  /* ── 業務アプリ ── */
  {
    id: "libreoffice",
    name: "LibreOffice 7.6",
    category: "business",
    icon: "\u{1F4DD}",
    desc: "Writer / Calc / Impress \u7D71\u5408\u30AA\u30D5\u30A3\u30B9",
    pkg: "libreoffice",
    method: "apt",
    size: 350,
    unit: "MB",
    profiles: ["standard", "field"],
    recommended: true,
    detail: "Microsoft Office\u4E92\u63DB\u3002\u5EFA\u8A2D\u73FE\u5834\u306E\u5831\u544A\u66F8\u30FB\u5DE5\u7A0B\u8868\u30FB\u30D7\u30EC\u30BC\u30F3\u4F5C\u6210\u306B\u5BFE\u5FDC\u3002"
  },
  {
    id: "firefox-esr",
    name: "Firefox ESR",
    category: "business",
    icon: "\u{1F310}",
    desc: "\u4F01\u696D\u5411\u3051\u9577\u671F\u30B5\u30DD\u30FC\u30C8 Web\u30D6\u30E9\u30A6\u30B6",
    pkg: "firefox-esr",
    method: "apt",
    size: 70,
    unit: "MB",
    profiles: ["standard", "field", "kiosk"],
    recommended: true,
    detail: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u66F4\u65B0\u304C\u9577\u671F\u4FDD\u8A3C\u3002\u793E\u5185\u30B7\u30B9\u30C6\u30E0\u30FB\u96FB\u5B50\u7533\u8ACB\u306B\u4F7F\u7528\u3002"
  },
  {
    id: "thunderbird",
    name: "Thunderbird 115",
    category: "business",
    icon: "\u{1F4E7}",
    desc: "\u9AD8\u6A5F\u80FD\u30E1\u30FC\u30EB / \u30AB\u30EC\u30F3\u30C0\u30FC\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8",
    pkg: "thunderbird",
    method: "apt",
    size: 80,
    unit: "MB",
    profiles: ["standard"],
    recommended: false,
    detail: "Exchange/GMail\u30A2\u30AB\u30A6\u30F3\u30C8\u5BFE\u5FDC\u3002\u30AB\u30EC\u30F3\u30C0\u30FC\u30FB\u30BF\u30B9\u30AF\u7BA1\u7406\u6A5F\u80FD\u4ED8\u304D\u3002"
  },
  {
    id: "evince",
    name: "Evince (PDF Viewer)",
    category: "business",
    icon: "\u{1F4C4}",
    desc: "PDF / \u65BD\u5DE5\u56F3\u9762\u30D3\u30E5\u30FC\u30A2 (\u8EFD\u91CF)",
    pkg: "evince",
    method: "apt",
    size: 20,
    unit: "MB",
    profiles: ["standard", "field", "kiosk"],
    recommended: true,
    detail: "PDF\u30FBDjVu\u30FBTIFF\u5BFE\u5FDC\u3002\u73FE\u5834\u3067\u306E\u56F3\u9762\u78BA\u8A8D\u306B\u6700\u9069\u306A\u8EFD\u91CF\u30D3\u30E5\u30FC\u30A2\u3002"
  },
  /* ── 建設専用 ── */
  {
    id: "qgis",
    name: "QGIS 3.x",
    category: "construction",
    icon: "\u{1F5FA}\uFE0F",
    desc: "\u5730\u7406\u60C5\u5831\u30B7\u30B9\u30C6\u30E0 (GIS) \u2014 \u73FE\u5834\u6E2C\u91CF\u30FB\u5730\u56F3",
    pkg: "qgis",
    method: "apt",
    size: 450,
    unit: "MB",
    profiles: ["field"],
    recommended: true,
    detail: "GPS\u6E2C\u91CF\u30C7\u30FC\u30BF\u306E\u53EF\u8996\u5316\u3001\u73FE\u5834\u5730\u56F3\u4F5C\u6210\u3001\u571F\u5730\u60C5\u5831\u7BA1\u7406\u306B\u4F7F\u7528\u3002\u56FD\u571F\u5730\u7406\u9662\u30C7\u30FC\u30BF\u5BFE\u5FDC\u3002"
  },
  {
    id: "freecad",
    name: "FreeCAD 0.21",
    category: "construction",
    icon: "\u{1F3D7}\uFE0F",
    desc: "3D \u30D1\u30E9\u30E1\u30C8\u30EA\u30C3\u30AF CAD / BIM \u5BFE\u5FDC",
    pkg: "freecad",
    method: "apt",
    size: 300,
    unit: "MB",
    profiles: ["standard", "field"],
    recommended: false,
    detail: "BIM\u30E2\u30B8\u30E5\u30FC\u30EB\u642D\u8F09\u3002\u5EFA\u7BC9\u30FB\u69CB\u9020\u8A2D\u8A08\u306E3D\u30E2\u30C7\u30EA\u30F3\u30B0\u3068\u56F3\u9762\u751F\u6210\u304C\u53EF\u80FD\u3002"
  },
  {
    id: "inkscape",
    name: "Inkscape 1.3",
    category: "construction",
    icon: "\u270F\uFE0F",
    desc: "\u30D9\u30AF\u30BF\u30FC\u56F3\u5F62\u7DE8\u96C6 \u2014 \u65BD\u5DE5\u56F3\u30FB\u6A19\u8B58\u4F5C\u6210",
    pkg: "inkscape",
    method: "apt",
    size: 200,
    unit: "MB",
    profiles: ["standard"],
    recommended: false,
    detail: "DXF/SVG/PDF\u306E\u30D9\u30AF\u30BF\u30FC\u7DE8\u96C6\u3002\u65BD\u5DE5\u8A08\u753B\u56F3\u30FB\u6CE8\u610F\u6A19\u8B58\u30FB\u770B\u677F\u30C7\u30B6\u30A4\u30F3\u306B\u3002"
  },
  {
    id: "gimp",
    name: "GIMP 2.10",
    category: "construction",
    icon: "\u{1F5BC}\uFE0F",
    desc: "\u753B\u50CF\u7DE8\u96C6 \u2014 \u73FE\u5834\u5199\u771F\u30FB\u65BD\u5DE5\u8A18\u9332",
    pkg: "gimp",
    method: "apt",
    size: 120,
    unit: "MB",
    profiles: ["standard", "field"],
    recommended: false,
    detail: "\u73FE\u5834\u5199\u771F\u306E\u88DC\u6B63\u30FB\u6CE8\u91C8\u8FFD\u52A0\u30FB\u5DE5\u7A0B\u8A18\u9332\u753B\u50CF\u306E\u7DE8\u96C6\u3002RAW\u73FE\u50CF\u3082\u5BFE\u5FDC\u3002"
  },
  {
    id: "jwcad",
    name: "Jw_cad (Wine\u7D4C\u7531)",
    category: "construction",
    icon: "\u{1F4D0}",
    desc: "\u65E5\u672C\u5EFA\u8A2D\u696D\u754C\u6A19\u6E96 2D CAD (Wine\u5B9F\u884C)",
    pkg: "wine jwcad",
    method: "wine",
    size: 50,
    unit: "MB",
    profiles: ["standard", "field"],
    recommended: true,
    detail: "\u56FD\u5185\u5EFA\u8A2D\u73FE\u5834\u3067\u6700\u3082\u666E\u53CA\u3057\u305F2D CAD\u3002\u65E2\u5B58dwg/jww\u56F3\u9762\u3068\u306E\u4E92\u63DB\u6027\u304C\u9AD8\u3044\u3002Wine 8.0\u3067\u52D5\u4F5C\u78BA\u8A8D\u6E08\u307F\u3002"
  },
  /* ── ユーティリティ ── */
  {
    id: "remmina",
    name: "Remmina",
    category: "utility",
    icon: "\u{1F5A5}\uFE0F",
    desc: "\u30EA\u30E2\u30FC\u30C8\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7 (RDP / VNC / SSH)",
    pkg: "remmina",
    method: "apt",
    size: 40,
    unit: "MB",
    profiles: ["standard"],
    recommended: true,
    detail: "Windows\u30B5\u30FC\u30D0\u30FC\u30FB\u672C\u793E\u30B7\u30B9\u30C6\u30E0\u3078\u306ERDP\u63A5\u7D9A\u3002VNC/SSH\u5BFE\u5FDC\u3067\u30B5\u30FC\u30D0\u30FC\u7BA1\u7406\u306B\u3082\u4F7F\u7528\u3002"
  },
  {
    id: "vlc",
    name: "VLC 3.x",
    category: "utility",
    icon: "\u25B6\uFE0F",
    desc: "\u30DE\u30EB\u30C1\u30E1\u30C7\u30A3\u30A2\u30D7\u30EC\u30A4\u30E4\u30FC \u2014 \u73FE\u5834\u52D5\u753B\u78BA\u8A8D",
    pkg: "vlc",
    method: "apt",
    size: 120,
    unit: "MB",
    profiles: ["standard", "field"],
    recommended: false,
    detail: "\u307B\u307C\u5168\u52D5\u753B\u5F62\u5F0F\u5BFE\u5FDC\u3002\u30C9\u30ED\u30FC\u30F3\u6620\u50CF\u30FB\u5DE5\u4E8B\u9032\u6357\u52D5\u753B\u306E\u518D\u751F\u78BA\u8A8D\u306B\u3002"
  },
  {
    id: "timeshift",
    name: "Timeshift",
    category: "utility",
    icon: "\u23F1\uFE0F",
    desc: "\u30B7\u30B9\u30C6\u30E0\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8 / \u30D0\u30C3\u30AF\u30A2\u30C3\u30D7",
    pkg: "timeshift",
    method: "apt",
    size: 30,
    unit: "MB",
    profiles: ["standard"],
    recommended: false,
    detail: "BTRFS/rsync\u30B9\u30CA\u30C3\u30D7\u30B7\u30E7\u30C3\u30C8\u3002\u30B7\u30B9\u30C6\u30E0\u5909\u66F4\u524D\u306E\u5B89\u5168\u30DD\u30A4\u30F3\u30C8\u4F5C\u6210\u306B\u63A8\u5968\u3002"
  },
  {
    id: "gparted",
    name: "GParted",
    category: "utility",
    icon: "\u{1F4BE}",
    desc: "GUI \u30D1\u30FC\u30C6\u30A3\u30B7\u30E7\u30F3\u7BA1\u7406\u30C4\u30FC\u30EB",
    pkg: "gparted",
    method: "apt",
    size: 20,
    unit: "MB",
    profiles: ["standard"],
    recommended: false,
    detail: "\u30C7\u30A3\u30B9\u30AF\u30D1\u30FC\u30C6\u30A3\u30B7\u30E7\u30F3\u4F5C\u6210\u30FB\u5909\u66F4\u30FB\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3002\u7AEF\u672B\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u6642\u306B\u4F7F\u7528\u3002"
  },
  /* ── セキュリティ ── */
  {
    id: "clamav",
    name: "ClamAV + ClamTk",
    category: "security",
    icon: "\u{1F9A0}",
    desc: "\u30AA\u30FC\u30D7\u30F3\u30BD\u30FC\u30B9\u30A2\u30F3\u30C1\u30A6\u30A4\u30EB\u30B9 (GUI\u4ED8\u304D)",
    pkg: "clamav clamtk",
    method: "apt",
    size: 200,
    unit: "MB",
    profiles: ["standard", "field", "kiosk"],
    recommended: true,
    detail: "\u30AA\u30D5\u30E9\u30A4\u30F3\u5B9A\u7FA9\u30D5\u30A1\u30A4\u30EB\u66F4\u65B0\u5BFE\u5FDC\u3002USB\u7D4C\u7531\u30DE\u30EB\u30A6\u30A7\u30A2\u5BFE\u7B56\u3068\u3057\u3066\u5168\u7AEF\u672B\u306B\u63A8\u5968\u3002"
  },
  {
    id: "keepassxc",
    name: "KeePassXC 2.7",
    category: "security",
    icon: "\u{1F511}",
    desc: "\u30D1\u30B9\u30EF\u30FC\u30C9\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC (\u30ED\u30FC\u30AB\u30EB\u4FDD\u7BA1)",
    pkg: "keepassxc",
    method: "apt",
    size: 80,
    unit: "MB",
    profiles: ["standard"],
    recommended: true,
    detail: "\u6697\u53F7\u5316\u30ED\u30FC\u30AB\u30EBDB\u3002\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u30AF\u30E9\u30A6\u30C9\u975E\u4F9D\u5B58\u3067\u7BA1\u7406\u3002TOTP/SSH\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u5BFE\u5FDC\u3002"
  },
  {
    id: "veracrypt",
    name: "VeraCrypt 1.26",
    category: "security",
    icon: "\u{1F512}",
    desc: "\u30C7\u30A3\u30B9\u30AF / \u30D5\u30A1\u30A4\u30EB\u6697\u53F7\u5316\u30B3\u30F3\u30C6\u30CA",
    pkg: "veracrypt",
    method: "deb",
    size: 60,
    unit: "MB",
    profiles: ["standard", "field"],
    recommended: false,
    detail: "\u6301\u3061\u51FA\u3057USB\u30FB\u6A5F\u5BC6\u56F3\u9762\u30D5\u30A9\u30EB\u30C0\u306E\u6697\u53F7\u5316\u3002AES-256/Serpent\u5BFE\u5FDC\u3002\u60C5\u5831\u6F0F\u6D29\u5BFE\u7B56\u5FC5\u9808\u73FE\u5834\u5411\u3051\u3002"
  },
  /* ── コミュニケーション ── */
  {
    id: "zoom",
    name: "Zoom 6.x",
    category: "communication",
    icon: "\u{1F4F9}",
    desc: "\u30AA\u30F3\u30E9\u30A4\u30F3\u4F1A\u8B70 / \u73FE\u5834\u9060\u9694\u7ACB\u4F1A\u3044",
    pkg: "zoom",
    method: "deb",
    size: 150,
    unit: "MB",
    profiles: ["standard", "field"],
    recommended: true,
    detail: "\u672C\u793E\u30FB\u73FE\u5834\u9593\u306E\u9060\u9694\u7ACB\u4F1A\u3044\u30FB\u5DE5\u7A0B\u4F1A\u8B70\u3002Web\u30AB\u30E1\u30E9\u30FB\u753B\u9762\u5171\u6709\u5BFE\u5FDC\u3002"
  },
  {
    id: "teams",
    name: "Microsoft Teams (Flatpak)",
    category: "communication",
    icon: "\u{1F4AC}",
    desc: "\u30C1\u30FC\u30E0\u30B3\u30E9\u30DC\u30EC\u30FC\u30B7\u30E7\u30F3 / \u30C1\u30E3\u30C3\u30C8",
    pkg: "com.microsoft.Teams",
    method: "flatpak",
    size: 200,
    unit: "MB",
    profiles: ["standard"],
    recommended: false,
    detail: "SharePoint\u30FBOneDrive\u9023\u643A\u3002Office365\u74B0\u5883\u306E\u4F01\u696D\u5411\u3051\u3002Flatpak\u7248\u3067Linux\u516C\u5F0F\u30B5\u30DD\u30FC\u30C8\u3002"
  },
  {
    id: "slack",
    name: "Slack Desktop",
    category: "communication",
    icon: "\u{1F4BC}",
    desc: "\u30C1\u30E3\u30C3\u30C8 / \u30D5\u30A1\u30A4\u30EB\u5171\u6709 / \u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u81EA\u52D5\u5316",
    pkg: "slack",
    method: "deb",
    size: 180,
    unit: "MB",
    profiles: ["standard"],
    recommended: false,
    detail: "\u30C1\u30E3\u30F3\u30CD\u30EB\u5225\u60C5\u5831\u5171\u6709\u3002\u5EFA\u8A2D\u73FE\u5834\u306E\u5DE5\u7A2E\u5225\u30FB\u73FE\u5834\u5225\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u7BA1\u7406\u3002"
  }
];
const APP_CATEGORIES = [
  { id: "all", label: "\u3059\u3079\u3066", icon: "\u{1F5C2}\uFE0F" },
  { id: "business", label: "\u696D\u52D9\u30A2\u30D7\u30EA", icon: "\u{1F4DD}" },
  { id: "construction", label: "\u5EFA\u8A2D\u5C02\u7528", icon: "\u{1F3D7}\uFE0F" },
  { id: "utility", label: "\u30E6\u30FC\u30C6\u30A3\u30EA\u30C6\u30A3", icon: "\u{1F527}" },
  { id: "security", label: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3", icon: "\u{1F512}" },
  { id: "communication", label: "\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3", icon: "\u{1F4AC}" }
];
const METHOD_BADGE = {
  apt: { label: "APT", color: "#2563eb", bg: "#eff6ff" },
  deb: { label: ".deb", color: "#7c3aed", bg: "#f5f3ff" },
  flatpak: { label: "Flatpak", color: "#0891b2", bg: "#ecfeff" },
  wine: { label: "Wine", color: "#b45309", bg: "#fffbeb" }
};
Object.assign(window, { APPS_CATALOG, APP_CATEGORIES, METHOD_BADGE });
function AppsPage() {
  const [catFilter, setCatFilter] = React.useState("all");
  const [selected, setSelected] = React.useState(/* @__PURE__ */ new Set());
  const [profileFilter, setProfileFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [showIsoModal, setShowIsoModal] = React.useState(false);
  const filtered = APPS_CATALOG.filter((a) => {
    if (catFilter !== "all" && a.category !== catFilter) return false;
    if (profileFilter !== "all" && !a.profiles.includes(profileFilter)) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const toggleApp = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map((a) => a.id)));
  const selectRecommended = () => setSelected(new Set(APPS_CATALOG.filter((a) => a.recommended).map((a) => a.id)));
  const clearAll = () => setSelected(/* @__PURE__ */ new Set());
  const selectedApps = APPS_CATALOG.filter((a) => selected.has(a.id));
  const totalSizeMB = selectedApps.reduce((s, a) => s + a.size, 0);
  const totalSizeStr = totalSizeMB >= 1e3 ? `${(totalSizeMB / 1024).toFixed(1)} GB` : `${totalSizeMB} MB`;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 } }, "\u{1F4E6} \u914D\u5E03\u30A2\u30D7\u30EA\u7BA1\u7406"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#64748b" } }, "ISO \u30D3\u30EB\u30C9\u306B\u542B\u3081\u308B\u30A2\u30D7\u30EA\u3092\u9078\u629E\u3057\u307E\u3059\u3002\u9078\u629E\u5185\u5BB9\u306F\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225\u306B\u4FDD\u5B58\u3067\u304D\u3001ISO \u914D\u5E03\u6642\u306B\u81EA\u52D5\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3055\u308C\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 } }, [
    { label: "\u5229\u7528\u53EF\u80FD\u30A2\u30D7\u30EA", value: APPS_CATALOG.length, icon: "\u{1F4E6}", color: "#3b82f6" },
    { label: "\u9078\u629E\u4E2D", value: selected.size, icon: "\u2705", color: "#22c55e" },
    { label: "\u63A8\u5B9A\u8FFD\u52A0\u30B5\u30A4\u30BA", value: totalSizeStr, icon: "\u{1F4BE}", color: "#f59e0b" },
    { label: "\u5BFE\u8C61\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", value: profileFilter === "all" ? "\u5168\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB" : profileFilter, icon: "\u{1F3F7}\uFE0F", color: "#8b5cf6" }
  ].map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, style: __spreadProps(__spreadValues({}, cardStyle), { display: "flex", alignItems: "center", gap: 12 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22 } }, c.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8", marginBottom: 2 } }, c.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: c.color } }, c.value))))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }) }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "\u30A2\u30D7\u30EA\u3092\u691C\u7D22...",
      value: search,
      onChange: (e) => setSearch(e.target.value),
      style: {
        padding: "7px 12px",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        fontSize: 12,
        outline: "none",
        flex: "1 1 180px",
        minWidth: 140
      }
    }
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: profileFilter,
      onChange: (e) => setProfileFilter(e.target.value),
      style: { padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "all" }, "\u5168\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB"),
    /* @__PURE__ */ React.createElement("option", { value: "standard" }, "standard"),
    /* @__PURE__ */ React.createElement("option", { value: "field" }, "field"),
    /* @__PURE__ */ React.createElement("option", { value: "kiosk" }, "kiosk")
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginLeft: "auto" } }, /* @__PURE__ */ React.createElement("button", { onClick: selectRecommended, style: actionBtnStyle("#2563eb") }, "\u63A8\u5968\u3092\u9078\u629E"), /* @__PURE__ */ React.createElement("button", { onClick: selectAll, style: actionBtnStyle("#64748b") }, "\u3059\u3079\u3066\u9078\u629E"), /* @__PURE__ */ React.createElement("button", { onClick: clearAll, style: actionBtnStyle("#94a3b8") }, "\u30AF\u30EA\u30A2"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => selected.size > 0 && setShowIsoModal(true),
      disabled: selected.size === 0,
      style: actionBtnStyle(selected.size > 0 ? "#22c55e" : "#cbd5e1", selected.size === 0)
    },
    "\u{1F680} ISO \u30D3\u30EB\u30C9\u3078\u8FFD\u52A0"
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" } }, APP_CATEGORIES.map((cat) => {
    const count = cat.id === "all" ? APPS_CATALOG.length : APPS_CATALOG.filter((a) => a.category === cat.id).length;
    return /* @__PURE__ */ React.createElement("button", { key: cat.id, onClick: () => setCatFilter(cat.id), style: {
      padding: "6px 14px",
      borderRadius: 20,
      border: "1px solid",
      fontSize: 12,
      cursor: "pointer",
      fontWeight: catFilter === cat.id ? 600 : 400,
      borderColor: catFilter === cat.id ? "#2563eb" : "#e2e8f0",
      background: catFilter === cat.id ? "#eff6ff" : "#fff",
      color: catFilter === cat.id ? "#2563eb" : "#475569",
      display: "flex",
      alignItems: "center",
      gap: 5
    } }, /* @__PURE__ */ React.createElement("span", null, cat.icon), /* @__PURE__ */ React.createElement("span", null, cat.label), /* @__PURE__ */ React.createElement("span", { style: {
      background: catFilter === cat.id ? "#2563eb" : "#e2e8f0",
      color: catFilter === cat.id ? "#fff" : "#64748b",
      borderRadius: 10,
      padding: "1px 6px",
      fontSize: 10,
      fontWeight: 600
    } }, count));
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 12 } }, filtered.map((app) => /* @__PURE__ */ React.createElement(AppCard, { key: app.id, app, selected: selected.has(app.id), onToggle: toggleApp }))), filtered.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 } }, "\u8A72\u5F53\u3059\u308B\u30A2\u30D7\u30EA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093"), selected.size > 0 && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), {
    marginTop: 20,
    borderLeft: "4px solid #22c55e",
    background: "#f0fdf4"
  }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#16a34a" } }, "\u2705 \u9078\u629E\u4E2D\u306E\u30A2\u30D7\u30EA (", selected.size, "\u4EF6 / \u63A8\u5B9A ", totalSizeStr, ")"), /* @__PURE__ */ React.createElement("button", { onClick: clearAll, style: { fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" } }, "\u30AF\u30EA\u30A2")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, selectedApps.map((app) => /* @__PURE__ */ React.createElement("span", { key: app.id, style: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 16,
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: 11,
    fontWeight: 500
  } }, app.icon, " ", app.name, /* @__PURE__ */ React.createElement("button", { onClick: () => toggleApp(app.id), style: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#16a34a",
    fontSize: 12,
    padding: 0,
    lineHeight: 1
  } }, "\xD7")))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowIsoModal(true), style: actionBtnStyle("#22c55e") }, "\u{1F680} ISO \u30D3\u30EB\u30C9\u3078\u8FFD\u52A0\u3057\u3066\u30D3\u30EB\u30C9\u958B\u59CB"), /* @__PURE__ */ React.createElement("button", { style: actionBtnStyle("#3b82f6") }, "\u{1F4BE} \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u306B\u4FDD\u5B58"))), /* @__PURE__ */ React.createElement(ProfileAssignSection, { selected, onToggle: toggleApp }), showIsoModal && /* @__PURE__ */ React.createElement(IsoBuildModal, { selectedApps, totalSize: totalSizeStr, onClose: () => setShowIsoModal(false) }));
}
function AppCard({ app, selected, onToggle }) {
  const mb = METHOD_BADGE[app.method] || METHOD_BADGE.apt;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => onToggle(app.id),
      style: __spreadProps(__spreadValues({}, cardStyle), {
        cursor: "pointer",
        borderColor: selected ? "#22c55e" : "#e8ecf1",
        borderWidth: selected ? 2 : 1,
        background: selected ? "#f0fdf4" : "#fff",
        transition: "all 120ms",
        position: "relative"
      })
    },
    app.recommended && /* @__PURE__ */ React.createElement("span", { style: {
      position: "absolute",
      top: 10,
      right: 10,
      fontSize: 10,
      background: "#fef3c7",
      color: "#d97706",
      borderRadius: 10,
      padding: "2px 7px",
      fontWeight: 600
    } }, "\u2605 \u63A8\u5968"),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 42,
      height: 42,
      borderRadius: 10,
      flexShrink: 0,
      background: selected ? "#dcfce7" : "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20
    } }, app.icon), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, app.name), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 9,
      fontWeight: 700,
      padding: "1px 5px",
      borderRadius: 4,
      background: mb.bg,
      color: mb.color
    } }, mb.label)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 6, lineHeight: 1.4 } }, app.desc), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", lineHeight: 1.4 } }, app.detail))),
    /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, app.profiles.map((p) => /* @__PURE__ */ React.createElement("span", { key: p, style: {
      fontSize: 10,
      padding: "2px 6px",
      borderRadius: 4,
      background: "#f1f5f9",
      color: "#475569"
    } }, p))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#94a3b8" } }, "~", app.size, app.unit), /* @__PURE__ */ React.createElement("div", { style: {
      width: 18,
      height: 18,
      borderRadius: 4,
      border: "2px solid",
      borderColor: selected ? "#22c55e" : "#cbd5e1",
      background: selected ? "#22c55e" : "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      color: "#fff"
    } }, selected ? "\u2713" : "")))
  );
}
function ProfileAssignSection({ selected, onToggle }) {
  const profiles = ["standard", "field", "kiosk"];
  const profileNames = { standard: "Standard (\u4E8B\u52D9\u30FB\u672C\u793E)", field: "Field (\u73FE\u5834\u30FB\u5DE1\u56DE)", kiosk: "Kiosk (\u53D7\u4ED8\u30FB\u5171\u7528)" };
  const profileIcons = { standard: "\u{1F4BC}", field: "\u{1F9BA}", kiosk: "\u{1F4FA}" };
  return /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 20 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 } }, "\u{1F3F7}\uFE0F \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225\u63A8\u5968\u30A2\u30D7\u30EA"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 14 } }, "\u5404\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB (\u7AEF\u672B\u7A2E\u5225) \u306B\u5BFE\u3057\u3066\u63A8\u5968\u3055\u308C\u308B\u30A2\u30D7\u30EA\u4E00\u89A7\u3067\u3059\u3002\u300C\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u9078\u629E\u300D\u3067\u307E\u3068\u3081\u3066\u9078\u629E\u3067\u304D\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 } }, profiles.map((prof) => {
    const apps = APPS_CATALOG.filter((a) => a.profiles.includes(prof) && a.recommended);
    const selectedCount = apps.filter((a) => selected.has(a.id)).length;
    return /* @__PURE__ */ React.createElement("div", { key: prof, style: {
      background: "#f8fafc",
      borderRadius: 10,
      padding: "12px 14px",
      border: "1px solid #e8ecf1"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, profileIcons[prof]), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a" } }, prof), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8" } }, profileNames[prof]))), /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 10,
      padding: "2px 7px",
      borderRadius: 10,
      background: selectedCount === apps.length && apps.length > 0 ? "#dcfce7" : "#f1f5f9",
      color: selectedCount === apps.length && apps.length > 0 ? "#16a34a" : "#64748b",
      fontWeight: 600
    } }, selectedCount, "/", apps.length)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 } }, apps.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.id, style: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" } }, /* @__PURE__ */ React.createElement("span", { style: { color: selected.has(a.id) ? "#22c55e" : "#cbd5e1" } }, selected.has(a.id) ? "\u2713" : "\u25CB"), /* @__PURE__ */ React.createElement("span", null, a.icon), /* @__PURE__ */ React.createElement("span", null, a.name)))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => apps.forEach((a) => !selected.has(a.id) && onToggle(a.id)),
        style: {
          width: "100%",
          padding: "5px 0",
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: "#fff",
          fontSize: 11,
          cursor: "pointer",
          color: "#2563eb",
          fontWeight: 500
        }
      },
      selectedCount === apps.length ? "\u2705 \u9078\u629E\u6E08\u307F" : "\u63A8\u5968\u30A2\u30D7\u30EA\u3092\u4E00\u62EC\u9078\u629E"
    ));
  })));
}
function IsoBuildModal({ selectedApps, totalSize, onClose }) {
  const [profile, setProfile] = React.useState("standard");
  const [gitRef, setGitRef] = React.useState("main");
  const [notes, setNotes] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(onClose, 2500);
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e3
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#fff",
    borderRadius: 14,
    padding: 28,
    width: 540,
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,.2)"
  } }, submitted ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "30px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 42, marginBottom: 12 } }, "\u{1F680}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "#16a34a", marginBottom: 6 } }, "ISO \u30D3\u30EB\u30C9\u3092\u30AD\u30E5\u30FC\u306B\u8FFD\u52A0\u3057\u307E\u3057\u305F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#64748b" } }, "\u300CISO \u914D\u5E03\u300D\u30DA\u30FC\u30B8\u3067\u30D3\u30EB\u30C9\u9032\u6357\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 } }, "\u{1F680} \u30A2\u30D7\u30EA\u3092\u542B\u3081\u3066 ISO \u30D3\u30EB\u30C9"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#64748b", marginBottom: 20 } }, "\u9078\u629E\u3057\u305F\u30A2\u30D7\u30EA\u3092 ISO \u306B\u540C\u68B1\u3057\u3066\u30D3\u30EB\u30C9\u3057\u307E\u3059\u3002\u30D3\u30EB\u30C9\u5B8C\u4E86\u5F8C\u306B\u7AEF\u672B\u3078\u914D\u5E03\u3055\u308C\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { style: { background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#16a34a", marginBottom: 6 } }, "\u542B\u3081\u308B\u30A2\u30D7\u30EA (", selectedApps.length, "\u4EF6 / \u5408\u8A08 ", totalSize, ")"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, selectedApps.map((a) => /* @__PURE__ */ React.createElement("span", { key: a.id, style: {
    fontSize: 11,
    padding: "3px 9px",
    borderRadius: 12,
    background: "#dcfce7",
    color: "#16a34a"
  } }, a.icon, " ", a.name)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB"), /* @__PURE__ */ React.createElement("select", { value: profile, onChange: (e) => setProfile(e.target.value), style: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    background: "#fff"
  } }, /* @__PURE__ */ React.createElement("option", { value: "standard" }, "standard \u2014 \u4E8B\u52D9\u30FB\u672C\u793E"), /* @__PURE__ */ React.createElement("option", { value: "field" }, "field \u2014 \u73FE\u5834\u30FB\u5DE1\u56DE"), /* @__PURE__ */ React.createElement("option", { value: "kiosk" }, "kiosk \u2014 \u53D7\u4ED8\u30FB\u5171\u7528\u7AEF\u672B"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "Git Ref (\u30D6\u30E9\u30F3\u30C1 / \u30BF\u30B0)"), /* @__PURE__ */ React.createElement("input", { value: gitRef, onChange: (e) => setGitRef(e.target.value), style: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    outline: "none"
  } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u5099\u8003 (\u4EFB\u610F)"), /* @__PURE__ */ React.createElement("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, style: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    outline: "none",
    resize: "vertical"
  }, placeholder: "\u4F8B: LibreOffice + QGIS \u540C\u68B1 \u73FE\u5834\u7528\u30AB\u30B9\u30BF\u30E0ISO" }))), /* @__PURE__ */ React.createElement("div", { style: {
    background: "#fffbeb",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 11,
    color: "#92400e",
    marginBottom: 16
  } }, "\u{1F4BE} \u30D9\u30FC\u30B9 ISO (~1.8 GB) + \u30A2\u30D7\u30EA (", totalSize, ") = \u63A8\u5B9A ISO \u30B5\u30A4\u30BA\u5897\u52A0\u3042\u308A\u3002 \u30D3\u30EB\u30C9\u6642\u9593: \u901A\u5E38 40\u301C70 \u5206\u3002"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#475569"
  } }, "\u30AD\u30E3\u30F3\u30BB\u30EB"), /* @__PURE__ */ React.createElement("button", { onClick: handleSubmit, style: {
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    background: "#22c55e",
    fontSize: 12,
    cursor: "pointer",
    color: "#fff",
    fontWeight: 600
  } }, "\u{1F680} \u30D3\u30EB\u30C9\u958B\u59CB")))));
}
function actionBtnStyle(color, disabled = false) {
  return {
    padding: "7px 14px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#e2e8f0" : color,
    color: disabled ? "#94a3b8" : "#fff",
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500
  };
}

/* === proto-page-rings.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const UPDATE_PACKAGES = [
  { name: "cdx-agent", current: "0.2.0", prev: "0.1.9", type: "agent", size: "2.4 MB" },
  { name: "cdx-security-policy", current: "v2.1", prev: "v2.0", type: "policy", size: "48 KB" },
  { name: "linux-image-6.1.0-21", current: "6.1.0-21", prev: "6.1.0-20", type: "kernel", size: "68 MB" },
  { name: "construction-hub", current: "1.1.0", prev: "1.0.0", type: "app", size: "1.2 MB" }
];
const DEPLOY_HISTORY = [
  { id: "dep-006", pkg: "cdx-agent 0.2.0", ring: "Ring 1", startedAt: "2026-05-05 12:00", finishedAt: "2026-05-05 12:25", targets: 3, success: 3, failed: 0, status: "\u5B8C\u4E86" },
  { id: "dep-005", pkg: "cdx-agent 0.2.0", ring: "Ring 2", startedAt: "2026-05-06 08:00", finishedAt: null, targets: 4, success: 2, failed: 0, status: "\u5C55\u958B\u4E2D" },
  { id: "dep-004", pkg: "cdx-security-policy v2.1", ring: "Ring 1", startedAt: "2026-05-04 14:00", finishedAt: "2026-05-04 14:05", targets: 3, success: 3, failed: 0, status: "\u5B8C\u4E86" },
  { id: "dep-003", pkg: "cdx-security-policy v2.1", ring: "Ring 2", startedAt: "2026-05-05 14:00", finishedAt: "2026-05-05 14:08", targets: 4, success: 4, failed: 0, status: "\u5B8C\u4E86" },
  { id: "dep-002", pkg: "cdx-agent 0.1.9", ring: "Ring 3", startedAt: "2026-05-03 10:00", finishedAt: "2026-05-03 10:30", targets: 3, success: 2, failed: 1, status: "\u90E8\u5206\u5931\u6557" },
  { id: "dep-001", pkg: "construction-hub 1.0.0", ring: "\u5168\u30EA\u30F3\u30B0", startedAt: "2026-04-28 09:00", finishedAt: "2026-04-28 10:15", targets: 10, success: 10, failed: 0, status: "\u5B8C\u4E86" }
];
const AUTO_PROMOTE_RULES = {
  errorRateMax: 0,
  hbSuccessMin: 100,
  stableHours: 24,
  approvalRequired: { "Ring 0": false, "Ring 1": false, "Ring 2": true, "Ring 3": true }
};
const RingsPage = () => {
  var _a, _b;
  const [selectedRing, setSelectedRing] = React.useState(null);
  const [showDeploy, setShowDeploy] = React.useState(false);
  const [deployPkg, setDeployPkg] = React.useState("");
  const [deployRing, setDeployRing] = React.useState("");
  const [showAutoRules, setShowAutoRules] = React.useState(false);
  const [rules, setRules] = React.useState(AUTO_PROMOTE_RULES);
  const [moveDevice, setMoveDevice] = React.useState(null);
  const [moveTarget, setMoveTarget] = React.useState("");
  const [actionLog, setActionLog] = React.useState([]);
  const [showRollback, setShowRollback] = React.useState(null);
  const [approvalQueue, setApprovalQueue] = React.useState([
    { id: "apr-001", pkg: "cdx-agent 0.2.0", fromRing: "Ring 2", toRing: "Ring 3", requestedAt: "2026-05-06 09:00", status: "\u627F\u8A8D\u5F85\u3061" }
  ]);
  const ringHealth = RINGS_DATA.map((r) => {
    const devs = r.devices.map((did) => DEVICES_DATA.find((x) => x.id === did)).filter(Boolean);
    const online = devs.filter((d) => d.status === "online").length;
    const total = devs.length;
    const avgCpu = total > 0 ? Math.round(devs.reduce((s, d) => s + (d.status !== "offline" ? d.cpu : 0), 0) / Math.max(1, online)) : 0;
    const avgMem = total > 0 ? Math.round(devs.reduce((s, d) => s + (d.status !== "offline" ? d.mem : 0), 0) / Math.max(1, online)) : 0;
    const oldAgent = devs.filter((d) => d.agent !== "0.2.0").length;
    const hbRate = total > 0 ? Math.round(online / total * 100) : 0;
    return __spreadProps(__spreadValues({}, r), { devs, online, total, avgCpu, avgMem, oldAgent, hbRate, errorRate: total > 0 ? Math.round(devs.filter((d) => d.status === "warning" || d.status === "offline").length / total * 100) : 0 });
  });
  const executeAction = (action, detail) => {
    const now = (/* @__PURE__ */ new Date()).toLocaleTimeString("ja-JP");
    setActionLog((prev) => [{ at: now, action, detail, status: "\u5B9F\u884C\u4E2D" }, ...prev]);
    setTimeout(() => setActionLog((prev) => prev.map((l, i) => i === 0 ? __spreadProps(__spreadValues({}, l), { status: "\u5B8C\u4E86" }) : l)), 1500);
  };
  const approvePromotion = (aprId) => {
    var _a2, _b2;
    setApprovalQueue((prev) => prev.map((a) => a.id === aprId ? __spreadProps(__spreadValues({}, a), { status: "\u627F\u8A8D\u6E08\u307F" }) : a));
    executeAction("\u6607\u683C\u627F\u8A8D", `${(_a2 = approvalQueue.find((a) => a.id === aprId)) == null ? void 0 : _a2.pkg} \u2192 ${(_b2 = approvalQueue.find((a) => a.id === aprId)) == null ? void 0 : _b2.toRing}`);
  };
  const rejectPromotion = (aprId) => {
    setApprovalQueue((prev) => prev.map((a) => a.id === aprId ? __spreadProps(__spreadValues({}, a), { status: "\u5374\u4E0B" }) : a));
  };
  if (showDeploy) {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowDeploy(false), style: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 } }, "\u2190 \u30EA\u30F3\u30B0\u7BA1\u7406\u3078\u623B\u308B"), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { maxWidth: 640 }) }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" } }, "\u66F4\u65B0\u5C55\u958B"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 } }, "\u66F4\u65B0\u30D1\u30C3\u30B1\u30FC\u30B8"), /* @__PURE__ */ React.createElement("select", { value: deployPkg, onChange: (e) => setDeployPkg(e.target.value), style: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u30D1\u30C3\u30B1\u30FC\u30B8\u3092\u9078\u629E..."), UPDATE_PACKAGES.map((p) => /* @__PURE__ */ React.createElement("option", { key: p.name, value: p.name }, p.name, " ", p.prev, " \u2192 ", p.current, " (", p.size, ")")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 } }, "\u5C55\u958B\u5148\u30EA\u30F3\u30B0"), /* @__PURE__ */ React.createElement("select", { value: deployRing, onChange: (e) => setDeployRing(e.target.value), style: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u30EA\u30F3\u30B0\u3092\u9078\u629E..."), RINGS_DATA.map((r) => /* @__PURE__ */ React.createElement("option", { key: r.name, value: r.name }, r.name, " (", r.count, "\u53F0)")))), deployRing && rules.approvalRequired[deployRing.split(" ")[0] + " " + ((_a = deployRing.split(" ")[1]) == null ? void 0 : _a.replace("(", "").replace(")", ""))] && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a", fontSize: 12, color: "#92400e" } }, "\u26A0\uFE0F \u3053\u306E\u30EA\u30F3\u30B0\u3078\u306E\u5C55\u958B\u306B\u306F\u7BA1\u7406\u8005\u627F\u8A8D\u304C\u5FC5\u8981\u3067\u3059"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 } }, "\u30E1\u30E2"), /* @__PURE__ */ React.createElement("textarea", { rows: 2, placeholder: "\u5C55\u958B\u7406\u7531...", style: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      executeAction("\u66F4\u65B0\u5C55\u958B\u958B\u59CB", `${deployPkg} \u2192 ${deployRing}`);
      setShowDeploy(false);
    }, disabled: !deployPkg || !deployRing, style: { padding: "8px 20px", borderRadius: 8, background: deployPkg && deployRing ? "#2563eb" : "#e2e8f0", color: deployPkg && deployRing ? "#fff" : "#94a3b8", border: "none", fontSize: 13, fontWeight: 600, cursor: deployPkg && deployRing ? "pointer" : "not-allowed" } }, "\u5C55\u958B\u958B\u59CB"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowDeploy(false), style: { padding: "8px 20px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" } }, "\u30AD\u30E3\u30F3\u30BB\u30EB")))));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, "\u66F4\u65B0\u30EA\u30F3\u30B0\u7BA1\u7406"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#94a3b8", margin: "2px 0 0" } }, "\u6BB5\u968E\u914D\u4FE1\u306B\u3088\u308BOS\u30FBAgent\u66F4\u65B0\u306E\u5B89\u5168\u306A\u5C55\u958B (Ring 0\u21921\u21922\u21923)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAutoRules(!showAutoRules), style: { padding: "6px 14px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 12, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u2699 \u81EA\u52D5\u6607\u683C\u30EB\u30FC\u30EB"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowDeploy(true), style: { padding: "6px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "+ \u66F4\u65B0\u5C55\u958B"))), showAutoRules && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u81EA\u52D5\u6607\u683C\u30EB\u30FC\u30EB\u30FB\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u30C8\u30EA\u30AC\u30FC"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 } }, "\u81EA\u52D5\u6607\u683C\u6761\u4EF6 (\u5168\u3066\u6E80\u305F\u3059\u3068\u6B21\u30EA\u30F3\u30B0\u3078\u5C55\u958B)"), [
    { label: "\u30A8\u30E9\u30FC\u7387\u4E0A\u9650", key: "errorRateMax", unit: "%", min: 0, max: 10 },
    { label: "HB\u6210\u529F\u7387\u4E0B\u9650", key: "hbSuccessMin", unit: "%", min: 90, max: 100 },
    { label: "\u5B89\u5B9A\u6642\u9593", key: "stableHours", unit: "\u6642\u9593", min: 1, max: 72 }
  ].map((r) => /* @__PURE__ */ React.createElement("div", { key: r.key, style: { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b", width: 120 } }, r.label), /* @__PURE__ */ React.createElement("input", { type: "range", min: r.min, max: r.max, value: rules[r.key], onChange: (e) => setRules((prev) => __spreadProps(__spreadValues({}, prev), { [r.key]: Number(e.target.value) })), style: { width: 120 } }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "#2563eb", width: 50 } }, rules[r.key], r.unit)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 } }, "\u5C55\u958B\u627F\u8A8D\u30B2\u30FC\u30C8"), RINGS_DATA.map((r, i) => {
    const key = r.name.split(" (")[0];
    return /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#475569" } }, r.name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: rules.approvalRequired[key] ? "#f59e0b" : "#22c55e" } }, rules.approvalRequired[key] ? "\u627F\u8A8D\u5FC5\u9808" : "\u81EA\u52D5\u5C55\u958B"), /* @__PURE__ */ React.createElement("button", { onClick: () => setRules((prev) => __spreadProps(__spreadValues({}, prev), { approvalRequired: __spreadProps(__spreadValues({}, prev.approvalRequired), { [key]: !prev.approvalRequired[key] }) })), style: { padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: rules.approvalRequired[key] ? "#fffbeb" : "#f0fdf4", color: rules.approvalRequired[key] ? "#f59e0b" : "#22c55e" } }, rules.approvalRequired[key] ? "\u{1F512}" : "\u{1F513}")));
  }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 11, color: "#dc2626" } }, /* @__PURE__ */ React.createElement("b", null, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u81EA\u52D5\u30C8\u30EA\u30AC\u30FC:"), " \u30A8\u30E9\u30FC\u7387 ", ">", " ", rules.errorRateMax, "% \u307E\u305F\u306F HB\u6210\u529F\u7387 ", "<", " ", rules.hbSuccessMin, "% \u691C\u77E5\u6642\u306B\u524D\u7248\u3078\u81EA\u52D5\u5207\u308A\u623B\u3057"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowAutoRules(false), style: { marginTop: 10, padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "\u4FDD\u5B58")), approvalQueue.filter((a) => a.status === "\u627F\u8A8D\u5F85\u3061").length > 0 && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16, background: "#fffbeb", border: "1px solid #fde68a" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 8 } }, "\u627F\u8A8D\u5F85\u3061\u306E\u5C55\u958B (", approvalQueue.filter((a) => a.status === "\u627F\u8A8D\u5F85\u3061").length, "\u4EF6)"), approvalQueue.filter((a) => a.status === "\u627F\u8A8D\u5F85\u3061").map((a) => /* @__PURE__ */ React.createElement("div", { key: a.id, style: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #fef3c7" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 500, color: "#0f172a" } }, a.pkg), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#92400e" } }, a.fromRing, " \u2192 ", a.toRing, " \xB7 ", a.requestedAt)), /* @__PURE__ */ React.createElement("button", { onClick: () => approvePromotion(a.id), style: { padding: "5px 14px", borderRadius: 6, background: "#22c55e", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "\u2713 \u627F\u8A8D"), /* @__PURE__ */ React.createElement("button", { onClick: () => rejectPromotion(a.id), style: { padding: "5px 14px", borderRadius: 6, background: "#fff", color: "#dc2626", border: "1px solid #fecaca", fontSize: 11, cursor: "pointer" } }, "\u2717 \u5374\u4E0B")))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 } }, ringHealth.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, onClick: () => setSelectedRing(selectedRing === i ? null : i), style: __spreadProps(__spreadValues({}, cardStyle), { cursor: "pointer", borderTop: `3px solid ${r.color}`, background: selectedRing === i ? "#fafbfd" : "#fff" }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, r.name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20, fontWeight: 700, color: r.color } }, r.count)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 8 } }, r.desc), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", color: "#94a3b8" } }, /* @__PURE__ */ React.createElement("span", null, "HB\u6210\u529F\u7387"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: r.hbRate >= rules.hbSuccessMin ? "#22c55e" : "#ef4444" } }, r.hbRate, "%")), /* @__PURE__ */ React.createElement("div", { style: { height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: r.hbRate + "%", background: r.hbRate >= rules.hbSuccessMin ? "#22c55e" : "#ef4444", borderRadius: 2 } }))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", color: "#94a3b8" } }, /* @__PURE__ */ React.createElement("span", null, "\u30A8\u30E9\u30FC\u7387"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: r.errorRate <= rules.errorRateMax ? "#22c55e" : "#ef4444" } }, r.errorRate, "%")), /* @__PURE__ */ React.createElement("div", { style: { height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: r.errorRate + "%", background: r.errorRate <= rules.errorRateMax ? "#22c55e" : "#ef4444", borderRadius: 2 } })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, fontSize: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#64748b" } }, "CPU ", r.avgCpu, "%"), /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#64748b" } }, "MEM ", r.avgMem, "%"), r.oldAgent > 0 && /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, background: "#fffbeb", color: "#f59e0b" } }, "\u65E7\u7248 ", r.oldAgent)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, marginTop: 8 } }, i < 3 && r.count > 0 && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    var _a2;
    e.stopPropagation();
    executeAction("\u6607\u683C", `${r.name} \u2192 ${(_a2 = RINGS_DATA[i + 1]) == null ? void 0 : _a2.name}`);
  }, style: { flex: 1, padding: "4px", borderRadius: 5, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb", fontWeight: 500 } }, "\u2197 \u6607\u683C"), r.count > 0 && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
    e.stopPropagation();
    setShowRollback(i);
  }, style: { flex: 1, padding: "4px", borderRadius: 5, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626", fontWeight: 500 } }, "\u21A9 \u30ED\u30FC\u30EB\u30D0\u30C3\u30AF"))))), showRollback !== null && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16, background: "#fef2f2", border: "1px solid #fecaca" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 10 } }, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF \u2014 ", (_b = RINGS_DATA[showRollback]) == null ? void 0 : _b.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#475569", marginBottom: 10 } }, "\u5BFE\u8C61\u30EA\u30F3\u30B0\u306E\u5168\u7AEF\u672B\u3092\u524D\u7248\u306B\u5207\u308A\u623B\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 } }, UPDATE_PACKAGES.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.name, style: { display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#fff", borderRadius: 6, fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "#0f172a", flex: 1 } }, p.name), /* @__PURE__ */ React.createElement("span", { style: { color: "#dc2626" } }, p.current), /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8" } }, "\u2192"), /* @__PURE__ */ React.createElement("span", { style: { color: "#22c55e", fontWeight: 600 } }, p.prev)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    var _a2;
    executeAction("\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5B9F\u884C", (_a2 = RINGS_DATA[showRollback]) == null ? void 0 : _a2.name);
    setShowRollback(null);
  }, style: { padding: "6px 16px", borderRadius: 6, background: "#dc2626", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5B9F\u884C"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowRollback(null), style: { padding: "6px 16px", borderRadius: 6, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" } }, "\u30AD\u30E3\u30F3\u30BB\u30EB"))), selectedRing !== null && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 15, fontWeight: 600, color: "#0f172a", margin: 0 } }, RINGS_DATA[selectedRing].name, " \u2014 \u6240\u5C5E\u7AEF\u672B")), RINGS_DATA[selectedRing].devices.length > 0 ? /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u7AEF\u672BID", "\u62E0\u70B9", "\u30DB\u30B9\u30C8\u540D", "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", "Agent", "\u72B6\u614B", "\u30EA\u30F3\u30B0\u79FB\u52D5"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, RINGS_DATA[selectedRing].devices.map((did) => {
    const d = DEVICES_DATA.find((x) => x.id === did);
    if (!d) return null;
    return /* @__PURE__ */ React.createElement("tr", { key: d.id, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500 }) }, d.id), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, d.location), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, d.hostname), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" } }, d.profile)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: d.agent === "0.2.0" ? "#475569" : "#f59e0b", fontWeight: d.agent !== "0.2.0" ? 600 : 400 }) }, "v", d.agent), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: sBg(d.status), color: sColor(d.status) } }, /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: sColor(d.status) } }), sLabel(d.status))), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("select", { defaultValue: "", onChange: (e) => {
      if (e.target.value) {
        executeAction("\u30EA\u30F3\u30B0\u79FB\u52D5", `${d.id}: ${RINGS_DATA[selectedRing].name} \u2192 ${e.target.value}`);
        e.target.value = "";
      }
    }, style: { padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 10, color: "#475569" } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u79FB\u52D5\u5148..."), RINGS_DATA.filter((_, ri) => ri !== selectedRing).map((r) => /* @__PURE__ */ React.createElement("option", { key: r.name, value: r.name }, r.name.split(" (")[0]))))));
  }))) : /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#94a3b8" } }, "\u3053\u306E\u30EA\u30F3\u30B0\u306B\u7AEF\u672B\u306F\u5272\u308A\u5F53\u3066\u3089\u308C\u3066\u3044\u307E\u305B\u3093\u3002")), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u914D\u4FE1\u30D1\u30C3\u30B1\u30FC\u30B8"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u30D1\u30C3\u30B1\u30FC\u30B8\u540D", "\u7A2E\u5225", "\u524D\u7248", "\u73FE\u884C\u7248", "\u30B5\u30A4\u30BA", "Ring 0", "Ring 1", "Ring 2", "Ring 3"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, UPDATE_PACKAGES.map((p, i) => {
    const ringStatus = (ringIdx) => {
      if (p.name === "cdx-agent") {
        const devs = RINGS_DATA[ringIdx].devices.map((did) => DEVICES_DATA.find((x) => x.id === did)).filter(Boolean);
        const updated = devs.filter((d) => d.agent === p.current).length;
        return { updated, total: devs.length };
      }
      return { updated: RINGS_DATA[ringIdx].count, total: RINGS_DATA[ringIdx].count };
    };
    return /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontWeight: 500, color: "#0f172a" }) }, p.name), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" } }, p.type)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, p.prev), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 600 }) }, p.current), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, p.size), [0, 1, 2, 3].map((ri) => {
      const rs = ringStatus(ri);
      const pct = rs.total > 0 ? Math.round(rs.updated / rs.total * 100) : 0;
      return /* @__PURE__ */ React.createElement("td", { key: ri, style: tdStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 4, background: "#f1f5f9", borderRadius: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: pct + "%", background: pct === 100 ? "#22c55e" : pct > 0 ? "#3b82f6" : "#e2e8f0", borderRadius: 2 } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: pct === 100 ? "#22c55e" : "#64748b", fontWeight: 500 } }, rs.updated, "/", rs.total)));
    }));
  })))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u6BB5\u968E\u914D\u4FE1\u30D5\u30ED\u30FC"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, ringHealth.map((r, i) => /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, borderLeft: `3px solid ${r.color}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a" } }, r.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 2 } }, r.count, "\u53F0"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 4, fontSize: 9 } }, /* @__PURE__ */ React.createElement("span", { style: { color: r.hbRate >= rules.hbSuccessMin ? "#22c55e" : "#ef4444" } }, "HB ", r.hbRate, "%"), /* @__PURE__ */ React.createElement("span", { style: { color: r.errorRate <= rules.errorRateMax ? "#22c55e" : "#ef4444" } }, "Err ", r.errorRate, "%")), rules.approvalRequired[r.name.split(" (")[0]] && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#f59e0b", marginTop: 2 } }, "\u{1F512} \u627F\u8A8D\u5FC5\u9808")), i < RINGS_DATA.length - 1 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#cbd5e1" } }, "\u2192"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 8, color: "#94a3b8" } }, rules.stableHours, "h"))))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 11, color: "#64748b", padding: "8px 12px", background: "#eff6ff", borderRadius: 8 } }, "\u81EA\u52D5\u6607\u683C\u6761\u4EF6: \u30A8\u30E9\u30FC\u7387 \u2264 ", rules.errorRateMax, "% / HB\u6210\u529F\u7387 \u2265 ", rules.hbSuccessMin, "% / \u5B89\u5B9A\u6642\u9593 \u2265 ", rules.stableHours, "\u6642\u9593 \u2192 \u6761\u4EF6\u5145\u8DB3\u3067\u6B21\u30EA\u30F3\u30B0\u3078\u81EA\u52D5\u5C55\u958B")), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u5C55\u958B\u5C65\u6B74"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["ID", "\u30D1\u30C3\u30B1\u30FC\u30B8", "\u5BFE\u8C61\u30EA\u30F3\u30B0", "\u958B\u59CB", "\u5B8C\u4E86", "\u5BFE\u8C61", "\u6210\u529F", "\u5931\u6557", "\u30B9\u30C6\u30FC\u30BF\u30B9"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, DEPLOY_HISTORY.map((d, i) => /* @__PURE__ */ React.createElement("tr", { key: d.id, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500 }) }, d.id), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, d.pkg), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" } }, d.ring)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8", fontSize: 11 }) }, d.startedAt), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8", fontSize: 11 }) }, d.finishedAt || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, d.targets, "\u53F0"), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#22c55e", fontWeight: 600 }) }, d.success), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: d.failed > 0 ? "#ef4444" : "#94a3b8", fontWeight: d.failed > 0 ? 600 : 400 }) }, d.failed), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 6,
    background: d.status === "\u5B8C\u4E86" ? "#f0fdf4" : d.status === "\u5C55\u958B\u4E2D" ? "#eff6ff" : "#fef2f2",
    color: d.status === "\u5B8C\u4E86" ? "#22c55e" : d.status === "\u5C55\u958B\u4E2D" ? "#3b82f6" : "#ef4444"
  } }, d.status))))))), actionLog.length > 0 && /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, "\u64CD\u4F5C\u30ED\u30B0"), /* @__PURE__ */ React.createElement("button", { onClick: () => setActionLog([]), style: { fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" } }, "\u30AF\u30EA\u30A2")), actionLog.slice(0, 10).map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < actionLog.length - 1 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", fontSize: 11 } }, a.at), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "#475569" } }, a.action), /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b" } }, a.detail), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "\u5B8C\u4E86" ? "#f0fdf4" : "#eff6ff", color: a.status === "\u5B8C\u4E86" ? "#22c55e" : "#3b82f6" } }, a.status)))));
};
window.RingsPage = RingsPage;

/* === proto-page-pxe.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const PXE_PROFILES = [
  { id: "standard", label: "standard", desc: "\u4E8B\u52D9\u30FB\u672C\u793E\u7AEF\u672B", count: 5, color: "#3b82f6" },
  { id: "field", label: "field", desc: "\u73FE\u5834\u30FB\u5DE1\u56DE\u7AEF\u672B", count: 3, color: "#f59e0b" },
  { id: "kiosk", label: "kiosk", desc: "\u53D7\u4ED8\u30FB\u5171\u7528\u7AEF\u672B", count: 2, color: "#8b5cf6" }
];
const PXE_EVENTS = [
  { id: 1, at: "2026-05-14 09:12", device: "CDX-HQ-001", profile: "standard", event: "boot_request", status: "ok", detail: "PXE \u30D6\u30FC\u30C8\u30EA\u30AF\u30A8\u30B9\u30C8\u53D7\u4FE1 \u2014 ISO v1.0.0 \u914D\u4FE1\u958B\u59CB" },
  { id: 2, at: "2026-05-14 09:14", device: "CDX-HQ-001", profile: "standard", event: "install_done", status: "ok", detail: "OS \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86 \u2014 \u521D\u56DE heartbeat \u9001\u4FE1" },
  { id: 3, at: "2026-05-14 08:50", device: "CDX-FLD-102", profile: "field", event: "boot_request", status: "ok", detail: "PXE \u30D6\u30FC\u30C8\u30EA\u30AF\u30A8\u30B9\u30C8\u53D7\u4FE1 \u2014 ISO v1.0.0 (field) \u914D\u4FE1" },
  { id: 4, at: "2026-05-14 08:52", device: "CDX-FLD-102", profile: "field", event: "install_done", status: "ok", detail: "OS \u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u5B8C\u4E86" },
  { id: 5, at: "2026-05-13 17:30", device: "CDX-KSK-201", profile: "kiosk", event: "rollback", status: "warn", detail: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5B9F\u884C \u2014 v1.0.0-rc2 \u2192 v0.9.0 (AppArmor \u554F\u984C)" },
  { id: 6, at: "2026-05-13 17:35", device: "CDX-KSK-201", profile: "kiosk", event: "install_done", status: "ok", detail: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5B8C\u4E86 \u2014 v0.9.0 \u7A3C\u50CD\u4E2D" },
  { id: 7, at: "2026-05-13 12:00", device: "CDX-HQ-003", profile: "standard", event: "boot_request", status: "fail", detail: "PXE \u30D6\u30FC\u30C8\u5931\u6557 \u2014 DHCP \u30BF\u30A4\u30E0\u30A2\u30A6\u30C8 (NIC driver \u554F\u984C)" },
  { id: 8, at: "2026-05-12 10:00", device: "CDX-BR-010", profile: "standard", event: "boot_request", status: "ok", detail: "PXE \u30D6\u30FC\u30C8\u30EA\u30AF\u30A8\u30B9\u30C8\u53D7\u4FE1 \u2014 ISO v1.0.0 \u914D\u4FE1" }
];
const ROLLBACK_PATTERNS = [
  { id: "single", icon: "\u{1F5A5}\uFE0F", label: "\u5358\u4F53\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF", desc: "\u6307\u5B9A\u7AEF\u672B1\u53F0\u3092\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF" },
  { id: "profile", icon: "\u{1F3F7}\uFE0F", label: "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u4E00\u62EC", desc: "\u540C\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u306E\u5168\u7AEF\u672B\u3092\u4E00\u62EC\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF" },
  { id: "ring", icon: "\u{1F504}", label: "\u30EA\u30F3\u30B0\u5358\u4F4D", desc: "\u66F4\u65B0\u30EA\u30F3\u30B0\u5358\u4F4D\u3067\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF" },
  { id: "emergency", icon: "\u{1F6A8}", label: "\u7DCA\u6025\u5168\u7AEF\u672B", desc: "\u5168\u7AEF\u672B\u3092\u5373\u6642\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF (\u91CD\u5927\u969C\u5BB3\u6642)" }
];
Object.assign(window, { PXE_PROFILES, PXE_EVENTS, ROLLBACK_PATTERNS });
function PxePage() {
  const [activeTab, setActiveTab] = React.useState("status");
  const [rollbackTarget, setRollbackTarget] = React.useState("single");
  const [selectedDevice, setSelectedDevice] = React.useState("CDX-HQ-001");
  const [selectedProfile, setSelectedProfile] = React.useState("standard");
  const [targetVersion, setTargetVersion] = React.useState("v0.9.0");
  const [rollbackReason, setRollbackReason] = React.useState("");
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [rollbackDone, setRollbackDone] = React.useState(false);
  const tabs = [
    { id: "status", label: "\u5C55\u958B\u30B9\u30C6\u30FC\u30BF\u30B9", icon: "\u{1F4E1}" },
    { id: "rollback", label: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF", icon: "\u{1F519}" },
    { id: "log", label: "PXE \u30A4\u30D9\u30F3\u30C8\u30ED\u30B0", icon: "\u{1F4CB}" }
  ];
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 } }, "\u{1F5A5}\uFE0F PXE \u5C55\u958B\u7BA1\u7406"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#64748b" } }, "PXE \u30CD\u30C3\u30C8\u30D6\u30FC\u30C8\u306B\u3088\u308B OS \u5C55\u958B\u72B6\u6CC1\u306E\u78BA\u8A8D\u3001\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5B9F\u884C\u3001\u5C55\u958B\u30A4\u30D9\u30F3\u30C8\u30ED\u30B0\u3092\u7BA1\u7406\u3057\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 } }, [
    { label: "\u5C55\u958B\u6E08\u307F\u7AEF\u672B", value: "9\u53F0", icon: "\u2705", color: "#22c55e" },
    { label: "\u5C55\u958B\u4E2D", value: "0\u53F0", icon: "\u23F3", color: "#3b82f6" },
    { label: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u4E2D", value: "0\u53F0", icon: "\u{1F504}", color: "#f59e0b" },
    { label: "\u5931\u6557", value: "1\u53F0", icon: "\u274C", color: "#ef4444" }
  ].map((c) => /* @__PURE__ */ React.createElement("div", { key: c.label, style: __spreadProps(__spreadValues({}, cardStyle), { display: "flex", alignItems: "center", gap: 12 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22 } }, c.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8", marginBottom: 2 } }, c.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: c.color } }, c.value))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e8ecf1" } }, tabs.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, onClick: () => setActiveTab(t.id), style: {
    padding: "8px 18px",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: activeTab === t.id ? 600 : 400,
    color: activeTab === t.id ? "#2563eb" : "#64748b",
    borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
    marginBottom: -2,
    display: "flex",
    alignItems: "center",
    gap: 6
  } }, /* @__PURE__ */ React.createElement("span", null, t.icon), t.label))), activeTab === "status" && /* @__PURE__ */ React.createElement(PxeStatusTab, null), activeTab === "rollback" && /* @__PURE__ */ React.createElement(
    PxeRollbackTab,
    {
      rollbackTarget,
      setRollbackTarget,
      selectedDevice,
      setSelectedDevice,
      selectedProfile,
      setSelectedProfile,
      targetVersion,
      setTargetVersion,
      rollbackReason,
      setRollbackReason,
      showConfirm,
      setShowConfirm,
      rollbackDone,
      setRollbackDone
    }
  ), activeTab === "log" && /* @__PURE__ */ React.createElement(PxeLogTab, null));
}
function PxeStatusTab() {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u{1F4E1} \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225\u5C55\u958B\u72B6\u6CC1"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 } }, PXE_PROFILES.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, style: {
    background: "#f8fafc",
    borderRadius: 10,
    padding: "14px 16px",
    borderTop: `3px solid ${p.color}`
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, p.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8" } }, p.desc)), /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 10,
    background: p.color + "20",
    color: p.color
  } }, p.count, "\u53F0")), /* @__PURE__ */ React.createElement("div", { style: { background: "#e2e8f0", borderRadius: 4, height: 6, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("div", { style: {
    height: 6,
    borderRadius: 4,
    background: p.color,
    width: "100%",
    transition: "width 0.3s"
  } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#64748b" } }, "\u5C55\u958B\u5B8C\u4E86: ", p.count, "/", p.count, "\u53F0"))))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u7AEF\u672B\u5225\u5C55\u958B\u72B6\u6CC1"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u7AEF\u672BID", "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", "\u73FE\u5728\u306EOS", "\u5C55\u958B\u65B9\u6CD5", "\u6700\u7D42\u5C55\u958B", "\u30B9\u30C6\u30FC\u30BF\u30B9"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, DEVICES_DATA.map((d) => /* @__PURE__ */ React.createElement("tr", { key: d.id, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "monospace", fontSize: 11 } }, d.id)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9" } }, d.profile)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontSize: 11 }) }, d.os), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#6366f1" } }, "PXE")), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11, color: "#64748b" }) }, "2026-05-14"), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 10,
    fontWeight: 600,
    background: d.status === "online" ? "#f0fdf4" : d.status === "offline" ? "#f8fafc" : "#fffbeb",
    color: sColor(d.status)
  } }, sLabel(d.status)))))))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), {
    background: "#eff6ff",
    borderColor: "#bfdbfe",
    display: "flex",
    alignItems: "center",
    gap: 12
  }) }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 22 } }, "\u{1F517}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#1d4ed8", marginBottom: 2 } }, "\u8A73\u7D30\u306A PXE \u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u30B3\u30F3\u30BD\u30FC\u30EB"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b" } }, "\u3088\u308A\u8A73\u7D30\u306A\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u64CD\u4F5C\u306F\u7BA1\u7406 SSR \u30DA\u30FC\u30B8\u3067\u884C\u3048\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("a", { href: "/admin/pxe-rollback", target: "_blank", style: {
    marginLeft: "auto",
    padding: "7px 16px",
    borderRadius: 8,
    background: "#2563eb",
    color: "#fff",
    fontSize: 12,
    textDecoration: "none",
    fontWeight: 500,
    whiteSpace: "nowrap"
  } }, "PXE\u30B3\u30F3\u30BD\u30FC\u30EB\u3092\u958B\u304F \u2192")));
}
function PxeRollbackTab({
  rollbackTarget,
  setRollbackTarget,
  selectedDevice,
  setSelectedDevice,
  selectedProfile,
  setSelectedProfile,
  targetVersion,
  setTargetVersion,
  rollbackReason,
  setRollbackReason,
  showConfirm,
  setShowConfirm,
  rollbackDone,
  setRollbackDone
}) {
  const handleSubmit = () => {
    setShowConfirm(false);
    setRollbackDone(true);
  };
  if (rollbackDone) {
    return /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { textAlign: "center", padding: "40px 20px" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 42, marginBottom: 12 } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: "#16a34a", marginBottom: 6 } }, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u3092\u30AD\u30E5\u30FC\u306B\u767B\u9332\u3057\u307E\u3057\u305F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#64748b", marginBottom: 16 } }, "PXE \u30A4\u30D9\u30F3\u30C8\u30ED\u30B0\u3067\u9032\u6357\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059"), /* @__PURE__ */ React.createElement("button", { onClick: () => setRollbackDone(false), style: {
      padding: "8px 20px",
      borderRadius: 8,
      border: "1px solid #e2e8f0",
      background: "#fff",
      fontSize: 12,
      cursor: "pointer",
      color: "#475569"
    } }, "\u5225\u306E\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u3092\u5B9F\u884C"));
  }
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    borderRadius: 10,
    padding: "10px 16px",
    display: "flex",
    gap: 10,
    alignItems: "flex-start"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#92400e" } }, /* @__PURE__ */ React.createElement("strong", null, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u306F\u7AEF\u672B\u3092\u518D\u8D77\u52D5\u3057\u307E\u3059\u3002"), " \u5B9F\u884C\u524D\u306B\u4F5C\u696D\u30C7\u30FC\u30BF\u306E\u4FDD\u5B58\u72B6\u6CC1\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002 \u7DCA\u6025\u6642\u4EE5\u5916\u306F\u66F4\u65B0\u30EA\u30F3\u30B0\u7BA1\u7406\u3092\u901A\u3058\u305F\u6BB5\u968E\u7684\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u3092\u63A8\u5968\u3057\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5BFE\u8C61"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 } }, ROLLBACK_PATTERNS.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.id, onClick: () => setRollbackTarget(p.id), style: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 10,
    border: "2px solid",
    borderColor: rollbackTarget === p.id ? "#ef4444" : "#e2e8f0",
    background: rollbackTarget === p.id ? "#fef2f2" : "#fff",
    cursor: "pointer",
    textAlign: "left"
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 20, lineHeight: 1 } }, p.icon), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a" } }, p.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#64748b" } }, p.desc))))), rollbackTarget === "single" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u5BFE\u8C61\u7AEF\u672B"), /* @__PURE__ */ React.createElement("select", { value: selectedDevice, onChange: (e) => setSelectedDevice(e.target.value), style: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    background: "#fff"
  } }, DEVICES_DATA.map((d) => /* @__PURE__ */ React.createElement("option", { key: d.id, value: d.id }, d.id, " \u2014 ", d.hostname, " (", d.location, ")")))), rollbackTarget === "profile" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u5BFE\u8C61\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB"), /* @__PURE__ */ React.createElement("select", { value: selectedProfile, onChange: (e) => setSelectedProfile(e.target.value), style: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    background: "#fff"
  } }, PXE_PROFILES.map((p) => /* @__PURE__ */ React.createElement("option", { key: p.id, value: p.id }, p.label, " (", p.count, "\u53F0)")))), rollbackTarget === "emergency" && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 12,
    fontSize: 12,
    color: "#991b1b"
  } }, "\u{1F6A8} ", /* @__PURE__ */ React.createElement("strong", null, "\u5168", DEVICES_DATA.length, "\u53F0"), "\u3092\u540C\u6642\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u3057\u307E\u3059\u3002\u3053\u306E\u64CD\u4F5C\u306F\u53D6\u308A\u6D88\u305B\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5148\u30D0\u30FC\u30B8\u30E7\u30F3"), /* @__PURE__ */ React.createElement("select", { value: targetVersion, onChange: (e) => setTargetVersion(e.target.value), style: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 12,
    background: "#fff"
  } }, /* @__PURE__ */ React.createElement("option", { value: "v0.9.0" }, "v0.9.0 (\u5B89\u5B9A\u7248 \u2014 2026-05-02)"), /* @__PURE__ */ React.createElement("option", { value: "v1.0.0-rc1" }, "v1.0.0-rc1 (2026-05-04)"), /* @__PURE__ */ React.createElement("option", { value: "v1.0.0-rc2" }, "v1.0.0-rc2 (2026-05-05)"))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u7406\u7531 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: rollbackReason,
      onChange: (e) => setRollbackReason(e.target.value),
      rows: 2,
      placeholder: "\u4F8B: AppArmor \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u4E0D\u5177\u5408\u306B\u3088\u308B\u30AD\u30AA\u30B9\u30AF\u7AEF\u672B\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF",
      style: {
        width: "100%",
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        fontSize: 12,
        resize: "vertical",
        outline: "none"
      }
    }
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => rollbackReason.trim() && setShowConfirm(true),
      disabled: !rollbackReason.trim(),
      style: {
        padding: "9px 22px",
        borderRadius: 8,
        border: "none",
        cursor: rollbackReason.trim() ? "pointer" : "not-allowed",
        background: rollbackReason.trim() ? "#ef4444" : "#e2e8f0",
        color: rollbackReason.trim() ? "#fff" : "#94a3b8",
        fontSize: 13,
        fontWeight: 600
      }
    },
    "\u{1F519} \u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5B9F\u884C"
  )), showConfirm && /* @__PURE__ */ React.createElement("div", { style: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1e3
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#fff",
    borderRadius: 14,
    padding: 28,
    width: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,.2)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 30, textAlign: "center", marginBottom: 10 } }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 8 } }, "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u306E\u78BA\u8A8D"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#64748b", textAlign: "center", marginBottom: 16 } }, rollbackTarget === "single" ? selectedDevice : rollbackTarget === "profile" ? `${selectedProfile} \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5168\u53F0` : rollbackTarget === "ring" ? "\u6307\u5B9A\u30EA\u30F3\u30B0\u5168\u53F0" : "\u5168\u7AEF\u672B", "\u3092 ", /* @__PURE__ */ React.createElement("strong", null, targetVersion), " \u306B\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { style: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 11,
    color: "#64748b",
    marginBottom: 16
  } }, "\u7406\u7531: ", rollbackReason), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowConfirm(false), style: {
    flex: 1,
    padding: "9px 0",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#475569"
  } }, "\u30AD\u30E3\u30F3\u30BB\u30EB"), /* @__PURE__ */ React.createElement("button", { onClick: handleSubmit, style: {
    flex: 1,
    padding: "9px 0",
    borderRadius: 8,
    border: "none",
    background: "#ef4444",
    fontSize: 12,
    cursor: "pointer",
    color: "#fff",
    fontWeight: 600
  } }, "\u5B9F\u884C\u3059\u308B")))));
}
function PxeLogTab() {
  const evColor = (s) => s === "ok" ? "#22c55e" : s === "warn" ? "#f59e0b" : "#ef4444";
  const evBg = (s) => s === "ok" ? "#f0fdf4" : s === "warn" ? "#fffbeb" : "#fef2f2";
  const evLabel = (s) => s === "ok" ? "\u6210\u529F" : s === "warn" ? "\u8B66\u544A" : "\u5931\u6557";
  const evIcon = (e) => ({
    boot_request: "\u{1F4E1}",
    install_done: "\u2705",
    rollback: "\u{1F519}",
    failed: "\u274C"
  })[e] || "\u{1F4CB}";
  return /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "PXE \u30A4\u30D9\u30F3\u30C8\u30ED\u30B0"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u65E5\u6642", "\u7AEF\u672B", "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", "\u30A4\u30D9\u30F3\u30C8", "\u8A73\u7D30", "\u7D50\u679C"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, PXE_EVENTS.map((e) => /* @__PURE__ */ React.createElement("tr", { key: e.id, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }) }, e.at), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontFamily: "monospace", fontSize: 11 }) }, e.device), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#f1f5f9" } }, e.profile)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13 } }, evIcon(e.event))), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 11, color: "#475569", maxWidth: 280 }) }, e.detail), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 10,
    padding: "2px 7px",
    borderRadius: 10,
    fontWeight: 600,
    background: evBg(e.status),
    color: evColor(e.status)
  } }, evLabel(e.status))))))));
}

/* === proto-page-security.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const SECURITY_EVENTS = [
  { at: "09:29:45", type: "apparmor_deny", device: "CDX-KSK-201", detail: "AppArmor DENIED: /usr/bin/cdx-agent write to /tmp/unauthorized", severity: "high" },
  { at: "09:28:12", type: "auth_failure", device: "unknown", detail: "HMAC \u7F72\u540D\u691C\u8A3C\u5931\u6557: device_id=CDX-FAKE-999 (\u672A\u767B\u9332\u7AEF\u672B)", severity: "critical" },
  { at: "09:25:00", type: "rate_limit", device: "CDX-FLD-102", detail: "\u30EC\u30FC\u30C8\u5236\u9650\u8D85\u904E: heartbeat 12/min (\u4E0A\u9650 10/min) \u2192 429 \u8FD4\u5374", severity: "medium" },
  { at: "09:20:33", type: "apparmor_deny", device: "CDX-KSK-201", detail: "AppArmor DISABLED: \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u672A\u9069\u7528\u72B6\u614B\u3092\u691C\u77E5", severity: "critical" },
  { at: "09:15:00", type: "policy_applied", device: "CDX-HQ-001", detail: "nftables \u30EB\u30FC\u30EB v2.1 \u9069\u7528\u5B8C\u4E86", severity: "info" },
  { at: "09:10:00", type: "agent_outdated", device: "CDX-FLD-101", detail: "cdx-agent 0.1.9 \u2192 0.2.0 \u672A\u66F4\u65B0 (Ring 2 \u5C55\u958B\u6E08\u307F)", severity: "medium" },
  { at: "09:05:00", type: "policy_applied", device: "CDX-BR-010", detail: "sudo \u30DD\u30EA\u30B7\u30FC v2.0 \u9069\u7528\u5B8C\u4E86", severity: "info" },
  { at: "08:55:00", type: "auth_failure", device: "unknown", detail: "Bearer Token \u4E0D\u4E00\u81F4: POST /api/v1/devices/register", severity: "high" },
  { at: "08:30:00", type: "cve_found", device: "CDX-KSK-201", detail: "CVE-2026-1234: libssl3 3.0.13 \u2014 Medium (\u4FEE\u6B63\u7248\u3042\u308A)", severity: "medium" },
  { at: "08:00:00", type: "policy_applied", device: "ALL", detail: "AppArmor \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB v1.3 \u5168\u7AEF\u672B\u914D\u4FE1\u5B8C\u4E86 (9/10 \u9069\u7528)", severity: "info" }
];
const VULN_DATA = [
  { cve: "CVE-2026-1234", pkg: "libssl3", installed: "3.0.13-1", fixed: "3.0.13-2", severity: "Medium", devices: ["CDX-KSK-201", "CDX-FLD-101"], status: "\u4FEE\u6B63\u7248\u3042\u308A" },
  { cve: "CVE-2026-0567", pkg: "curl", installed: "8.5.0-2", fixed: "8.5.0-3", severity: "Low", devices: ["CDX-KSK-201"], status: "\u4FEE\u6B63\u7248\u3042\u308A" }
];
const POLICY_TEMPLATES = [
  { name: "standard (\u672C\u793E/\u652F\u5E97)", policies: ["AppArmor: enforced", "sudo: IT\u7BA1\u7406\u8005\u306E\u307F", "nftables: HTTPS+DNS+SSH", "APT: \u793E\u5185\u30DF\u30E9\u30FC", "USB: \u8A31\u53EF"] },
  { name: "field (\u73FE\u5834)", policies: ["AppArmor: enforced", "sudo: \u5236\u9650\u4ED8\u304D", "nftables: HTTPS+DNS", "APT: \u793E\u5185\u30DF\u30E9\u30FC+\u30AD\u30E3\u30C3\u30B7\u30E5", "USB: \u8AAD\u53D6\u306E\u307F"] },
  { name: "kiosk (\u5171\u7528\u7AEF\u672B)", policies: ["AppArmor: enforced (strict)", "sudo: \u7121\u52B9", "nftables: HTTPS \u306E\u307F", "APT: \u81EA\u52D5\u66F4\u65B0\u7121\u52B9", "USB: \u7121\u52B9"] }
];
const POLICIES_FULL = [
  { name: "AppArmor \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB", version: "v1.3", prev: "v1.2", lastPush: "2026-05-05 10:00", applied: 9, total: 10, status: "\u90E8\u5206\u9069\u7528", schedule: "\u5373\u6642", nextVersion: "v1.4" },
  { name: "sudo \u30DD\u30EA\u30B7\u30FC", version: "v2.0", prev: "v1.9", lastPush: "2026-05-04 14:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u9069\u7528", schedule: "\u5373\u6642", nextVersion: null },
  { name: "nftables \u30EB\u30FC\u30EB", version: "v2.1", prev: "v2.0", lastPush: "2026-05-05 18:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u9069\u7528", schedule: "\u5373\u6642", nextVersion: "v2.2" },
  { name: "APT \u30DF\u30E9\u30FC\u8A2D\u5B9A", version: "v1.1", prev: "v1.0", lastPush: "2026-05-05 08:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u9069\u7528", schedule: "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u7A93", nextVersion: null },
  { name: "HMAC \u5171\u6709\u9375", version: "rotate-05", prev: "rotate-04", lastPush: "2026-05-01 00:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u914D\u5E03", schedule: "\u6708\u6B21\u30ED\u30FC\u30C6\u30FC\u30B7\u30E7\u30F3", nextVersion: "rotate-06" },
  { name: "systemd timer \u8A2D\u5B9A", version: "v1.0", prev: "v0.9", lastPush: "2026-04-28 09:00", applied: 10, total: 10, status: "\u5168\u7AEF\u672B\u9069\u7528", schedule: "\u5373\u6642", nextVersion: null }
];
const DIFF_EXAMPLE = {
  "nftables \u30EB\u30FC\u30EB": {
    removed: [
      "  # v2.0",
      "  tcp dport { 80, 443 } accept",
      "  udp dport 53 accept"
    ],
    added: [
      "  # v2.1",
      "  tcp dport { 80, 443 } accept",
      "  udp dport 53 accept",
      "  tcp dport 8300 accept  # cdx-server API",
      "  icmp type echo-request limit rate 5/second accept"
    ]
  },
  "AppArmor \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB": {
    removed: [
      "  # v1.2",
      "  /var/lib/cdx-agent/spool/** rw,",
      "  /etc/cdx-agent/** r,"
    ],
    added: [
      "  # v1.3",
      "  /var/lib/cdx-agent/spool/** rw,",
      "  /etc/cdx-agent/** r,",
      "  /var/log/cdx-agent/** w,  # \u30ED\u30B0\u51FA\u529B\u8FFD\u52A0",
      "  deny /tmp/** w,           # tmp\u66F8\u8FBC\u307F\u7981\u6B62"
    ]
  }
};
const sevColor = (s) => s === "critical" ? "#ef4444" : s === "high" ? "#f59e0b" : s === "medium" ? "#3b82f6" : "#22c55e";
const sevBg = (s) => s === "critical" ? "#fef2f2" : s === "high" ? "#fffbeb" : s === "medium" ? "#eff6ff" : "#f0fdf4";
const TMPL_COLORS = ["#2563eb", "#f59e0b", "#22c55e", "#8b5cf6", "#ef4444", "#06b6d4"];
const TemplatesTab = ({ executeAction }) => {
  const [templates, setTemplates] = React.useState(
    POLICY_TEMPLATES.map((t, i) => __spreadProps(__spreadValues({}, t), {
      id: "tmpl-" + i,
      isDefault: true,
      color: TMPL_COLORS[i],
      policies: t.policies.map((p, j) => ({ text: p, enabled: true, id: "p-" + i + "-" + j }))
    }))
  );
  const [editing, setEditing] = React.useState(null);
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newBase, setNewBase] = React.useState("");
  const [customPolicy, setCustomPolicy] = React.useState("");
  const [addingCustomTo, setAddingCustomTo] = React.useState(null);
  const duplicateTemplate = (tmpl) => {
    const newTmpl = __spreadProps(__spreadValues({}, tmpl), {
      id: "tmpl-" + Date.now(),
      name: tmpl.name + " (\u30B3\u30D4\u30FC)",
      isDefault: false,
      color: TMPL_COLORS[templates.length % TMPL_COLORS.length],
      policies: tmpl.policies.map((p, j) => __spreadProps(__spreadValues({}, p), { id: "p-new-" + Date.now() + "-" + j }))
    });
    setTemplates((prev) => [...prev, newTmpl]);
    executeAction("\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u8907\u88FD", tmpl.name + " \u2192 " + newTmpl.name);
  };
  const deleteTemplate = (tmplId) => {
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl == null ? void 0 : tmpl.isDefault) return;
    setTemplates((prev) => prev.filter((t) => t.id !== tmplId));
    executeAction("\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u524A\u9664", (tmpl == null ? void 0 : tmpl.name) || tmplId);
    if (editing === tmplId) setEditing(null);
  };
  const togglePolicy = (tmplId, policyId) => {
    setTemplates((prev) => prev.map((t) => t.id === tmplId ? __spreadProps(__spreadValues({}, t), { policies: t.policies.map((p) => p.id === policyId ? __spreadProps(__spreadValues({}, p), { enabled: !p.enabled }) : p) }) : t));
  };
  const removePolicy = (tmplId, policyId) => {
    setTemplates((prev) => prev.map((t) => t.id === tmplId ? __spreadProps(__spreadValues({}, t), { policies: t.policies.filter((p) => p.id !== policyId) }) : t));
  };
  const addCustomPolicy = (tmplId) => {
    if (!customPolicy.trim()) return;
    setTemplates((prev) => prev.map((t) => t.id === tmplId ? __spreadProps(__spreadValues({}, t), { policies: [...t.policies, { text: customPolicy.trim(), enabled: true, id: "p-custom-" + Date.now() }] }) : t));
    executeAction("\u30AB\u30B9\u30BF\u30E0\u30DD\u30EA\u30B7\u30FC\u8FFD\u52A0", customPolicy.trim());
    setCustomPolicy("");
    setAddingCustomTo(null);
  };
  const createTemplate = () => {
    if (!newName.trim()) return;
    const base = newBase ? templates.find((t) => t.id === newBase) : null;
    const newTmpl = {
      id: "tmpl-" + Date.now(),
      name: newName.trim(),
      isDefault: false,
      color: TMPL_COLORS[templates.length % TMPL_COLORS.length],
      policies: base ? base.policies.map((p, j) => __spreadProps(__spreadValues({}, p), { id: "p-new-" + Date.now() + "-" + j })) : [
        { text: "AppArmor: enforced", enabled: true, id: "p-new-0" },
        { text: "sudo: \u5236\u9650\u4ED8\u304D", enabled: true, id: "p-new-1" },
        { text: "nftables: HTTPS+DNS", enabled: true, id: "p-new-2" }
      ]
    };
    setTemplates((prev) => [...prev, newTmpl]);
    executeAction("\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u65B0\u898F\u4F5C\u6210", newTmpl.name + (base ? " (\u30D9\u30FC\u30B9: " + base.name + ")" : ""));
    setShowNew(false);
    setNewName("");
    setNewBase("");
    setEditing(newTmpl.id);
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225\u30DD\u30EA\u30B7\u30FC\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNew(!showNew), style: { padding: "6px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "+ \u65B0\u898F\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8")), showNew && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16, background: "#eff6ff", border: "1px solid #bfdbfe" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#2563eb", marginBottom: 10 } }, "\u65B0\u898F\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u4F5C\u6210"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 200 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u540D"), /* @__PURE__ */ React.createElement("input", { type: "text", value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "\u4F8B: \u5DE5\u5834\u7AEF\u672B", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 200 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u30D9\u30FC\u30B9\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\uFF08\u4EFB\u610F\uFF09"), /* @__PURE__ */ React.createElement("select", { value: newBase, onChange: (e) => setNewBase(e.target.value), style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12 } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u7A7A\u306E\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8\u30DD\u30EA\u30B7\u30FC\u306E\u307F\uFF09"), templates.map((t) => /* @__PURE__ */ React.createElement("option", { key: t.id, value: t.id }, t.name, " \u3092\u8907\u88FD")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: createTemplate, disabled: !newName.trim(), style: { padding: "8px 18px", borderRadius: 8, background: newName.trim() ? "#2563eb" : "#e2e8f0", color: newName.trim() ? "#fff" : "#94a3b8", border: "none", fontSize: 12, fontWeight: 600, cursor: newName.trim() ? "pointer" : "not-allowed" } }, "\u4F5C\u6210"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNew(false), style: { padding: "8px 14px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" } }, "\u30AD\u30E3\u30F3\u30BB\u30EB")))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 } }, templates.map((t) => {
    const isEditing = editing === t.id;
    return /* @__PURE__ */ React.createElement("div", { key: t.id, style: __spreadProps(__spreadValues({}, cardStyle), { borderTop: `3px solid ${t.color}`, background: isEditing ? "#fafbfd" : "#fff" }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#0f172a" } }, t.name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, t.isDefault && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#94a3b8" } }, "\u30C7\u30D5\u30A9\u30EB\u30C8"), !t.isDefault && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "#eff6ff", color: "#2563eb" } }, "\u30AB\u30B9\u30BF\u30E0"))), t.policies.map((p) => /* @__PURE__ */ React.createElement("div", { key: p.id, style: { display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12, opacity: p.enabled ? 1 : 0.4 } }, isEditing ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: p.enabled, onChange: () => togglePolicy(t.id, p.id), style: { cursor: "pointer" } }), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, color: "#475569", textDecoration: p.enabled ? "none" : "line-through" } }, p.text), /* @__PURE__ */ React.createElement("button", { onClick: () => removePolicy(t.id, p.id), style: { padding: "1px 5px", borderRadius: 3, border: "1px solid #fecaca", fontSize: 9, cursor: "pointer", background: "#fff", color: "#dc2626" } }, "\u2715")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: p.enabled ? "#22c55e" : "#e2e8f0", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#475569" } }, p.text)))), isEditing && addingCustomTo === t.id && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, padding: "6px 0" } }, /* @__PURE__ */ React.createElement("input", { type: "text", value: customPolicy, onChange: (e) => setCustomPolicy(e.target.value), placeholder: "\u30AB\u30B9\u30BF\u30E0\u30DD\u30EA\u30B7\u30FC...", style: { flex: 1, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11 }, onKeyDown: (e) => e.key === "Enter" && addCustomPolicy(t.id) }), /* @__PURE__ */ React.createElement("button", { onClick: () => addCustomPolicy(t.id), style: { padding: "4px 10px", borderRadius: 6, background: "#22c55e", color: "#fff", border: "none", fontSize: 10, cursor: "pointer" } }, "\u8FFD\u52A0"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setAddingCustomTo(null);
      setCustomPolicy("");
    }, style: { padding: "4px 8px", borderRadius: 6, background: "#fff", color: "#94a3b8", border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer" } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u9069\u7528", t.name), style: { flex: 1, padding: "5px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb", fontWeight: 600 } }, "\u9069\u7528"), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditing(isEditing ? null : t.id), style: { flex: 1, padding: "5px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: isEditing ? "#eff6ff" : "#fff", color: isEditing ? "#2563eb" : "#64748b", fontWeight: isEditing ? 600 : 400 } }, isEditing ? "\u5B8C\u4E86" : "\u7DE8\u96C6"), isEditing && /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setAddingCustomTo(t.id);
      setCustomPolicy("");
    }, style: { flex: 1, padding: "5px", borderRadius: 6, border: "1px solid #bbf7d0", fontSize: 10, cursor: "pointer", background: "#f0fdf4", color: "#22c55e", fontWeight: 600 } }, "+ \u30EB\u30FC\u30EB"), /* @__PURE__ */ React.createElement("button", { onClick: () => duplicateTemplate(t), style: { padding: "5px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u8907\u88FD"), !t.isDefault && /* @__PURE__ */ React.createElement("button", { onClick: () => deleteTemplate(t.id), style: { padding: "5px 8px", borderRadius: 6, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626" } }, "\u524A\u9664")));
  })), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30DD\u30EA\u30B7\u30FC\u914D\u4FE1\u30E1\u30AB\u30CB\u30BA\u30E0"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "14px", background: "#f8fafc", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 } }, "\u30B5\u30FC\u30D0\u30FC\u5074 (Push)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", lineHeight: 1.6 } }, /* @__PURE__ */ React.createElement("code", { style: { background: "#e8ecf1", padding: "1px 4px", borderRadius: 2 } }, "GET /api/v1/policy"), " \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8\u3067\u6700\u65B0\u30DD\u30EA\u30B7\u30FC\u3092\u914D\u4FE1\u3002\u7BA1\u7406\u8005\u304CWebUI\u304B\u3089\u30DD\u30EA\u30B7\u30FC\u66F4\u65B0\u3092\u30C8\u30EA\u30AC\u30FC\u53EF\u80FD\u3002")), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px", background: "#f8fafc", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 } }, "Agent\u5074 (Pull)"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", lineHeight: 1.6 } }, /* @__PURE__ */ React.createElement("code", { style: { background: "#e8ecf1", padding: "1px 4px", borderRadius: 2 } }, "cdx-agent poll-policy"), " \u30B3\u30DE\u30F3\u30C9\u3067\u5B9A\u671F\u53D6\u5F97\u3002systemd timer \u3067 interval \u8A2D\u5B9A\u3002HMAC \u7F72\u540D\u4ED8\u304D\u30EA\u30AF\u30A8\u30B9\u30C8\u3002")))));
};
const SecurityPage = () => {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [showDiff, setShowDiff] = React.useState(null);
  const [showPolicyAction, setShowPolicyAction] = React.useState(null);
  const [policyActionType, setPolicyActionType] = React.useState("push");
  const [policySchedule, setPolicySchedule] = React.useState("immediate");
  const [eventFilter, setEventFilter] = React.useState("all");
  const [actionLog, setActionLog] = React.useState([]);
  const [isolatedDevices, setIsolatedDevices] = React.useState([]);
  const complianceScore = (d) => {
    let score = 100;
    if (d.apparmor !== "\u6709\u52B9") score -= 30;
    if (d.agent !== "0.2.0") score -= 20;
    if (d.status === "offline") score -= 15;
    if (d.status === "warning") score -= 10;
    return Math.max(0, score);
  };
  const fleetScore = Math.round(DEVICES_DATA.reduce((s, d) => s + complianceScore(d), 0) / DEVICES_DATA.length);
  const executeAction = (action, detail) => {
    const now = (/* @__PURE__ */ new Date()).toLocaleTimeString("ja-JP");
    setActionLog((prev) => [{ at: now, action, detail, status: "\u5B9F\u884C\u4E2D" }, ...prev]);
    setTimeout(() => setActionLog((prev) => prev.map((l, i) => i === 0 ? __spreadProps(__spreadValues({}, l), { status: "\u5B8C\u4E86" }) : l)), 1500);
  };
  const toggleIsolate = (deviceId) => {
    if (isolatedDevices.includes(deviceId)) {
      setIsolatedDevices((prev) => prev.filter((id) => id !== deviceId));
      executeAction("\u9694\u96E2\u89E3\u9664", deviceId);
    } else {
      setIsolatedDevices((prev) => [...prev, deviceId]);
      executeAction("\u81EA\u52D5\u9694\u96E2", deviceId + " \u2014 \u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u5236\u9650\u9069\u7528");
    }
  };
  const tabs = [
    { id: "overview", label: "\u6982\u8981" },
    { id: "compliance", label: "\u30B3\u30F3\u30D7\u30E9\u30A4\u30A2\u30F3\u30B9" },
    { id: "events", label: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A4\u30D9\u30F3\u30C8" },
    { id: "policies", label: "\u30DD\u30EA\u30B7\u30FC\u7BA1\u7406" },
    { id: "templates", label: "\u30DD\u30EA\u30B7\u30FC\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8" },
    { id: "vulnerabilities", label: "\u8106\u5F31\u6027" },
    { id: "report", label: "\u76E3\u67FB\u30EC\u30DD\u30FC\u30C8" }
  ];
  const filteredEvents = eventFilter === "all" ? SECURITY_EVENTS : SECURITY_EVENTS.filter((e) => e.severity === eventFilter);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D71\u5236\u30FB\u30DD\u30EA\u30B7\u30FC\u7BA1\u7406"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#94a3b8", margin: "2px 0 0" } }, "AppArmor\u30FBHMAC\u7F72\u540D\u30FB\u30D5\u30A1\u30A4\u30A2\u30A6\u30A9\u30FC\u30EB\u30FB\u30DD\u30EA\u30B7\u30FC\u914D\u4FE1\u306E\u7D71\u5408\u7BA1\u7406")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "6px 14px", borderRadius: 8, background: fleetScore >= 90 ? "#f0fdf4" : fleetScore >= 70 ? "#fffbeb" : "#fef2f2", border: `1px solid ${fleetScore >= 90 ? "#bbf7d0" : fleetScore >= 70 ? "#fde68a" : "#fecaca"}` } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#64748b" } }, "\u30D5\u30EA\u30FC\u30C8\u30B9\u30B3\u30A2 "), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, fontWeight: 700, color: fleetScore >= 90 ? "#22c55e" : fleetScore >= 70 ? "#f59e0b" : "#ef4444" } }, fleetScore), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#94a3b8" } }, "/100")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid #e8ecf1" } }, tabs.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, onClick: () => setActiveTab(t.id), style: {
    padding: "8px 14px",
    fontSize: 12,
    border: "none",
    cursor: "pointer",
    borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
    color: activeTab === t.id ? "#2563eb" : "#64748b",
    fontWeight: activeTab === t.id ? 600 : 400,
    background: "transparent",
    marginBottom: -1
  } }, t.label))), activeTab === "overview" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 } }, [
    { label: "\u30D5\u30EA\u30FC\u30C8\u30B9\u30B3\u30A2", val: fleetScore + "/100", color: fleetScore >= 90 ? "#22c55e" : "#f59e0b" },
    { label: "AppArmor\u6709\u52B9", val: `${DEVICES_DATA.length - aaDisabledN}/${DEVICES_DATA.length}`, color: aaDisabledN > 0 ? "#f59e0b" : "#22c55e" },
    { label: "Agent\u6700\u65B0", val: `${DEVICES_DATA.length - oldAgentN}/${DEVICES_DATA.length}`, color: oldAgentN > 0 ? "#f59e0b" : "#22c55e" },
    { label: "\u672A\u5BFE\u5FDC\u30A4\u30D9\u30F3\u30C8", val: SECURITY_EVENTS.filter((e) => e.severity === "critical" || e.severity === "high").length + "\u4EF6", color: "#ef4444" },
    { label: "\u9694\u96E2\u7AEF\u672B", val: isolatedDevices.length + "\u53F0", color: isolatedDevices.length > 0 ? "#ef4444" : "#22c55e" }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 4 } }, s.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: s.color } }, s.val)))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u5BFE\u7B56\u4E00\u89A7"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 } }, [
    { title: "AppArmor MAC", desc: "cdx-agent \u306B\u6700\u5C0F\u6A29\u9650\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u3092\u9069\u7528\u3002spool rw, config r, HTTPS/DNS \u306E\u307F\u3002", status: "\u6709\u52B9" },
    { title: "HMAC-SHA256 \u7F72\u540D", desc: "\u5168API\u30EA\u30AF\u30A8\u30B9\u30C8\u306B device_id + payload_type + timestamp_bucket + body hash \u3067\u7F72\u540D\u3002", status: "\u6709\u52B9" },
    { title: "sudo \u30DD\u30EA\u30B7\u30FC", desc: "\u4E00\u822C\u30E6\u30FC\u30B6\u30FC\u306E sudo \u5B9F\u884C\u3092\u5236\u9650\u3002IT\u7BA1\u7406\u8005\u306E\u307F\u7279\u6A29\u64CD\u4F5C\u3002", status: "\u9069\u7528\u6E08" },
    { title: "nftables / ufw", desc: "\u30DB\u30B9\u30C8\u30D9\u30FC\u30B9FW\u3067\u4E0D\u8981\u30DD\u30FC\u30C8\u3092\u9589\u9396\u3002HTTPS/DNS/cdx-server \u306E\u307F\u8A31\u53EF\u3002", status: "\u6709\u52B9" },
    { title: "HTTP\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30D8\u30C3\u30C0\u30FC", desc: "X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy\u3002", status: "\u6709\u52B9" },
    { title: "\u30EC\u30FC\u30C8\u5236\u9650", desc: "per-device token bucket + 429 + Retry-After\u3002Redis sliding-window\u3002", status: "\u6709\u52B9" }
  ].map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { padding: "14px", background: "#f8fafc", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, m.title), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 500, color: "#22c55e", padding: "1px 6px", background: "#f0fdf4", borderRadius: 4 } }, m.status)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", lineHeight: 1.5 } }, m.desc))))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "\u6700\u65B0\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A4\u30D9\u30F3\u30C8"), /* @__PURE__ */ React.createElement("button", { onClick: () => setActiveTab("events"), style: { fontSize: 11, color: "#2563eb", background: "none", border: "none", cursor: "pointer" } }, "\u5168\u3066\u8868\u793A \u2192")), SECURITY_EVENTS.slice(0, 5).map((e, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: sevColor(e.severity), flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", fontSize: 11, flexShrink: 0, width: 55 } }, e.at), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "1px 6px", borderRadius: 3, background: sevBg(e.severity), color: sevColor(e.severity), fontWeight: 500, flexShrink: 0 } }, e.severity), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, e.detail))))), activeTab === "compliance" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u7AEF\u672B\u5225\u30B3\u30F3\u30D7\u30E9\u30A4\u30A2\u30F3\u30B9\u30B9\u30B3\u30A2"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u7AEF\u672BID", "\u62E0\u70B9", "\u30B9\u30B3\u30A2", "AppArmor", "Agent", "\u30DD\u30EA\u30B7\u30FC", "HB\u72B6\u614B", "\u9694\u96E2", "\u5224\u5B9A"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, DEVICES_DATA.map((d) => {
    const score = complianceScore(d);
    const allOk = d.apparmor === "\u6709\u52B9" && d.agent === "0.2.0";
    const isolated = isolatedDevices.includes(d.id);
    return /* @__PURE__ */ React.createElement("tr", { key: d.id, style: { borderTop: "1px solid #f1f5f9", background: isolated ? "#fef2f2" : score < 70 ? "#fffbeb" : "" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500 }) }, d.id), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, d.location), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 50, height: 6, background: "#f1f5f9", borderRadius: 3 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: score + "%", background: score >= 90 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444", borderRadius: 3 } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: score >= 90 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444" } }, score))), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: d.apparmor === "\u6709\u52B9" ? "#22c55e" : "#ef4444", fontWeight: 500 }) }, d.apparmor), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: d.agent === "0.2.0" ? "#22c55e" : "#f59e0b", fontWeight: 500 }) }, "v", d.agent), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#22c55e", fontWeight: 500 }) }, "\u9069\u7528\u6E08"), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: sBg(d.status), color: sColor(d.status) } }, /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: sColor(d.status) } }), sLabel(d.status))), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("button", { onClick: () => toggleIsolate(d.id), style: { padding: "2px 8px", borderRadius: 4, border: `1px solid ${isolated ? "#22c55e" : "#fecaca"}`, fontSize: 10, cursor: "pointer", background: isolated ? "#f0fdf4" : "#fff", color: isolated ? "#22c55e" : "#dc2626", fontWeight: 500 } }, isolated ? "\u89E3\u9664" : "\u9694\u96E2")), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: allOk ? "#f0fdf4" : "#fef2f2", color: allOk ? "#22c55e" : "#ef4444" } }, allOk ? "\u9069\u5408" : "\u8981\u5BFE\u5FDC")));
  })))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30D5\u30EA\u30FC\u30C8\u30B9\u30B3\u30A2\u63A8\u79FB (\u76F4\u8FD17\u65E5)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 8, height: 100 } }, [82, 85, 85, 87, 88, 90, fleetScore].map((v, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, color: v >= 90 ? "#22c55e" : "#f59e0b" } }, v), /* @__PURE__ */ React.createElement("div", { style: { width: "100%", height: v * 0.9, background: v >= 90 ? "#bbf7d0" : "#fde68a", borderRadius: "4px 4px 0 0" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, color: "#94a3b8" } }, ["4/30", "5/1", "5/2", "5/3", "5/4", "5/5", "5/6"][i])))))), activeTab === "events" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12 } }, ["all", "critical", "high", "medium", "info"].map((f) => /* @__PURE__ */ React.createElement("button", { key: f, onClick: () => setEventFilter(f), style: {
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid #e8ecf1",
    fontSize: 11,
    cursor: "pointer",
    background: eventFilter === f ? sevBg(f === "all" ? "info" : f) : "#fff",
    color: eventFilter === f ? sevColor(f === "all" ? "info" : f) : "#64748b",
    fontWeight: eventFilter === f ? 600 : 400
  } }, f === "all" ? `\u5168\u3066 (${SECURITY_EVENTS.length})` : f))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A4\u30D9\u30F3\u30C8\u30BF\u30A4\u30E0\u30E9\u30A4\u30F3"), filteredEvents.map((e, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "start", gap: 12, padding: "10px 0", borderBottom: i < filteredEvents.length - 1 ? "1px solid #f8fafc" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, width: 60 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, color: "#475569" } }, e.at), /* @__PURE__ */ React.createElement("span", { style: { width: 10, height: 10, borderRadius: "50%", background: sevColor(e.severity) } })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: sevBg(e.severity), color: sevColor(e.severity) } }, e.severity), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#64748b" } }, e.type), e.device !== "unknown" && e.device !== "ALL" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#2563eb", fontWeight: 500 } }, e.device)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#475569", lineHeight: 1.5 } }, e.detail)), (e.severity === "critical" || e.severity === "high") && e.device !== "unknown" && e.device !== "ALL" && /* @__PURE__ */ React.createElement("button", { onClick: () => toggleIsolate(e.device), style: { padding: "4px 10px", borderRadius: 5, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626", fontWeight: 500, flexShrink: 0 } }, isolatedDevices.includes(e.device) ? "\u9694\u96E2\u6E08" : "\u9694\u96E2"))))), activeTab === "policies" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "\u30DD\u30EA\u30B7\u30FC\u4E00\u89A7")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u30DD\u30EA\u30B7\u30FC\u540D", "\u73FE\u884C\u7248", "\u524D\u7248", "\u914D\u4FE1\u65E5\u6642", "\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB", "\u9069\u7528\u72B6\u614B", "\u64CD\u4F5C"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, POLICIES_FULL.map((p, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontWeight: 500, color: "#0f172a" }) }, p.name), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("code", { style: { fontSize: 11, background: "#eff6ff", padding: "2px 6px", borderRadius: 3, color: "#2563eb" } }, p.version)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8" }) }, p.prev), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8", fontSize: 11 }) }, p.lastPush), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#64748b" } }, p.schedule)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 60, height: 6, background: "#f1f5f9", borderRadius: 3 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${p.applied / p.total * 100}%`, background: p.applied === p.total ? "#22c55e" : "#f59e0b", borderRadius: 3 } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 500, color: p.applied === p.total ? "#22c55e" : "#f59e0b" } }, p.applied, "/", p.total))), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, DIFF_EXAMPLE[p.name] && /* @__PURE__ */ React.createElement("button", { onClick: () => setShowDiff(showDiff === p.name ? null : p.name), style: { padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: showDiff === p.name ? "#eff6ff" : "#fff", color: "#2563eb" } }, "\u5DEE\u5206"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setShowPolicyAction(p.name);
    setPolicyActionType("push");
  }, style: { padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#22c55e" } }, "\u914D\u4FE1"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setShowPolicyAction(p.name);
    setPolicyActionType("rollback");
  }, style: { padding: "2px 8px", borderRadius: 4, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626" } }, "\u623B\u3059")))))))), showDiff && DIFF_EXAMPLE[showDiff] && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, showDiff, " \u2014 \u30D0\u30FC\u30B8\u30E7\u30F3\u6BD4\u8F03"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#dc2626", marginBottom: 6 } }, "- \u524D\u7248 (\u524A\u9664)"), /* @__PURE__ */ React.createElement("pre", { style: { background: "#fef2f2", padding: "10px 14px", borderRadius: 8, fontSize: 11, color: "#dc2626", margin: 0, lineHeight: 1.6 } }, DIFF_EXAMPLE[showDiff].removed.join("\n"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#22c55e", marginBottom: 6 } }, "+ \u73FE\u884C\u7248 (\u8FFD\u52A0)"), /* @__PURE__ */ React.createElement("pre", { style: { background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, fontSize: 11, color: "#16a34a", margin: 0, lineHeight: 1.6 } }, DIFF_EXAMPLE[showDiff].added.join("\n")))), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowDiff(null), style: { marginTop: 8, padding: "4px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u9589\u3058\u308B")), showPolicyAction && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16, background: policyActionType === "rollback" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${policyActionType === "rollback" ? "#fecaca" : "#bbf7d0"}` }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: policyActionType === "rollback" ? "#dc2626" : "#16a34a", marginBottom: 10 } }, policyActionType === "rollback" ? "\u30DD\u30EA\u30B7\u30FC\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF" : "\u30DD\u30EA\u30B7\u30FC\u914D\u4FE1", " \u2014 ", showPolicyAction), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u914D\u4FE1\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, [{ id: "immediate", label: "\u5373\u6642\u914D\u4FE1" }, { id: "scheduled", label: "\u65E5\u6642\u6307\u5B9A" }, { id: "maintenance", label: "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u7A93" }].map((s) => /* @__PURE__ */ React.createElement("button", { key: s.id, onClick: () => setPolicySchedule(s.id), style: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer", background: policySchedule === s.id ? "#eff6ff" : "#fff", color: policySchedule === s.id ? "#2563eb" : "#64748b", fontWeight: policySchedule === s.id ? 600 : 400 } }, s.label)))), policySchedule === "scheduled" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("input", { type: "datetime-local", defaultValue: "2026-05-07T02:00", style: { padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 } })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u5BFE\u8C61"), /* @__PURE__ */ React.createElement("select", { style: { padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 } }, /* @__PURE__ */ React.createElement("option", null, "\u5168\u7AEF\u672B (10\u53F0)"), /* @__PURE__ */ React.createElement("option", null, "\u672A\u9069\u7528\u7AEF\u672B\u306E\u307F"), /* @__PURE__ */ React.createElement("option", null, "standard \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u306E\u307F"), /* @__PURE__ */ React.createElement("option", null, "field \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u306E\u307F"), /* @__PURE__ */ React.createElement("option", null, "kiosk \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u306E\u307F"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    executeAction(policyActionType === "rollback" ? "\u30DD\u30EA\u30B7\u30FC\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF" : "\u30DD\u30EA\u30B7\u30FC\u914D\u4FE1", showPolicyAction);
    setShowPolicyAction(null);
  }, style: { padding: "6px 16px", borderRadius: 6, background: policyActionType === "rollback" ? "#dc2626" : "#22c55e", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, policyActionType === "rollback" ? "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u5B9F\u884C" : "\u914D\u4FE1\u5B9F\u884C"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowPolicyAction(null), style: { padding: "6px 16px", borderRadius: 6, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" } }, "\u30AD\u30E3\u30F3\u30BB\u30EB"))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u7AEF\u672B\u5225\u30DD\u30EA\u30B7\u30FC\u9069\u7528\u72B6\u614B"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, /* @__PURE__ */ React.createElement("th", { style: thStyle }, "\u7AEF\u672BID"), POLICIES_FULL.slice(0, 4).map((p) => /* @__PURE__ */ React.createElement("th", { key: p.name, style: __spreadProps(__spreadValues({}, thStyle), { fontSize: 9 }) }, p.name.split(" ")[0])), /* @__PURE__ */ React.createElement("th", { style: thStyle }, "\u64CD\u4F5C"))), /* @__PURE__ */ React.createElement("tbody", null, DEVICES_DATA.map((d) => {
    const aaOk = d.apparmor === "\u6709\u52B9";
    return /* @__PURE__ */ React.createElement("tr", { key: d.id, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500 }) }, d.id), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: aaOk ? "#22c55e" : "#ef4444", fontWeight: 600 } }, aaOk ? "\u2713" : "\u2717")), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#22c55e", fontWeight: 600 } }, "\u2713")), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#22c55e", fontWeight: 600 } }, "\u2713")), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#22c55e", fontWeight: 600 } }, "\u2713")), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, !aaOk && /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30DD\u30EA\u30B7\u30FC\u518D\u914D\u4FE1", d.id + " \u2014 AppArmor"), style: { padding: "2px 8px", borderRadius: 4, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626" } }, "\u518D\u914D\u4FE1")));
  }))))), activeTab === "templates" && /* @__PURE__ */ React.createElement(TemplatesTab, { executeAction }), activeTab === "vulnerabilities" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 } }, [
    { label: "\u691C\u51FACVE", val: VULN_DATA.length + "\u4EF6", color: "#f59e0b" },
    { label: "\u5F71\u97FF\u7AEF\u672B", val: [...new Set(VULN_DATA.flatMap((v) => v.devices))].length + "\u53F0", color: "#ef4444" },
    { label: "\u4FEE\u6B63\u7248\u3042\u308A", val: VULN_DATA.filter((v) => v.status === "\u4FEE\u6B63\u7248\u3042\u308A").length + "\u4EF6", color: "#22c55e" }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: __spreadProps(__spreadValues({}, cardStyle), { textAlign: "center" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: s.color } }, s.val), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8" } }, s.label)))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u691C\u51FA\u3055\u308C\u305F\u8106\u5F31\u6027"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["CVE ID", "\u30D1\u30C3\u30B1\u30FC\u30B8", "\u5C0E\u5165\u7248", "\u4FEE\u6B63\u7248", "\u6DF1\u523B\u5EA6", "\u5F71\u97FF\u7AEF\u672B", "\u72B6\u614B", "\u64CD\u4F5C"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, VULN_DATA.map((v, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500 }) }, v.cve), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, v.pkg), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("code", { style: { fontSize: 11, color: "#dc2626" } }, v.installed)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("code", { style: { fontSize: 11, color: "#22c55e" } }, v.fixed)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: v.severity === "Medium" ? "#fffbeb" : "#f0fdf4", color: v.severity === "Medium" ? "#f59e0b" : "#22c55e" } }, v.severity)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, v.devices.join(", ")), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#22c55e", fontWeight: 500 } }, v.status)), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30D1\u30C3\u30C1\u9069\u7528", v.cve + " \u2192 " + v.fixed), style: { padding: "2px 8px", borderRadius: 4, border: "1px solid #bbf7d0", fontSize: 10, cursor: "pointer", background: "#f0fdf4", color: "#22c55e", fontWeight: 600 } }, "\u30D1\u30C3\u30C1\u9069\u7528")))))))), activeTab === "report" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u76E3\u67FB\u30EC\u30DD\u30FC\u30C8\u751F\u6210"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "16px", background: "#f8fafc", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30EC\u30DD\u30FC\u30C8\u5185\u5BB9"), ["\u30D5\u30EA\u30FC\u30C8\u30B3\u30F3\u30D7\u30E9\u30A4\u30A2\u30F3\u30B9\u30B9\u30B3\u30A2\u63A8\u79FB", "\u7AEF\u672B\u5225\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u9069\u5408\u72B6\u614B", "\u30DD\u30EA\u30B7\u30FC\u9069\u7528\u72B6\u6CC1\u30B5\u30DE\u30EA\u30FC", "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30A4\u30D9\u30F3\u30C8\u96C6\u8A08", "\u8106\u5F31\u6027\u691C\u51FA\u30FB\u5BFE\u5FDC\u72B6\u6CC1", "\u66F4\u65B0\u30EA\u30F3\u30B0\u5C55\u958B\u5C65\u6B74", "\u9694\u96E2\u7AEF\u672B\u5C65\u6B74", "\u63A8\u5968\u6539\u5584\u30A2\u30AF\u30B7\u30E7\u30F3"].map((item, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: "#2563eb", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#475569" } }, item)))), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px", background: "#f8fafc", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30EC\u30DD\u30FC\u30C8\u30B5\u30DE\u30EA\u30FC (\u30D7\u30EC\u30D3\u30E5\u30FC)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, [
    { k: "\u30EC\u30DD\u30FC\u30C8\u65E5", v: "2026-05-06" },
    { k: "\u30D5\u30EA\u30FC\u30C8\u30B9\u30B3\u30A2", v: fleetScore + "/100" },
    { k: "\u7BA1\u7406\u7AEF\u672B\u6570", v: DEVICES_DATA.length + "\u53F0" },
    { k: "\u5B8C\u5168\u9069\u5408\u7AEF\u672B", v: DEVICES_DATA.filter((d) => complianceScore(d) === 100).length + "\u53F0" },
    { k: "\u8981\u5BFE\u5FDC\u7AEF\u672B", v: DEVICES_DATA.filter((d) => complianceScore(d) < 100).length + "\u53F0" },
    { k: "\u691C\u51FACVE", v: VULN_DATA.length + "\u4EF6" },
    { k: "\u9694\u96E2\u4E2D\u7AEF\u672B", v: isolatedDevices.length + "\u53F0" },
    { k: "\u672A\u5BFE\u5FDC\u30A4\u30D9\u30F3\u30C8", v: SECURITY_EVENTS.filter((e) => e.severity === "critical").length + "\u4EF6" }
  ].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8" } }, r.k), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "#0f172a" } }, r.v)))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30EC\u30DD\u30FC\u30C8\u751F\u6210", "PDF"), style: { padding: "8px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" } }, "\u{1F4C4} PDF \u30EC\u30DD\u30FC\u30C8\u751F\u6210"), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30EC\u30DD\u30FC\u30C8\u751F\u6210", "CSV"), style: { padding: "8px 20px", borderRadius: 8, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" } }, "\u{1F4CA} CSV \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8")))), actionLog.length > 0 && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, "\u64CD\u4F5C\u30ED\u30B0"), /* @__PURE__ */ React.createElement("button", { onClick: () => setActionLog([]), style: { fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" } }, "\u30AF\u30EA\u30A2")), actionLog.slice(0, 10).map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < actionLog.length - 1 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", fontSize: 11 } }, a.at), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "#475569" } }, a.action), /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b" } }, a.detail), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "\u5B8C\u4E86" ? "#f0fdf4" : "#eff6ff", color: a.status === "\u5B8C\u4E86" ? "#22c55e" : "#3b82f6" } }, a.status)))));
};
window.SecurityPage = SecurityPage;

/* === proto-page-others.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const EXTENDED_AUDIT_LOG = [
  ...AUDIT_LOG,
  { at: "2026-05-06 09:29:00", actor: "system", action: "heartbeat.received", detail: "CDX-HQ-001 heartbeat \u53D7\u4FE1", reqId: "req-hb-001", device: "CDX-HQ-001" },
  { at: "2026-05-06 09:28:00", actor: "system", action: "heartbeat.received", detail: "CDX-HQ-002 heartbeat \u53D7\u4FE1", reqId: "req-hb-002", device: "CDX-HQ-002" },
  { at: "2026-05-06 09:27:00", actor: "system", action: "heartbeat.received", detail: "CDX-BR-010 heartbeat \u53D7\u4FE1", reqId: "req-hb-003", device: "CDX-BR-010" },
  { at: "2026-05-06 09:20:00", actor: "system", action: "alert.create", detail: "CDX-KSK-201 AppArmor \u7121\u52B9\u691C\u77E5", reqId: "req-alert-001", device: "CDX-KSK-201" },
  { at: "2026-05-06 09:15:00", actor: "system", action: "policy.applied", detail: "CDX-HQ-001 nftables v2.1 \u9069\u7528\u5B8C\u4E86", reqId: "req-pol-001", device: "CDX-HQ-001" },
  { at: "2026-05-06 09:10:00", actor: "admin", action: "device.isolate", detail: "CDX-KSK-201 \u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u9694\u96E2\u5B9F\u884C", reqId: "req-iso-001", device: "CDX-KSK-201" },
  { at: "2026-05-06 08:30:00", actor: "system", action: "auth.failure", detail: "HMAC\u7F72\u540D\u4E0D\u4E00\u81F4: unknown device CDX-FAKE-999", reqId: "req-auth-001", device: null },
  { at: "2026-05-06 08:00:00", actor: "admin", action: "ring.deploy", detail: "Ring 2 \u3078 cdx-agent 0.2.0 \u5C55\u958B\u958B\u59CB", reqId: "req-ring-001", device: null },
  { at: "2026-05-05 18:00:00", actor: "admin", action: "policy.push", detail: "nftables v2.1 \u5168\u7AEF\u672B\u914D\u4FE1", reqId: "req-pol-002", device: null },
  { at: "2026-05-05 17:00:00", actor: "system", action: "inventory.received", detail: "CDX-FLD-102 \u30A4\u30F3\u30D9\u30F3\u30C8\u30EA\u53D7\u4FE1", reqId: "req-inv-001", device: "CDX-FLD-102" },
  { at: "2026-05-05 16:00:00", actor: "suzuki", action: "iso_build.create", detail: "kiosk ISO \u30D3\u30EB\u30C9\u958B\u59CB", reqId: "req-b8c9d0", device: null },
  { at: "2026-05-05 15:30:00", actor: "system", action: "rate_limit.exceeded", detail: "CDX-FLD-102 heartbeat 12/min \u8D85\u904E", reqId: "req-rl-001", device: "CDX-FLD-102" }
].sort((a, b) => b.at.localeCompare(a.at));
const LogsPage = () => {
  const [filterAction, setFilterAction] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [deviceFilter, setDeviceFilter] = React.useState("");
  const [traceReqId, setTraceReqId] = React.useState(null);
  const [showStats, setShowStats] = React.useState(false);
  const [showRetention, setShowRetention] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [refreshCount, setRefreshCount] = React.useState(0);
  const [showExport, setShowExport] = React.useState(false);
  const [showFlow, setShowFlow] = React.useState(null);
  const [retentionDays, setRetentionDays] = React.useState(90);
  const actions = [...new Set(EXTENDED_AUDIT_LOG.map((a) => a.action.split(".")[0]))];
  const devices = [...new Set(EXTENDED_AUDIT_LOG.filter((a) => a.device).map((a) => a.device))];
  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => setRefreshCount((c) => c + 1), 5e3);
    return () => clearInterval(interval);
  }, [autoRefresh]);
  const filtered = EXTENDED_AUDIT_LOG.filter((a) => filterAction === "all" || a.action.startsWith(filterAction)).filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return a.actor && a.actor.toLowerCase().includes(s) || a.detail && a.detail.toLowerCase().includes(s) || a.reqId && a.reqId.toLowerCase().includes(s) || a.action && a.action.toLowerCase().includes(s);
  }).filter((a) => !deviceFilter || a.device === deviceFilter).filter((a) => !dateFrom || a.at >= dateFrom).filter((a) => !dateTo || a.at <= dateTo + " 23:59:59");
  const traceEvents = traceReqId ? EXTENDED_AUDIT_LOG.filter((a) => a.reqId === traceReqId) : [];
  const actionCounts = {};
  const actorCounts = {};
  EXTENDED_AUDIT_LOG.forEach((a) => {
    const aType = a.action.split(".")[0];
    actionCounts[aType] = (actionCounts[aType] || 0) + 1;
    actorCounts[a.actor] = (actorCounts[a.actor] || 0) + 1;
  });
  const maxActionCount = Math.max(...Object.values(actionCounts));
  const maxActorCount = Math.max(...Object.values(actorCounts));
  const FLOWS = {
    "iso_build": { label: "ISO \u30D3\u30EB\u30C9\u2192\u914D\u5E03\u30D5\u30ED\u30FC", events: ["iso_build.create", "iso_build.complete", "iso_build.failed"] },
    "policy": { label: "\u30DD\u30EA\u30B7\u30FC\u914D\u4FE1\u30D5\u30ED\u30FC", events: ["policy.push", "policy.applied"] },
    "ring": { label: "\u30EA\u30F3\u30B0\u5C55\u958B\u30D5\u30ED\u30FC", events: ["ring.deploy"] },
    "device": { label: "\u30C7\u30D0\u30A4\u30B9\u64CD\u4F5C\u30D5\u30ED\u30FC", events: ["device.isolate"] }
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, "\u76E3\u67FB\u30ED\u30B0"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#94a3b8", margin: "2px 0 0" } }, "\u5168\u64CD\u4F5C\u306E\u30C8\u30EC\u30FC\u30B5\u30D3\u30EA\u30C6\u30A3 \u2014 request-id \u306B\u3088\u308B E2E \u8FFD\u8DE1 (", EXTENDED_AUDIT_LOG.length, "\u4EF6)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: autoRefresh ? "#f0fdf4" : "#f8fafc", border: "1px solid #e8ecf1" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: autoRefresh ? "#22c55e" : "#94a3b8", animation: autoRefresh ? "pulse 2s infinite" : "none" } }), /* @__PURE__ */ React.createElement("button", { onClick: () => setAutoRefresh(!autoRefresh), style: { border: "none", background: "transparent", fontSize: 11, cursor: "pointer", color: autoRefresh ? "#22c55e" : "#64748b", fontWeight: 500 } }, autoRefresh ? "\u81EA\u52D5\u66F4\u65B0 ON" : "\u81EA\u52D5\u66F4\u65B0 OFF")), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowStats(!showStats), style: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: showStats ? "#eff6ff" : "#fff", color: showStats ? "#2563eb" : "#64748b" } }, "\u{1F4CA} \u7D71\u8A08"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowExport(!showExport), style: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u{1F4E5} \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowRetention(!showRetention), style: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u2699 \u4FDD\u6301\u8A2D\u5B9A"))), showExport && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12, padding: "12px 16px" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u30ED\u30B0\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowExport(false), style: { padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "\u{1F4C4} CSV (", filtered.length, "\u4EF6)"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowExport(false), style: { padding: "6px 14px", borderRadius: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" } }, "{ }", " JSON (", filtered.length, "\u4EF6)"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, color: "#94a3b8" } }, "\u73FE\u5728\u306E\u30D5\u30A3\u30EB\u30BF\u6761\u4EF6\u3067\u51FA\u529B"))), showRetention && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12, padding: "12px 16px" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u30ED\u30B0\u4FDD\u6301\u30DD\u30EA\u30B7\u30FC"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b" } }, "\u4FDD\u6301\u671F\u9593"), /* @__PURE__ */ React.createElement("input", { type: "range", min: 30, max: 365, value: retentionDays, onChange: (e) => setRetentionDays(Number(e.target.value)), style: { width: 120 } }), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "#2563eb" } }, retentionDays, "\u65E5")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8" } }, "\u8D85\u904E\u30ED\u30B0\u306F\u81EA\u52D5\u30A2\u30FC\u30AB\u30A4\u30D6 (MinIO/S3 \u306B\u5727\u7E2E\u4FDD\u7BA1)"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowRetention(false), style: { marginLeft: "auto", padding: "4px 12px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, cursor: "pointer" } }, "\u4FDD\u5B58"))), showStats && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30A2\u30AF\u30B7\u30E7\u30F3\u7A2E\u5225\u96C6\u8A08"), Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).map(([k, v], i) => /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 } }, /* @__PURE__ */ React.createElement("code", { style: { color: "#475569", width: 100, fontWeight: 500 } }, k), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${v / maxActionCount * 100}%`, background: "#3b82f6", borderRadius: 4 } })), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "#2563eb", width: 30, textAlign: "right" } }, v)))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30A2\u30AF\u30BF\u30FC\u5225\u96C6\u8A08"), Object.entries(actorCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#475569", width: 80, fontWeight: 500 } }, k), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${v / maxActorCount * 100}%`, background: "#8b5cf6", borderRadius: 4 } })), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "#8b5cf6", width: 30, textAlign: "right" } }, v))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setFilterAction("all"), style: { padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: filterAction === "all" ? "#eff6ff" : "#fff", color: filterAction === "all" ? "#2563eb" : "#64748b", fontWeight: filterAction === "all" ? 600 : 400 } }, "\u5168\u3066"), actions.map((a) => /* @__PURE__ */ React.createElement("button", { key: a, onClick: () => setFilterAction(filterAction === a ? "all" : a), style: { padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: filterAction === a ? "#eff6ff" : "#fff", color: filterAction === a ? "#2563eb" : "#64748b", fontWeight: filterAction === a ? 600 : 400 } }, a)), /* @__PURE__ */ React.createElement("span", { style: { color: "#e2e8f0" } }, "|"), /* @__PURE__ */ React.createElement("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "\u{1F50D} \u30A2\u30AF\u30BF\u30FC / \u8A73\u7D30 / Request ID...", style: { padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, width: 200, color: "#0f172a" } }), /* @__PURE__ */ React.createElement("select", { value: deviceFilter, onChange: (e) => setDeviceFilter(e.target.value), style: { padding: "5px 8px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, color: "#475569" } }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u5168\u7AEF\u672B"), devices.map((d) => /* @__PURE__ */ React.createElement("option", { key: d, value: d }, d))), /* @__PURE__ */ React.createElement("input", { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), style: { padding: "4px 8px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, color: "#475569" } }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#94a3b8" } }, "\u301C"), /* @__PURE__ */ React.createElement("input", { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), style: { padding: "4px 8px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, color: "#475569" } }), (search || deviceFilter || dateFrom || dateTo || filterAction !== "all") && /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setSearch("");
    setDeviceFilter("");
    setDateFrom("");
    setDateTo("");
    setFilterAction("all");
  }, style: { padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 11, cursor: "pointer", background: "#fef2f2", color: "#dc2626" } }, "\u30AF\u30EA\u30A2"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 11, color: "#94a3b8" } }, filtered.length, "\u4EF6 \u8868\u793A\u4E2D")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#94a3b8", alignSelf: "center" } }, "\u30D5\u30ED\u30FC\u8FFD\u8DE1:"), Object.entries(FLOWS).map(([k, v]) => /* @__PURE__ */ React.createElement("button", { key: k, onClick: () => setShowFlow(showFlow === k ? null : k), style: { padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: showFlow === k ? "#eff6ff" : "#fff", color: showFlow === k ? "#2563eb" : "#64748b", fontWeight: showFlow === k ? 600 : 400 } }, v.label))), showFlow && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, FLOWS[showFlow].label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 0 } }, EXTENDED_AUDIT_LOG.filter((a) => FLOWS[showFlow].events.some((e) => a.action === e) || a.action.startsWith(showFlow)).map((a, i, arr) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", gap: 12, padding: "8px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", width: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 10, height: 10, borderRadius: "50%", background: "#2563eb", border: "2px solid #bfdbfe", flexShrink: 0 } }), i < arr.length - 1 && /* @__PURE__ */ React.createElement("div", { style: { width: 2, flex: 1, background: "#e2e8f0" } })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", fontSize: 11 } }, a.at), /* @__PURE__ */ React.createElement("code", { style: { fontSize: 10, background: "#f1f5f9", padding: "1px 6px", borderRadius: 3, color: "#475569" } }, a.action), /* @__PURE__ */ React.createElement("span", { style: { color: "#475569" } }, a.actor)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginTop: 2 } }, a.detail)), /* @__PURE__ */ React.createElement("button", { onClick: () => setTraceReqId(a.reqId), style: { padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 9, cursor: "pointer", background: "#fff", color: "#2563eb", flexShrink: 0, alignSelf: "center" } }, a.reqId))))), traceReqId && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#2563eb" } }, "Request ID \u8FFD\u8DE1: ", /* @__PURE__ */ React.createElement("code", { style: { background: "#dbeafe", padding: "2px 8px", borderRadius: 4 } }, traceReqId)), /* @__PURE__ */ React.createElement("button", { onClick: () => setTraceReqId(null), style: { padding: "3px 10px", borderRadius: 5, border: "1px solid #bfdbfe", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u9589\u3058\u308B")), traceEvents.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, traceEvents.map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#fff", borderRadius: 8, fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", fontSize: 11, width: 130 } }, a.at), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "#475569" } }, a.actor), /* @__PURE__ */ React.createElement("code", { style: { fontSize: 10, background: "#f1f5f9", padding: "1px 6px", borderRadius: 3, color: "#475569" } }, a.action), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, color: "#64748b" } }, a.detail)))) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#94a3b8" } }, "\u3053\u306E Request ID \u306B\u95A2\u9023\u3059\u308B\u30A4\u30D9\u30F3\u30C8\u306F1\u4EF6\u306E\u307F\u3067\u3059")), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["\u65E5\u6642", "\u30A2\u30AF\u30BF\u30FC", "\u30A2\u30AF\u30B7\u30E7\u30F3", "\u7AEF\u672B", "\u8A73\u7D30", "Request ID"].map(
    (h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)
  ))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((a, i) => {
    const isTraced = traceReqId && a.reqId === traceReqId;
    return /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f1f5f9", background: isTraced ? "#eff6ff" : "" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8", whiteSpace: "nowrap", fontSize: 11 }) }, a.at), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569", fontWeight: 500 }) }, a.actor), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("code", { style: { fontSize: 10, background: "#f1f5f9", padding: "2px 6px", borderRadius: 3, color: "#475569" } }, a.action)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: a.device ? "#2563eb" : "#cbd5e1", fontWeight: a.device ? 500 : 400, fontSize: 11 }) }, a.device || "\u2014"), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }) }, a.detail), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("button", { onClick: () => setTraceReqId(traceReqId === a.reqId ? null : a.reqId), style: { padding: "1px 6px", borderRadius: 3, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: isTraced ? "#2563eb" : "#fff", color: isTraced ? "#fff" : "#94a3b8", fontFamily: "monospace" } }, a.reqId)));
  })))));
};
window.LogsPage = LogsPage;

/* === proto-page-settings.jsx === */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const AD_USERS_MOCK = [
  { dn: "CN=\u7530\u4E2D \u592A\u90CE,OU=\u672C\u793E,DC=mirai,DC=local", cn: "\u7530\u4E2D \u592A\u90CE", sam: "T001", dept: "\u5DE5\u4E8B\u90E8", title: "\u5DE5\u4E8B\u90E8\u9577", email: "t001@mirai.local", ou: "\u672C\u793E", enabled: true, lastLogon: "2026-05-14 09:12" },
  { dn: "CN=\u9234\u6728 \u82B1\u5B50,OU=\u672C\u793E,DC=mirai,DC=local", cn: "\u9234\u6728 \u82B1\u5B50", sam: "T002", dept: "\u7DCF\u52D9\u90E8", title: "\u7DCF\u52D9\u8AB2\u9577", email: "t002@mirai.local", ou: "\u672C\u793E", enabled: true, lastLogon: "2026-05-13 17:45" },
  { dn: "CN=\u5C71\u7530 \u6B21\u90CE,OU=\u5927\u962A\u652F\u5E97,DC=mirai,DC=local", cn: "\u5C71\u7530 \u6B21\u90CE", sam: "T003", dept: "\u55B6\u696D\u90E8", title: "\u55B6\u696D\u62C5\u5F53", email: "t003@mirai.local", ou: "\u5927\u962A\u652F\u5E97", enabled: true, lastLogon: "2026-05-14 08:55" },
  { dn: "CN=\u4F50\u85E4 \u4E09\u90CE,OU=\u672C\u793E,DC=mirai,DC=local", cn: "\u4F50\u85E4 \u4E09\u90CE", sam: "T004", dept: "\u8A2D\u8A08\u90E8", title: "\u4E3B\u4EFB\u8A2D\u8A08\u58EB", email: "t004@mirai.local", ou: "\u672C\u793E", enabled: true, lastLogon: "2026-05-12 10:30" },
  { dn: "CN=\u4F0A\u85E4 \u7F8E\u54B2,OU=\u540D\u53E4\u5C4B\u652F\u5E97,DC=mirai,DC=local", cn: "\u4F0A\u85E4 \u7F8E\u54B2", sam: "T005", dept: "\u65BD\u5DE5\u7BA1\u7406\u90E8", title: "\u73FE\u5834\u76E3\u7763", email: "t005@mirai.local", ou: "\u540D\u53E4\u5C4B\u652F\u5E97", enabled: true, lastLogon: "2026-05-14 07:20" },
  { dn: "CN=\u6E21\u8FBA \u5065\u4E00,OU=\u5927\u962A\u652F\u5E97,DC=mirai,DC=local", cn: "\u6E21\u8FBA \u5065\u4E00", sam: "T006", dept: "\u65BD\u5DE5\u7BA1\u7406\u90E8", title: "\u65BD\u5DE5\u4E3B\u4EFB", email: "t006@mirai.local", ou: "\u5927\u962A\u652F\u5E97", enabled: true, lastLogon: "2026-05-11 16:00" },
  { dn: "CN=\u4E2D\u6751 \u7531\u7F8E,OU=\u672C\u793E,DC=mirai,DC=local", cn: "\u4E2D\u6751 \u7531\u7F8E", sam: "T007", dept: "\u7D4C\u7406\u90E8", title: "\u7D4C\u7406\u62C5\u5F53", email: "t007@mirai.local", ou: "\u672C\u793E", enabled: true, lastLogon: "2026-05-14 09:00" },
  { dn: "CN=\u5C0F\u6797 \u6B63\u9053,OU=\u798F\u5CA1\u652F\u5E97,DC=mirai,DC=local", cn: "\u5C0F\u6797 \u6B63\u9053", sam: "T008", dept: "\u5DE5\u4E8B\u90E8", title: "\u73FE\u5834\u62C5\u5F53", email: "t008@mirai.local", ou: "\u798F\u5CA1\u652F\u5E97", enabled: true, lastLogon: "2026-05-10 12:15" },
  { dn: "CN=\u52A0\u85E4 \u88D5\u5B50,OU=\u672C\u793E,DC=mirai,DC=local", cn: "\u52A0\u85E4 \u88D5\u5B50", sam: "T009", dept: "\u4EBA\u4E8B\u90E8", title: "\u4EBA\u4E8B\u62C5\u5F53", email: "t009@mirai.local", ou: "\u672C\u793E", enabled: true, lastLogon: "2026-05-13 11:40" },
  { dn: "CN=\u5409\u7530 \u6D69\u4E8C,OU=\u5DDD\u5D0E\u73FE\u5834,DC=mirai,DC=local", cn: "\u5409\u7530 \u6D69\u4E8C", sam: "T010", dept: "\u65BD\u5DE5\u7BA1\u7406\u90E8", title: "\u73FE\u5834\u76E3\u7763", email: "t010@mirai.local", ou: "\u5DDD\u5D0E\u73FE\u5834", enabled: true, lastLogon: "2026-05-14 06:45" },
  { dn: "CN=\u677E\u672C \u8061,OU=\u5927\u962A\u652F\u5E97,DC=mirai,DC=local", cn: "\u677E\u672C \u8061", sam: "T011", dept: "\u8A2D\u8A08\u90E8", title: "CAD\u30AA\u30DA\u30EC\u30FC\u30BF\u30FC", email: "t011@mirai.local", ou: "\u5927\u962A\u652F\u5E97", enabled: true, lastLogon: "2026-05-13 14:20" },
  { dn: "CN=\u4E95\u4E0A \u62D3\u4E5F,OU=\u6A2A\u6D5C\u73FE\u5834,DC=mirai,DC=local", cn: "\u4E95\u4E0A \u62D3\u4E5F", sam: "T012", dept: "\u5DE5\u4E8B\u90E8", title: "\u73FE\u5834\u62C5\u5F53", email: "t012@mirai.local", ou: "\u6A2A\u6D5C\u73FE\u5834", enabled: false, lastLogon: "2026-04-30 17:00" },
  { dn: "CN=\u6728\u6751 \u7F8E\u7A42,OU=\u672C\u793E,DC=mirai,DC=local", cn: "\u6728\u6751 \u7F8E\u7A42", sam: "T013", dept: "\u7DCF\u52D9\u90E8", title: "\u53D7\u4ED8", email: "t013@mirai.local", ou: "\u672C\u793E", enabled: true, lastLogon: "2026-05-14 08:30" },
  { dn: "CN=\u6797 \u5927\u8F14,OU=\u540D\u53E4\u5C4B\u652F\u5E97,DC=mirai,DC=local", cn: "\u6797 \u5927\u8F14", sam: "T014", dept: "\u55B6\u696D\u90E8", title: "\u55B6\u696D\u8AB2\u9577", email: "t014@mirai.local", ou: "\u540D\u53E4\u5C4B\u652F\u5E97", enabled: true, lastLogon: "2026-05-13 18:00" },
  { dn: "CN=\u6E05\u6C34 \u667A\u5B50,OU=\u672C\u793E,DC=mirai,DC=local", cn: "\u6E05\u6C34 \u667A\u5B50", sam: "T015", dept: "\u7D4C\u7406\u90E8", title: "\u7D4C\u7406\u8AB2\u9577", email: "t015@mirai.local", ou: "\u672C\u793E", enabled: true, lastLogon: "2026-05-14 08:45" }
];
const SETTINGS_HISTORY = [
  { at: "2026-05-06 09:00", actor: "admin", key: "CDX_LOG_LEVEL", from: "DEBUG", to: "INFO" },
  { at: "2026-05-05 18:00", actor: "admin", key: "CDX_WORKER_MOCK", from: "0", to: "1" },
  { at: "2026-05-04 10:00", actor: "admin", key: "CDX_DB_POOL_SIZE", from: "3", to: "5" },
  { at: "2026-05-01 00:00", actor: "system", key: "HMAC shared_secret", from: "rotate-04", to: "rotate-05" }
];
const ACTIVE_SESSIONS = [
  { id: "sess-001", user: "admin", ip: "192.168.1.5", startedAt: "2026-05-06 08:30", lastActive: "09:30", browser: "Chromium 124" },
  { id: "sess-002", user: "tanaka", ip: "192.168.2.10", startedAt: "2026-05-06 09:10", lastActive: "09:28", browser: "Firefox 126" }
];
const SettingsPage = () => {
  const [activeTab, setActiveTab] = React.useState("server");
  const [editMode, setEditMode] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showMask, setShowMask] = React.useState(true);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [actionLog, setActionLog] = React.useState([]);
  const [users, setUsers] = React.useState([
    { id: "usr-001", username: "admin", displayName: "\u7BA1\u7406\u8005", email: "admin@construction-dx.local", role: "admin", status: "active", lastLogin: "2026-05-06 08:30", createdAt: "2026-04-10", mfa: true, loginCount: 142 },
    { id: "usr-002", username: "tanaka", displayName: "\u7530\u4E2D \u592A\u90CE", email: "tanaka@construction-dx.local", role: "operator", status: "active", lastLogin: "2026-05-06 09:10", createdAt: "2026-04-15", mfa: true, loginCount: 87 },
    { id: "usr-003", username: "suzuki", displayName: "\u9234\u6728 \u82B1\u5B50", email: "suzuki@construction-dx.local", role: "operator", status: "active", lastLogin: "2026-05-05 16:45", createdAt: "2026-04-20", mfa: false, loginCount: 53 },
    { id: "usr-004", username: "yamada", displayName: "\u5C71\u7530 \u4E00\u90CE", email: "yamada@construction-dx.local", role: "viewer", status: "active", lastLogin: "2026-05-04 11:20", createdAt: "2026-04-22", mfa: false, loginCount: 21 },
    { id: "usr-005", username: "sato", displayName: "\u4F50\u85E4 \u6B21\u90CE", email: "sato@construction-dx.local", role: "viewer", status: "disabled", lastLogin: "2026-04-30 09:00", createdAt: "2026-04-25", mfa: false, loginCount: 8 }
  ]);
  const [editingUser, setEditingUser] = React.useState(null);
  const [showNewUser, setShowNewUser] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ username: "", displayName: "", email: "", role: "viewer", password: "" });
  const [userDetail, setUserDetail] = React.useState(null);
  const ROLES = [
    { id: "admin", label: "\u7BA1\u7406\u8005", desc: "\u5168\u6A5F\u80FD\u3078\u306E\u30D5\u30EB\u30A2\u30AF\u30BB\u30B9\u3002\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406\u3001\u8A2D\u5B9A\u5909\u66F4\u3001\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u30E2\u30FC\u30C9", color: "#ef4444", permissions: ["\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9", "\u7AEF\u672B\u7BA1\u7406", "ISO\u914D\u5E03", "\u66F4\u65B0\u30EA\u30F3\u30B0", "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30FB\u30DD\u30EA\u30B7\u30FC", "\u76E3\u67FB\u30ED\u30B0", "\u30B7\u30B9\u30C6\u30E0\u8A2D\u5B9A", "\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406"] },
    { id: "operator", label: "\u30AA\u30DA\u30EC\u30FC\u30BF\u30FC", desc: "\u7AEF\u672B\u7BA1\u7406\u30FBISO\u914D\u5E03\u30FB\u30EA\u30F3\u30B0\u7BA1\u7406\u306E\u64CD\u4F5C\u6A29\u9650\u3002\u8A2D\u5B9A\u5909\u66F4\u306F\u4E0D\u53EF", color: "#f59e0b", permissions: ["\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9", "\u7AEF\u672B\u7BA1\u7406", "ISO\u914D\u5E03", "\u66F4\u65B0\u30EA\u30F3\u30B0", "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30FB\u30DD\u30EA\u30B7\u30FC", "\u76E3\u67FB\u30ED\u30B0"] },
    { id: "viewer", label: "\u95B2\u89A7\u8005", desc: "\u5168\u753B\u9762\u306E\u95B2\u89A7\u306E\u307F\u3002\u64CD\u4F5C\u30FB\u5909\u66F4\u306F\u4E0D\u53EF", color: "#3b82f6", permissions: ["\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9(\u95B2\u89A7)", "\u7AEF\u672B\u7BA1\u7406(\u95B2\u89A7)", "ISO\u914D\u5E03(\u95B2\u89A7)", "\u76E3\u67FB\u30ED\u30B0(\u95B2\u89A7)"] }
  ];
  const roleColor = (r) => {
    var _a;
    return ((_a = ROLES.find((x) => x.id === r)) == null ? void 0 : _a.color) || "#94a3b8";
  };
  const roleLabel = (r) => {
    var _a;
    return ((_a = ROLES.find((x) => x.id === r)) == null ? void 0 : _a.label) || r;
  };
  const [envVars, setEnvVars] = React.useState([
    { k: "CDX_REGISTRATION_TOKEN", v: "a3f8c2e1d4b5...", desc: "\u30C7\u30D0\u30A4\u30B9\u767B\u9332 Bearer Token\uFF08\u5FC5\u9808\uFF09", sensitive: true, editable: true },
    { k: "CDX_ADMIN_TOKEN", v: "7b9e4f2a1c8d...", desc: "Admin UI Basic Auth Token", sensitive: true, editable: true },
    { k: "CDX_ADMIN_ENABLED", v: "true", desc: "Admin UI \u6709\u52B9\u5316\u30D5\u30E9\u30B0", sensitive: false, editable: true },
    { k: "CDX_WORKER_MOCK", v: "1", desc: "ISO build-worker \u30E2\u30C3\u30AF\u30E2\u30FC\u30C9", sensitive: false, editable: true },
    { k: "CDX_LOG_LEVEL", v: "INFO", desc: "\u30ED\u30B0\u51FA\u529B\u30EC\u30D9\u30EB (DEBUG/INFO/WARNING/ERROR)", sensitive: false, editable: true },
    { k: "CDX_LOG_FORMAT", v: "json", desc: "\u30ED\u30B0\u5F62\u5F0F (json / text)", sensitive: false, editable: true },
    { k: "DATABASE_URL", v: "postgresql://cdx:***@localhost:5432/cdx", desc: "PostgreSQL \u63A5\u7D9A URL", sensitive: true, editable: true },
    { k: "REDIS_URL", v: "redis://localhost:6379/0", desc: "Redis \u63A5\u7D9A URL", sensitive: false, editable: true }
  ]);
  const [domainConfig, setDomainConfig] = React.useState({
    enabled: true,
    domain: "mirai.local",
    netbiosName: "MIRAI",
    dcHost: "VMSV3001",
    dcBackup: "",
    joinUser: "svc-domainjoin",
    joinPassword: "",
    defaultOu: "OU=Workstations,DC=mirai,DC=local",
    loginFormat: "sam",
    kerberosRealm: "MIRAI.LOCAL",
    ldapBaseDn: "DC=mirai,DC=local",
    syncInterval: 60,
    enableSso: false,
    adSaved: false
  });
  const setDomain = (key, val) => setDomainConfig((prev) => __spreadProps(__spreadValues({}, prev), { [key]: val, adSaved: false }));
  const [adTestResult, setAdTestResult] = React.useState(null);
  const [showAdPassword, setShowAdPassword] = React.useState(false);
  const [adBrowse, setAdBrowse] = React.useState({
    host: "VMSV3001",
    user: "administrator",
    password: "",
    searchBase: "",
    searchFilter: ""
  });
  const [adBrowseStatus, setAdBrowseStatus] = React.useState("idle");
  const [adUserList, setAdUserList] = React.useState([]);
  const [selectedAdUsers, setSelectedAdUsers] = React.useState(/* @__PURE__ */ new Set());
  const [adUserSearch, setAdUserSearch] = React.useState("");
  const [showAdPw, setShowAdPw] = React.useState(false);
  const [adOuFilter, setAdOuFilter] = React.useState("all");
  const handleAdConnect = () => {
    if (!adBrowse.host || !adBrowse.user) return;
    setAdBrowseStatus("connecting");
    setAdUserList([]);
    setTimeout(() => {
      setAdBrowseStatus("success");
      setAdUserList(AD_USERS_MOCK);
    }, 1800);
  };
  const toggleAdUser = (sam) => {
    setSelectedAdUsers((prev) => {
      const next = new Set(prev);
      next.has(sam) ? next.delete(sam) : next.add(sam);
      return next;
    });
  };
  const adOus = ["all", ...new Set(AD_USERS_MOCK.map((u) => u.ou))];
  const filteredAdUsers = adUserList.filter((u) => {
    if (adOuFilter !== "all" && u.ou !== adOuFilter) return false;
    if (adUserSearch) {
      const q = adUserSearch.toLowerCase();
      return u.cn.toLowerCase().includes(q) || u.sam.toLowerCase().includes(q) || u.dept.toLowerCase().includes(q);
    }
    return true;
  });
  const [notifications, setNotifications] = React.useState([
    { type: "email", enabled: true, target: "admin@construction-dx.local" },
    { type: "webhook", enabled: false, target: "" },
    { type: "slack", enabled: false, target: "" }
  ]);
  const executeAction = (action, detail) => {
    const now = (/* @__PURE__ */ new Date()).toLocaleTimeString("ja-JP");
    setActionLog((prev) => [{ at: now, action, detail, status: "\u5B9F\u884C\u4E2D" }, ...prev]);
    setTimeout(() => setActionLog((prev) => prev.map((l, i) => i === 0 ? __spreadProps(__spreadValues({}, l), { status: "\u5B8C\u4E86" }) : l)), 1500);
  };
  const tabs = [
    { id: "server", label: "\u30B5\u30FC\u30D0\u30FC\u8A2D\u5B9A" },
    { id: "health", label: "\u30D8\u30EB\u30B9\u30C1\u30A7\u30C3\u30AF" },
    { id: "users", label: "\u30E6\u30FC\u30B6\u30FC\u7BA1\u7406" },
    { id: "auth", label: "\u8A8D\u8A3C\u30FB\u8A8D\u53EF" },
    { id: "domain", label: "\u{1F3E2} \u30C9\u30E1\u30A4\u30F3\u30FBAD" },
    { id: "database", label: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9" },
    { id: "agent", label: "Agent \u8A2D\u5B9A" },
    { id: "network", label: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF" },
    { id: "notifications", label: "\u901A\u77E5\u8A2D\u5B9A" },
    { id: "maintenance", label: "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9" },
    { id: "system", label: "\u30B7\u30B9\u30C6\u30E0\u60C5\u5831" }
  ];
  const [healthData, setHealthData] = React.useState({
    postgres: { status: "ok", responseMs: 3, uptime: "12d 4h" },
    redis: { status: "ok", responseMs: 1, uptime: "12d 4h" },
    minio: { status: "ok", responseMs: 8, uptime: "12d 4h" },
    prometheus: { status: "ok", responseMs: 12, uptime: "12d 4h" },
    server: { cpu: 12, mem: 34, disk: 45, uptime: "12d 4h", pid: 28451 }
  });
  React.useEffect(() => {
    const interval = setInterval(() => {
      setHealthData((prev) => __spreadProps(__spreadValues({}, prev), {
        postgres: __spreadProps(__spreadValues({}, prev.postgres), { responseMs: Math.max(1, prev.postgres.responseMs + Math.floor(Math.random() * 3) - 1) }),
        redis: __spreadProps(__spreadValues({}, prev.redis), { responseMs: Math.max(0, prev.redis.responseMs + Math.floor(Math.random() * 2) - 1) }),
        minio: __spreadProps(__spreadValues({}, prev.minio), { responseMs: Math.max(1, prev.minio.responseMs + Math.floor(Math.random() * 5) - 2) }),
        server: __spreadProps(__spreadValues({}, prev.server), { cpu: Math.max(1, Math.min(100, prev.server.cpu + Math.floor(Math.random() * 7) - 3)), mem: Math.max(10, Math.min(100, prev.server.mem + Math.floor(Math.random() * 3) - 1)) })
      }));
    }, 3e3);
    return () => clearInterval(interval);
  }, []);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 } }, "\u30B7\u30B9\u30C6\u30E0\u8A2D\u5B9A"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 12, color: "#94a3b8", margin: "2px 0 0" } }, "cdx-server \u74B0\u5883\u8A2D\u5B9A\u30FB\u8A8D\u8A3C\u30FB\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u30FBAgent\u8A2D\u5B9A\u306E\u4E00\u5143\u7BA1\u7406")), maintenanceMode && /* @__PURE__ */ React.createElement("div", { style: { padding: "6px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12, color: "#dc2626", fontWeight: 600 } }, "\u26A0 \u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u30E2\u30FC\u30C9 ON")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid #e8ecf1", flexWrap: "wrap" } }, tabs.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.id, onClick: () => setActiveTab(t.id), style: { padding: "8px 12px", fontSize: 11, border: "none", cursor: "pointer", borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent", color: activeTab === t.id ? "#2563eb" : "#64748b", fontWeight: activeTab === t.id ? 600 : 400, background: "transparent", marginBottom: -1 } }, t.label))), activeTab === "server" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "\u74B0\u5883\u5909\u6570"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setShowMask(!showMask), style: { padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" } }, showMask ? "\u{1F512} \u6A5F\u5BC6\u5024\u3092\u8868\u793A" : "\u{1F513} \u6A5F\u5BC6\u5024\u3092\u96A0\u3059"), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditMode(!editMode), style: { padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: editMode ? "#eff6ff" : "#fff", color: editMode ? "#2563eb" : "#64748b", fontWeight: editMode ? 600 : 400 } }, editMode ? "\u2713 \u5B8C\u4E86" : "\u270F \u7DE8\u96C6"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowHistory(!showHistory), style: { padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u{1F4CB} \u5909\u66F4\u5C65\u6B74"), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u8A2D\u5B9A\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7", "\u5168\u74B0\u5883\u5909\u6570\u3092JSON\u51FA\u529B"), style: { padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u{1F4BE} \u30D0\u30C3\u30AF\u30A2\u30C3\u30D7"))), showHistory && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 12, background: "#f8fafc" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u8A2D\u5B9A\u5909\u66F4\u5C65\u6B74"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { borderBottom: "1px solid #e8ecf1" } }, ["\u65E5\u6642", "\u5909\u66F4\u8005", "\u9805\u76EE", "\u65E7\u5024", "\u65B0\u5024"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, SETTINGS_HISTORY.map((h, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8", fontSize: 11 }) }, h.at), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569", fontWeight: 500 }) }, h.actor), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("code", { style: { fontSize: 11, color: "#2563eb" } }, h.key)), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#dc2626" }) }, h.from), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#22c55e", fontWeight: 600 }) }, h.to)))))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, envVars.map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { padding: "10px 0", borderBottom: i < envVars.length - 1 ? "1px solid #f8fafc" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("code", { style: { color: "#0f172a", fontSize: 12, fontWeight: 500 } }, r.k), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, r.sensitive && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#fef2f2", color: "#ef4444" } }, "\u6A5F\u5BC6"), editMode && r.editable ? /* @__PURE__ */ React.createElement("input", { type: r.sensitive && showMask ? "password" : "text", defaultValue: r.v, style: { padding: "3px 8px", borderRadius: 4, border: "1px solid #bfdbfe", fontSize: 11, width: 250, color: "#0f172a" }, onChange: (e) => {
    const nv = [...envVars];
    nv[i] = __spreadProps(__spreadValues({}, nv[i]), { v: e.target.value });
    setEnvVars(nv);
  } }) : /* @__PURE__ */ React.createElement("code", { style: { color: "#2563eb", fontSize: 11, background: "#eff6ff", padding: "2px 8px", borderRadius: 4 } }, r.sensitive && showMask ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : r.v))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 2 } }, r.desc))), editMode && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    executeAction("\u8A2D\u5B9A\u4FDD\u5B58", "\u74B0\u5883\u5909\u6570\u66F4\u65B0");
    setEditMode(false);
  }, style: { padding: "6px 16px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "\u4FDD\u5B58"), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3", "DB\u63A5\u7D9A\u30C6\u30B9\u30C8 + Redis\u758E\u901A\u78BA\u8A8D"), style: { padding: "6px 16px", borderRadius: 6, background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", fontSize: 12, cursor: "pointer" } }, "\u{1F50D} \u63A5\u7D9A\u30C6\u30B9\u30C8"))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u30FB\u30EA\u30B9\u30C8\u30A2"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "14px", background: "#f8fafc", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 } }, "\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 8 } }, "\u5168\u8A2D\u5B9A\u3092JSON\u5F62\u5F0F\u3067\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\uFF08\u6A5F\u5BC6\u5024\u306F\u30CF\u30C3\u30B7\u30E5\u5316\uFF09"), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u8A2D\u5B9A\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8", "cdx-settings-20260506.json"), style: { padding: "5px 12px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "\u{1F4E4} \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8")), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "14px", background: "#f8fafc", borderRadius: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 } }, "\u30A4\u30F3\u30DD\u30FC\u30C8"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 8 } }, "JSON\u30D5\u30A1\u30A4\u30EB\u304B\u3089\u8A2D\u5B9A\u3092\u5FA9\u5143\uFF08\u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3\u5B9F\u884C\u5F8C\u306B\u9069\u7528\uFF09"), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u8A2D\u5B9A\u30A4\u30F3\u30DD\u30FC\u30C8", "\u30D5\u30A1\u30A4\u30EB\u9078\u629E\u5F85\u3061"), style: { padding: "5px 12px", borderRadius: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" } }, "\u{1F4E5} \u30A4\u30F3\u30DD\u30FC\u30C8"))))), activeTab === "health" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 } }, [
    __spreadProps(__spreadValues({ name: "PostgreSQL" }, healthData.postgres), { icon: "\u{1F418}" }),
    __spreadProps(__spreadValues({ name: "Redis" }, healthData.redis), { icon: "\u{1F534}" }),
    __spreadProps(__spreadValues({ name: "MinIO / S3" }, healthData.minio), { icon: "\u{1FAA3}" }),
    __spreadProps(__spreadValues({ name: "Prometheus" }, healthData.prometheus), { icon: "\u{1F4CA}" })
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, s.icon), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, s.name), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: s.status === "ok" ? "#22c55e" : "#ef4444" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: s.status === "ok" ? "#22c55e" : "#ef4444" } }), s.status === "ok" ? "\u6B63\u5E38" : "\u7570\u5E38")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" } }, /* @__PURE__ */ React.createElement("span", null, "\u5FDC\u7B54\u6642\u9593"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: s.responseMs < 10 ? "#22c55e" : s.responseMs < 50 ? "#f59e0b" : "#ef4444" } }, s.responseMs, "ms")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 4 } }, /* @__PURE__ */ React.createElement("span", null, "\u7A3C\u50CD\u6642\u9593"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500 } }, s.uptime))))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "cdx-server \u30EA\u30BD\u30FC\u30B9\u4F7F\u7528\u72B6\u6CC1"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 } }, [
    { label: "CPU", val: healthData.server.cpu },
    { label: "\u30E1\u30E2\u30EA", val: healthData.server.mem },
    { label: "\u30C7\u30A3\u30B9\u30AF", val: healthData.server.disk }
  ].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#475569" } }, r.label), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: usageColor(r.val) } }, r.val, "%")), /* @__PURE__ */ React.createElement("div", { style: { height: 10, background: "#f1f5f9", borderRadius: 5 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: r.val + "%", background: usageColor(r.val), borderRadius: 5, transition: "width 500ms" } }))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#94a3b8" } }, /* @__PURE__ */ React.createElement("span", null, "PID: ", healthData.server.pid), /* @__PURE__ */ React.createElement("span", null, "\u7A3C\u50CD: ", healthData.server.uptime), /* @__PURE__ */ React.createElement("span", null, "\u30EF\u30FC\u30AB\u30FC: 4")))), activeTab === "users" && /* @__PURE__ */ React.createElement("div", null, userDetail && (() => {
    const u = users.find((x) => x.id === userDetail);
    if (!u) return null;
    const role = ROLES.find((r) => r.id === u.role);
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setUserDetail(null), style: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 } }, "\u2190 \u30E6\u30FC\u30B6\u30FC\u4E00\u89A7\u3078\u623B\u308B"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 48, height: 48, borderRadius: "50%", background: roleColor(u.role) + "20", color: roleColor(u.role), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 } }, u.displayName[0]), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "#0f172a" } }, u.displayName), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#94a3b8" } }, "@", u.username)), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 11, padding: "3px 10px", borderRadius: 6, background: u.status === "active" ? "#f0fdf4" : "#f8fafc", color: u.status === "active" ? "#22c55e" : "#94a3b8", fontWeight: 600 } }, u.status === "active" ? "\u6709\u52B9" : "\u7121\u52B9")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("tbody", null, [["\u30E6\u30FC\u30B6\u30FCID", u.id], ["\u30E6\u30FC\u30B6\u30FC\u540D", u.username], ["\u8868\u793A\u540D", u.displayName], ["\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9", u.email], ["\u30ED\u30FC\u30EB", roleLabel(u.role)], ["MFA", u.mfa ? "\u6709\u52B9" : "\u672A\u8A2D\u5B9A"], ["\u4F5C\u6210\u65E5", u.createdAt], ["\u6700\u7D42\u30ED\u30B0\u30A4\u30F3", u.lastLogin], ["\u30ED\u30B0\u30A4\u30F3\u56DE\u6570", u.loginCount + "\u56DE"]].map(([k, v], i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { borderBottom: "1px solid #f8fafc" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", color: "#94a3b8", fontWeight: 500, width: 130, fontSize: 12 } }, k), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", color: k === "\u30ED\u30FC\u30EB" ? roleColor(u.role) : k === "MFA" ? u.mfa ? "#22c55e" : "#f59e0b" : "#0f172a", fontWeight: k === "\u30ED\u30FC\u30EB" || k === "MFA" ? 600 : 400, fontSize: 12 } }, v))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setEditingUser(u.id);
      setUserDetail(null);
    }, style: { padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" } }, "\u7DE8\u96C6"), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8", u.username), style: { padding: "6px 14px", borderRadius: 6, background: "#fff", color: "#f59e0b", border: "1px solid #fde68a", fontSize: 11, cursor: "pointer" } }, "\u30D1\u30B9\u30EF\u30FC\u30C9\u30EA\u30BB\u30C3\u30C8"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      const nu = users.map((x) => x.id === u.id ? __spreadProps(__spreadValues({}, x), { mfa: !x.mfa }) : x);
      setUsers(nu);
      executeAction(u.mfa ? "MFA\u7121\u52B9\u5316" : "MFA\u6709\u52B9\u5316", u.username);
    }, style: { padding: "6px 14px", borderRadius: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" } }, u.mfa ? "MFA\u7121\u52B9\u5316" : "MFA\u6709\u52B9\u5316"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      const nu = users.map((x) => x.id === u.id ? __spreadProps(__spreadValues({}, x), { status: x.status === "active" ? "disabled" : "active" }) : x);
      setUsers(nu);
      executeAction(u.status === "active" ? "\u30A2\u30AB\u30A6\u30F3\u30C8\u7121\u52B9\u5316" : "\u30A2\u30AB\u30A6\u30F3\u30C8\u6709\u52B9\u5316", u.username);
    }, style: { padding: "6px 14px", borderRadius: 6, background: "#fff", color: u.status === "active" ? "#dc2626" : "#22c55e", border: `1px solid ${u.status === "active" ? "#fecaca" : "#bbf7d0"}`, fontSize: 11, cursor: "pointer" } }, u.status === "active" ? "\u7121\u52B9\u5316" : "\u6709\u52B9\u5316"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30ED\u30FC\u30EB\u6A29\u9650: ", role == null ? void 0 : role.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#64748b", marginBottom: 10 } }, role == null ? void 0 : role.desc), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, role == null ? void 0 : role.permissions.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: roleColor(u.role), flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#475569" } }, p))))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30ED\u30B0\u30A4\u30F3\u5C65\u6B74 (\u76F4\u8FD1)"), [
      { at: u.lastLogin, ip: "192.168.1.5", result: "\u6210\u529F" },
      { at: "2026-05-05 17:30", ip: "192.168.1.5", result: "\u6210\u529F" },
      { at: "2026-05-05 08:45", ip: "192.168.1.5", result: "\u6210\u529F" },
      { at: "2026-05-04 09:00", ip: "192.168.2.10", result: "\u6210\u529F" },
      { at: "2026-05-03 14:20", ip: "10.0.1.50", result: "\u5931\u6557 (\u30D1\u30B9\u30EF\u30FC\u30C9\u4E0D\u4E00\u81F4)" }
    ].map((h, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 11 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "50%", background: h.result === "\u6210\u529F" ? "#22c55e" : "#ef4444", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", width: 120 } }, h.at), /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b" } }, h.ip), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 10, fontWeight: 500, color: h.result === "\u6210\u529F" ? "#22c55e" : "#ef4444" } }, h.result)))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u64CD\u4F5C\u5C65\u6B74 (\u76F4\u8FD1)"), AUDIT_LOG.filter((a) => a.actor === u.username).slice(0, 5).map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 11 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", width: 120 } }, a.at), /* @__PURE__ */ React.createElement("code", { style: { fontSize: 10, background: "#f1f5f9", padding: "1px 5px", borderRadius: 3, color: "#475569" } }, a.action), /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, a.detail))), AUDIT_LOG.filter((a) => a.actor === u.username).length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#94a3b8" } }, "\u64CD\u4F5C\u5C65\u6B74\u306A\u3057")))));
  })(), editingUser && !userDetail && (() => {
    const u = users.find((x) => x.id === editingUser);
    if (!u) return null;
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setEditingUser(null), style: { background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 } }, "\u2190 \u30E6\u30FC\u30B6\u30FC\u4E00\u89A7\u3078\u623B\u308B"), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { maxWidth: 600 }) }, /* @__PURE__ */ React.createElement("h3", { style: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" } }, "\u30E6\u30FC\u30B6\u30FC\u7DE8\u96C6: ", u.displayName), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, [
      { label: "\u30E6\u30FC\u30B6\u30FC\u540D", key: "username", type: "text", disabled: true },
      { label: "\u8868\u793A\u540D", key: "displayName", type: "text" },
      { label: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9", key: "email", type: "email" }
    ].map((f) => /* @__PURE__ */ React.createElement("div", { key: f.key }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, f.label), /* @__PURE__ */ React.createElement("input", { type: f.type, defaultValue: u[f.key], disabled: f.disabled, onChange: (e) => {
      const nu = users.map((x) => x.id === u.id ? __spreadProps(__spreadValues({}, x), { [f.key]: e.target.value }) : x);
      setUsers(nu);
    }, style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: f.disabled ? "#94a3b8" : "#0f172a", background: f.disabled ? "#f8fafc" : "#fff", boxSizing: "border-box" } }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u30ED\u30FC\u30EB"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, ROLES.map((r) => /* @__PURE__ */ React.createElement("button", { key: r.id, onClick: () => {
      const nu = users.map((x) => x.id === u.id ? __spreadProps(__spreadValues({}, x), { role: r.id }) : x);
      setUsers(nu);
    }, style: { flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${u.role === r.id ? r.color : "#e2e8f0"}`, cursor: "pointer", background: u.role === r.id ? r.color + "10" : "#fff", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: r.color } }, r.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#94a3b8", marginTop: 2 } }, r.desc.split("\u3002")[0]))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u65B0\u3057\u3044\u30D1\u30B9\u30EF\u30FC\u30C9\uFF08\u5909\u66F4\u3059\u308B\u5834\u5408\u306E\u307F\uFF09"), /* @__PURE__ */ React.createElement("input", { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 4 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      executeAction("\u30E6\u30FC\u30B6\u30FC\u66F4\u65B0", u.username);
      setEditingUser(null);
    }, style: { padding: "8px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "\u4FDD\u5B58"), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditingUser(null), style: { padding: "8px 16px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" } }, "\u30AD\u30E3\u30F3\u30BB\u30EB")))));
  })(), showNewUser && !editingUser && !userDetail && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginBottom: 16, background: "#eff6ff", border: "1px solid #bfdbfe" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#2563eb", marginBottom: 12 } }, "\u65B0\u898F\u30E6\u30FC\u30B6\u30FC\u4F5C\u6210"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u30E6\u30FC\u30B6\u30FC\u540D *"), /* @__PURE__ */ React.createElement("input", { type: "text", value: newUser.username, onChange: (e) => setNewUser((p) => __spreadProps(__spreadValues({}, p), { username: e.target.value })), placeholder: "\u4F8B: nakamura", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u8868\u793A\u540D *"), /* @__PURE__ */ React.createElement("input", { type: "text", value: newUser.displayName, onChange: (e) => setNewUser((p) => __spreadProps(__spreadValues({}, p), { displayName: e.target.value })), placeholder: "\u4F8B: \u4E2D\u6751 \u4E09\u90CE", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9 *"), /* @__PURE__ */ React.createElement("input", { type: "email", value: newUser.email, onChange: (e) => setNewUser((p) => __spreadProps(__spreadValues({}, p), { email: e.target.value })), placeholder: "\u4F8B: nakamura@construction-dx.local", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 } }, "\u521D\u671F\u30D1\u30B9\u30EF\u30FC\u30C9 *"), /* @__PURE__ */ React.createElement("input", { type: "password", value: newUser.password, onChange: (e) => setNewUser((p) => __spreadProps(__spreadValues({}, p), { password: e.target.value })), placeholder: "8\u6587\u5B57\u4EE5\u4E0A", style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" } }))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 } }, "\u30ED\u30FC\u30EB"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, ROLES.map((r) => /* @__PURE__ */ React.createElement("button", { key: r.id, onClick: () => setNewUser((p) => __spreadProps(__spreadValues({}, p), { role: r.id })), style: { flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${newUser.role === r.id ? r.color : "#e2e8f0"}`, cursor: "pointer", background: newUser.role === r.id ? r.color + "10" : "#fff", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: r.color } }, r.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, color: "#94a3b8", marginTop: 2 } }, r.desc.split("\u3002")[0]))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 14 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    if (!newUser.username || !newUser.displayName || !newUser.email || !newUser.password) return;
    const u = __spreadProps(__spreadValues({ id: "usr-" + Date.now() }, newUser), { status: "active", lastLogin: "\u2014", createdAt: "2026-05-06", mfa: false, loginCount: 0 });
    setUsers((prev) => [...prev, u]);
    executeAction("\u30E6\u30FC\u30B6\u30FC\u4F5C\u6210", u.username + " (" + roleLabel(u.role) + ")");
    setShowNewUser(false);
    setNewUser({ username: "", displayName: "", email: "", role: "viewer", password: "" });
  }, disabled: !newUser.username || !newUser.displayName || !newUser.email || !newUser.password, style: { padding: "8px 20px", borderRadius: 8, background: newUser.username && newUser.displayName && newUser.email && newUser.password ? "#2563eb" : "#e2e8f0", color: newUser.username && newUser.displayName && newUser.email && newUser.password ? "#fff" : "#94a3b8", border: "none", fontSize: 12, fontWeight: 600, cursor: newUser.username ? "pointer" : "not-allowed" } }, "\u4F5C\u6210"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNewUser(false), style: { padding: "8px 16px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" } }, "\u30AD\u30E3\u30F3\u30BB\u30EB"))), !editingUser && !userDetail && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a" } }, "\u30ED\u30B0\u30A4\u30F3\u30E6\u30FC\u30B6\u30FC (", users.length, ")"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#94a3b8" } }, "\u6709\u52B9: ", users.filter((u) => u.status === "active").length, " / \u7121\u52B9: ", users.filter((u) => u.status === "disabled").length)), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowNewUser(!showNewUser), style: { padding: "6px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "+ \u65B0\u898F\u30E6\u30FC\u30B6\u30FC")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 } }, ROLES.map((r) => {
    const count = users.filter((u) => u.role === r.id).length;
    return /* @__PURE__ */ React.createElement("div", { key: r.id, style: __spreadProps(__spreadValues({}, cardStyle), { borderLeft: `3px solid ${r.color}` }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: r.color } }, r.label), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18, fontWeight: 700, color: r.color } }, count)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", lineHeight: 1.4 } }, r.desc));
  })), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, ["", "\u30E6\u30FC\u30B6\u30FC\u540D", "\u8868\u793A\u540D", "\u30E1\u30FC\u30EB", "\u30ED\u30FC\u30EB", "MFA", "\u72B6\u614B", "\u6700\u7D42\u30ED\u30B0\u30A4\u30F3", "\u30ED\u30B0\u30A4\u30F3\u6570", "\u64CD\u4F5C"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: thStyle }, h)))), /* @__PURE__ */ React.createElement("tbody", null, users.map((u) => /* @__PURE__ */ React.createElement("tr", { key: u.id, style: { borderTop: "1px solid #f1f5f9", background: u.status === "disabled" ? "#fafafa" : "", opacity: u.status === "disabled" ? 0.6 : 1 } }, /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { width: 32 }) }, /* @__PURE__ */ React.createElement("div", { style: { width: 28, height: 28, borderRadius: "50%", background: roleColor(u.role) + "20", color: roleColor(u.role), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 } }, u.displayName[0])), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#2563eb", fontWeight: 500, cursor: "pointer" }), onClick: () => setUserDetail(u.id) }, u.username), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#0f172a" }) }, u.displayName), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#64748b", fontSize: 11 }) }, u.email), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: roleColor(u.role) + "15", color: roleColor(u.role) } }, roleLabel(u.role))), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 500, color: u.mfa ? "#22c55e" : "#f59e0b" } }, u.mfa ? "\u2713 \u6709\u52B9" : "\u2014 \u672A\u8A2D\u5B9A")), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: u.status === "active" ? "#f0fdf4" : "#f8fafc", color: u.status === "active" ? "#22c55e" : "#94a3b8" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: u.status === "active" ? "#22c55e" : "#94a3b8" } }), u.status === "active" ? "\u6709\u52B9" : "\u7121\u52B9")), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#94a3b8", fontSize: 11 }) }, u.lastLogin), /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569", fontSize: 11 }) }, u.loginCount), /* @__PURE__ */ React.createElement("td", { style: tdStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 3 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setUserDetail(u.id), title: "\u8A73\u7D30", style: { padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb" } }, "\u8A73\u7D30"), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditingUser(u.id), title: "\u7DE8\u96C6", style: { padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" } }, "\u7DE8\u96C6"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const nu = users.map((x) => x.id === u.id ? __spreadProps(__spreadValues({}, x), { status: x.status === "active" ? "disabled" : "active" }) : x);
    setUsers(nu);
    executeAction(u.status === "active" ? "\u7121\u52B9\u5316" : "\u6709\u52B9\u5316", u.username);
  }, title: u.status === "active" ? "\u7121\u52B9\u5316" : "\u6709\u52B9\u5316", style: { padding: "2px 6px", borderRadius: 4, border: `1px solid ${u.status === "active" ? "#fecaca" : "#bbf7d0"}`, fontSize: 10, cursor: "pointer", background: "#fff", color: u.status === "active" ? "#dc2626" : "#22c55e" } }, u.status === "active" ? "\u7121\u52B9" : "\u6709\u52B9")))))))))), activeTab === "auth" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u8A8D\u8A3C\u30D0\u30C3\u30AF\u30A8\u30F3\u30C9"), [{ k: "AUTH_BACKEND", v: "basic", desc: "\u8A8D\u8A3C\u65B9\u5F0F (basic / oidc)" }, { k: "OIDC \u5BFE\u5FDC", v: "\u6E96\u5099\u6E08", desc: "AUTH_BACKEND=oidc \u3067\u5207\u66FF\u53EF\u80FD" }, { k: "Admin\u8A8D\u8A3C", v: "HTTP Basic Auth", desc: "CDX_ADMIN_TOKEN \u5B9A\u6570\u6642\u9593\u6BD4\u8F03" }, { k: "\u30C7\u30D0\u30A4\u30B9\u8A8D\u8A3C", v: "HMAC-SHA256", desc: "\u5171\u6709\u9375 + timestamp bucket" }, { k: "\u767B\u9332\u8A8D\u8A3C", v: "Bearer Token", desc: "closed-by-default" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { padding: "8px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#475569", fontWeight: 500 } }, r.k), /* @__PURE__ */ React.createElement("span", { style: { color: "#2563eb", fontWeight: 600 } }, r.v)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 2 } }, r.desc))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "12px", background: "#f8fafc", borderRadius: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 } }, "\u30C8\u30FC\u30AF\u30F3\u30ED\u30FC\u30C6\u30FC\u30B7\u30E7\u30F3"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30C8\u30FC\u30AF\u30F3\u518D\u751F\u6210", "CDX_REGISTRATION_TOKEN"), style: { padding: "5px 12px", borderRadius: 6, background: "#fff", color: "#f59e0b", border: "1px solid #fde68a", fontSize: 10, cursor: "pointer", fontWeight: 600 } }, "\u{1F504} REGISTRATION_TOKEN"), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30C8\u30FC\u30AF\u30F3\u518D\u751F\u6210", "CDX_ADMIN_TOKEN"), style: { padding: "5px 12px", borderRadius: 6, background: "#fff", color: "#f59e0b", border: "1px solid #fde68a", fontSize: 10, cursor: "pointer", fontWeight: 600 } }, "\u{1F504} ADMIN_TOKEN")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 6 } }, "\u26A0 \u518D\u751F\u6210\u5F8C\u306F\u5168\u7AEF\u672B\u30FB\u7BA1\u7406\u8005\u306B\u65B0\u30C8\u30FC\u30AF\u30F3\u3092\u914D\u5E03\u3057\u3066\u304F\u3060\u3055\u3044"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30A2\u30AF\u30C6\u30A3\u30D6\u30BB\u30C3\u30B7\u30E7\u30F3"), ACTIVE_SESSIONS.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: s.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < ACTIVE_SESSIONS.length - 1 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "#22c55e" } }), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 500, color: "#0f172a" } }, s.user, " ", /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", fontWeight: 400 } }, "(", s.ip, ")")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8" } }, s.browser, " \xB7 \u958B\u59CB: ", s.startedAt, " \xB7 \u6700\u7D42: ", s.lastActive)), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u30BB\u30C3\u30B7\u30E7\u30F3\u7D42\u4E86", s.user + " (" + s.id + ")"), style: { padding: "3px 10px", borderRadius: 5, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626" } }, "\u5207\u65AD")))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30EC\u30FC\u30C8\u5236\u9650"), [{ e: "heartbeat", l: "10/min" }, { e: "inventory", l: "3/h" }, { e: "register", l: "5/min" }, { e: "policy", l: "10/min" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("code", { style: { color: "#475569", fontWeight: 500, width: 80 } }, r.e), /* @__PURE__ */ React.createElement("span", { style: { color: "#2563eb", fontWeight: 600 } }, r.l), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 10, color: "#94a3b8" } }, "Redis sliding-window")))))), activeTab === "domain" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    padding: "10px 16px",
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 20
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 18 } }, "\u{1F4A1}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#1d4ed8" } }, "\u3053\u3053\u3067\u8A2D\u5B9A\u3057\u305FAD\u30C9\u30E1\u30A4\u30F3\u306F", /* @__PURE__ */ React.createElement("strong", null, "\u30B0\u30ED\u30FC\u30D0\u30EB\u30C7\u30D5\u30A9\u30EB\u30C8"), "\u3068\u3057\u3066\u6A5F\u80FD\u3057\u307E\u3059\u3002", /* @__PURE__ */ React.createElement("strong", null, "OS\u30FB\u8A8D\u8A3C\u8A2D\u5B9A"), "\u3067\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u500B\u5225\u306B\u30AA\u30FC\u30D0\u30FC\u30E9\u30A4\u30C9\u3067\u304D\u307E\u3059\uFF08\u7A7A\u6B04\u306E\u5834\u5408\u306F\u3053\u3053\u306E\u5024\u3092\u7D99\u627F\uFF09\u3002")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 } }, "\u{1F3E2} Active Directory \u30B0\u30ED\u30FC\u30D0\u30EB\u8A2D\u5B9A"), /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => setDomain("enabled", !domainConfig.enabled),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        padding: "4px 12px",
        borderRadius: 20,
        background: domainConfig.enabled ? "#f0fdf4" : "#f8fafc",
        border: `1px solid ${domainConfig.enabled ? "#bbf7d0" : "#e2e8f0"}`
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      width: 32,
      height: 18,
      borderRadius: 9,
      background: domainConfig.enabled ? "#22c55e" : "#e2e8f0",
      position: "relative",
      transition: "background 200ms"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      top: 2,
      left: domainConfig.enabled ? 16 : 2,
      width: 14,
      height: 14,
      borderRadius: "50%",
      background: "#fff",
      transition: "left 200ms",
      boxShadow: "0 1px 2px rgba(0,0,0,.2)"
    } })),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: domainConfig.enabled ? "#16a34a" : "#94a3b8" } }, domainConfig.enabled ? "AD \u53C2\u52A0\u6709\u52B9" : "AD \u53C2\u52A0\u7121\u52B9")
  )), domainConfig.enabled ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#f0fdf4",
    borderRadius: 10,
    padding: "12px 14px",
    border: "2px solid #22c55e"
  } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 700, color: "#15803d", display: "block", marginBottom: 6 } }, "\u{1F310} AD\u30C9\u30E1\u30A4\u30F3\u540D\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8\uFF09 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: domainConfig.domain,
      onChange: (e) => setDomain("domain", e.target.value),
      placeholder: "\u4F8B: mirai.local",
      style: {
        width: "100%",
        padding: "9px 12px",
        borderRadius: 8,
        border: "1px solid #86efac",
        fontSize: 14,
        fontWeight: 600,
        outline: "none",
        color: "#0f172a",
        background: "#fff"
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#16a34a", marginTop: 4 } }, "FQDN\u5F62\u5F0F\u3002OS\u30FB\u8A8D\u8A3C\u8A2D\u5B9A\u3067\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u500B\u5225\u306B\u30AA\u30FC\u30D0\u30FC\u30E9\u30A4\u30C9\u3067\u304D\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "NetBIOS \u30C9\u30E1\u30A4\u30F3\u540D"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: domainConfig.netbiosName,
      onChange: (e) => setDomain("netbiosName", e.target.value.toUpperCase()),
      placeholder: "\u4F8B: MIRAI",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 2 } }, "Windows NT\u4E92\u63DB\u306E\u30C9\u30E1\u30A4\u30F3\u77ED\u7E2E\u540D\uFF08\u5927\u6587\u5B57\uFF09\u3002CORP\\username \u5F62\u5F0F\u306B\u4F7F\u7528\u3002")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "Kerberos \u30EC\u30EB\u30E0"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: domainConfig.kerberosRealm,
      onChange: (e) => setDomain("kerberosRealm", e.target.value.toUpperCase()),
      placeholder: "\u4F8B: MIRAI.LOCAL",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "LDAP \u30D9\u30FC\u30B9 DN"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: domainConfig.ldapBaseDn,
      onChange: (e) => setDomain("ldapBaseDn", e.target.value),
      placeholder: "\u4F8B: DC=mirai,DC=local",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  ))) : /* @__PURE__ */ React.createElement("div", { style: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: "16px",
    fontSize: 12,
    color: "#64748b",
    textAlign: "center"
  } }, "\u{1F513} AD\u53C2\u52A0\u3092\u7121\u52B9\u5316\u3057\u3066\u3044\u307E\u3059\u3002", /* @__PURE__ */ React.createElement("br", null), "\u5168\u7AEF\u672B\u306F\u30ED\u30FC\u30AB\u30EB\u8A8D\u8A3C\u3067\u904B\u7528\u3055\u308C\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u{1F5A5}\uFE0F \u30C9\u30E1\u30A4\u30F3\u30B3\u30F3\u30C8\u30ED\u30FC\u30E9"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30D7\u30E9\u30A4\u30DE\u30EA DC (IP / FQDN) ", /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: domainConfig.dcHost,
      onChange: (e) => setDomain("dcHost", e.target.value),
      placeholder: "\u4F8B: 192.168.1.10",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7 DC (\u4EFB\u610F)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: domainConfig.dcBackup,
      onChange: (e) => setDomain("dcBackup", e.target.value),
      placeholder: "\u4F8B: 192.168.1.11",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "DC\u758E\u901A\u30C6\u30B9\u30C8"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setAdTestResult("testing");
        setTimeout(() => setAdTestResult(domainConfig.dcHost ? "ok" : "error"), 1500);
      },
      style: {
        padding: "6px 16px",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        background: "#fff",
        fontSize: 12,
        cursor: "pointer",
        color: "#2563eb"
      }
    },
    "\u{1F50D} LDAP ping \u30C6\u30B9\u30C8"
  ), adTestResult === "testing" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#3b82f6", marginLeft: 8 } }, "\u30C6\u30B9\u30C8\u4E2D..."), adTestResult === "ok" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#22c55e", marginLeft: 8, fontWeight: 600 } }, "\u2705 \u63A5\u7D9A\u6210\u529F"), adTestResult === "error" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#ef4444", marginLeft: 8, fontWeight: 600 } }, "\u274C \u63A5\u7D9A\u5931\u6557")))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u{1F511} \u30C9\u30E1\u30A4\u30F3\u53C2\u52A0\u30A2\u30AB\u30A6\u30F3\u30C8"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "AD \u53C2\u52A0\u30E6\u30FC\u30B6\u30FC\u540D ", /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: domainConfig.joinUser,
      onChange: (e) => setDomain("joinUser", e.target.value),
      placeholder: "\u4F8B: svc-domainjoin",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 2 } }, "\u6700\u5C0F\u6A29\u9650 SVC\uFF08\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u53C2\u52A0\u306E\u307F\u53EF\uFF09\u3092\u63A8\u5968")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30D1\u30B9\u30EF\u30FC\u30C9"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: showAdPassword ? "text" : "password",
      value: domainConfig.joinPassword,
      onChange: (e) => setDomain("joinPassword", e.target.value),
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      style: { flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowAdPassword(!showAdPassword),
      style: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12 }
    },
    showAdPassword ? "\u{1F648}" : "\u{1F441}\uFE0F"
  )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 2 } }, "\u30D1\u30B9\u30EF\u30FC\u30C9\u306FAES-256\u3067\u6697\u53F7\u5316\u3057\u3066\u4FDD\u7BA1\u3055\u308C\u307E\u3059"))))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { gridColumn: "1 / -1" }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 14 } }, "\u{1F3F7}\uFE0F \u30C7\u30D5\u30A9\u30EB\u30C8\u8A2D\u5B9A"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30C7\u30D5\u30A9\u30EB\u30C8 OU \u30D1\u30B9"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: domainConfig.defaultOu,
      onChange: (e) => setDomain("defaultOu", e.target.value),
      placeholder: "\u4F8B: OU=Workstations,DC=mirai,DC=local",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8", marginTop: 2 } }, "OS\u30FB\u8A8D\u8A3C\u8A2D\u5B9A\u3067\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225\u306B\u4E0A\u66F8\u304D\u53EF\u80FD")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30C9\u30E1\u30A4\u30F3\u30ED\u30B0\u30A4\u30F3\u5F62\u5F0F"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: domainConfig.loginFormat,
      onChange: (e) => setDomain("loginFormat", e.target.value),
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "sam" }, "SAM \u30A2\u30AB\u30A6\u30F3\u30C8\u540D\uFF08tanaka\uFF09"),
    /* @__PURE__ */ React.createElement("option", { value: "upn" }, "UPN \u5F62\u5F0F\uFF08tanaka@mirai.local\uFF09"),
    /* @__PURE__ */ React.createElement("option", { value: "netbios" }, "NetBIOS \u5F62\u5F0F\uFF08MIRAI\\tanaka\uFF09")
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "AD \u540C\u671F\u9593\u9694\uFF08\u5206\uFF09"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: domainConfig.syncInterval,
      onChange: (e) => setDomain("syncInterval", Number(e.target.value)),
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }
    },
    /* @__PURE__ */ React.createElement("option", { value: 15 }, "15 \u5206"),
    /* @__PURE__ */ React.createElement("option", { value: 30 }, "30 \u5206"),
    /* @__PURE__ */ React.createElement("option", { value: 60 }, "60 \u5206\uFF08\u63A8\u5968\uFF09"),
    /* @__PURE__ */ React.createElement("option", { value: 120 }, "120 \u5206")
  ))), domainConfig.enabled && domainConfig.domain && /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 14,
    background: "#f0fdf4",
    borderRadius: 8,
    padding: "10px 14px",
    border: "1px solid #bbf7d0",
    fontSize: 11
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, color: "#15803d", marginBottom: 4 } }, "\u2705 \u30B0\u30ED\u30FC\u30D0\u30EB AD \u8A2D\u5B9A\u30B5\u30DE\u30EA\u30FC"), /* @__PURE__ */ React.createElement("div", { style: { color: "#166534", display: "flex", flexWrap: "wrap", gap: "4px 20px" } }, /* @__PURE__ */ React.createElement("span", null, "\u30C9\u30E1\u30A4\u30F3: ", /* @__PURE__ */ React.createElement("strong", null, domainConfig.domain)), /* @__PURE__ */ React.createElement("span", null, "NetBIOS: ", /* @__PURE__ */ React.createElement("strong", null, domainConfig.netbiosName)), /* @__PURE__ */ React.createElement("span", null, "DC: ", /* @__PURE__ */ React.createElement("strong", null, domainConfig.dcHost || "\u672A\u8A2D\u5B9A")), /* @__PURE__ */ React.createElement("span", null, "\u53C2\u52A0SVC: ", /* @__PURE__ */ React.createElement("strong", null, domainConfig.joinUser || "\u672A\u8A2D\u5B9A")), /* @__PURE__ */ React.createElement("span", null, "\u30ED\u30B0\u30A4\u30F3\u5F62\u5F0F: ", /* @__PURE__ */ React.createElement("strong", null, domainConfig.loginFormat === "sam" ? "SAM" : domainConfig.loginFormat === "upn" ? "UPN" : "NetBIOS")))), /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 12,
    background: "#fffbeb",
    borderRadius: 8,
    padding: "8px 12px",
    border: "1px solid #fde68a",
    fontSize: 11,
    color: "#92400e"
  } }, /* @__PURE__ */ React.createElement("strong", null, "\u{1F4CC} \u7D99\u627F\u30EB\u30FC\u30EB:"), " OS\u30FB\u8A8D\u8A3C\u8A2D\u5B9A\u3067AD\u30C9\u30E1\u30A4\u30F3\u540D\u3092\u7A7A\u6B04\u306B\u3059\u308B\u3068\u3001\u3053\u306E\u30B0\u30ED\u30FC\u30D0\u30EB\u8A2D\u5B9A\u300C", /* @__PURE__ */ React.createElement("strong", null, domainConfig.domain), "\u300D\u304C\u81EA\u52D5\u9069\u7528\u3055\u308C\u307E\u3059\u3002 \u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u5225\u306B\u5225\u30C9\u30E1\u30A4\u30F3\u3092\u4F7F\u3046\u5834\u5408\u306FOS\u30FB\u8A8D\u8A3C\u8A2D\u5B9A\u3067\u500B\u5225\u306B\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002"), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, display: "flex", gap: 10, alignItems: "center" } }, domainConfig.adSaved && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "#16a34a", fontWeight: 500 } }, "\u2705 \u4FDD\u5B58\u3057\u307E\u3057\u305F"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setDomainConfig((prev) => __spreadProps(__spreadValues({}, prev), { adSaved: true }));
        executeAction("AD\u30C9\u30E1\u30A4\u30F3\u8A2D\u5B9A\u4FDD\u5B58", domainConfig.domain);
        setTimeout(() => setDomainConfig((prev) => __spreadProps(__spreadValues({}, prev), { adSaved: false })), 3e3);
      },
      style: {
        padding: "8px 20px",
        borderRadius: 8,
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontSize: 12,
        cursor: "pointer",
        fontWeight: 600
      }
    },
    "\u{1F4BE} AD\u8A2D\u5B9A\u3092\u4FDD\u5B58"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setDomainConfig((prev) => __spreadProps(__spreadValues({}, prev), {
        domain: "mirai.local",
        netbiosName: "MIRAI",
        kerberosRealm: "MIRAI.LOCAL",
        ldapBaseDn: "DC=mirai,DC=local",
        defaultOu: "OU=Workstations,DC=mirai,DC=local",
        loginFormat: "sam"
      })),
      style: {
        padding: "8px 16px",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        background: "#fff",
        fontSize: 12,
        cursor: "pointer",
        color: "#64748b"
      }
    },
    "\u{1F504} \u30C7\u30D5\u30A9\u30EB\u30C8\u306B\u30EA\u30BB\u30C3\u30C8 (mirai.local)"
  ))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { gridColumn: "1 / -1", marginTop: 4 }) }, /* @__PURE__ */ React.createElement("div", { style: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    borderRadius: 8,
    padding: "8px 14px",
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 16
  } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, lineHeight: 1.4 } }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#92400e" } }, /* @__PURE__ */ React.createElement("strong", null, "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u63A8\u5968:"), " AD\u30AF\u30A8\u30EA\u306B\u306F Domain Admin \u3067\u306F\u306A\u304F", /* @__PURE__ */ React.createElement("code", { style: { background: "#fde68a", padding: "0 4px", borderRadius: 3, fontFamily: "monospace" } }, "CN=svc-ldapread"), "\u306A\u3069\u306E", /* @__PURE__ */ React.createElement("strong", null, "\u8AAD\u307F\u53D6\u308A\u5C02\u7528\u30B5\u30FC\u30D3\u30B9\u30A2\u30AB\u30A6\u30F3\u30C8"), "\u306E\u4F7F\u7528\u3092\u63A8\u5968\u3057\u307E\u3059\u3002 \u30D1\u30B9\u30EF\u30FC\u30C9\u306F\u30BB\u30C3\u30B7\u30E7\u30F3\u4E2D\u306E\u307F\u4FDD\u6301\u3055\u308C\u3001\u30BD\u30FC\u30B9\u30B3\u30FC\u30C9\u306B\u306F\u8A18\u9332\u3055\u308C\u307E\u305B\u3093\u3002")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), " AD \u30E6\u30FC\u30B6\u30FC\u53C2\u7167\u30FB\u5272\u308A\u5F53\u3066", adBrowseStatus === "success" && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 500, color: "#16a34a", marginLeft: 4 } }, "\u2705 ", adUserList.length, "\u540D\u53D6\u5F97\u6E08\u307F")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginBottom: 14, alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "AD \u30DB\u30B9\u30C8\u540D / IP ", /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: adBrowse.host,
      onChange: (e) => setAdBrowse((p) => __spreadProps(__spreadValues({}, p), { host: e.target.value })),
      placeholder: "VMSV3001",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30E6\u30FC\u30B6\u30FC\u540D (UPN or SAM) ", /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444" } }, "*")), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: adBrowse.user,
      onChange: (e) => setAdBrowse((p) => __spreadProps(__spreadValues({}, p), { user: e.target.value })),
      placeholder: "administrator",
      style: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 } }, "\u30D1\u30B9\u30EF\u30FC\u30C9 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#ef4444" } }, "*")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: showAdPw ? "text" : "password",
      value: adBrowse.password,
      onChange: (e) => setAdBrowse((p) => __spreadProps(__spreadValues({}, p), { password: e.target.value })),
      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
      style: { flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowAdPw(!showAdPw),
      style: { padding: "8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12 }
    },
    showAdPw ? "\u{1F648}" : "\u{1F441}\uFE0F"
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleAdConnect,
      disabled: !adBrowse.host || !adBrowse.user || adBrowseStatus === "connecting",
      style: {
        padding: "8px 20px",
        borderRadius: 8,
        border: "none",
        background: adBrowseStatus === "connecting" ? "#93c5fd" : !adBrowse.host || !adBrowse.user ? "#e2e8f0" : "#2563eb",
        color: !adBrowse.host || !adBrowse.user ? "#94a3b8" : "#fff",
        fontSize: 12,
        cursor: "pointer",
        fontWeight: 600,
        whiteSpace: "nowrap"
      }
    },
    adBrowseStatus === "connecting" ? "\u23F3 \u63A5\u7D9A\u4E2D..." : "\u{1F50D} AD\u63A5\u7D9A & \u30E6\u30FC\u30B6\u30FC\u53D6\u5F97"
  )), adBrowseStatus === "error" && /* @__PURE__ */ React.createElement("div", { style: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#dc2626",
    marginBottom: 12
  } }, "\u274C AD \u3078\u306E\u63A5\u7D9A\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u30DB\u30B9\u30C8\u540D\u30FB\u8A8D\u8A3C\u60C5\u5831\u30FB\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u758E\u901A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"), adBrowseStatus === "success" && adUserList.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 10, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "\u6C0F\u540D / \u793E\u54E1\u756A\u53F7 / \u90E8\u7F72\u3067\u691C\u7D22...",
      value: adUserSearch,
      onChange: (e) => setAdUserSearch(e.target.value),
      style: { flex: 1, padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }
    }
  ), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: adOuFilter,
      onChange: (e) => setAdOuFilter(e.target.value),
      style: { padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }
    },
    adOus.map((ou) => /* @__PURE__ */ React.createElement("option", { key: ou, value: ou }, ou === "all" ? "\u5168OU" : ou))
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#64748b", whiteSpace: "nowrap" } }, "\u9078\u629E\u4E2D: ", /* @__PURE__ */ React.createElement("strong", { style: { color: "#2563eb" } }, selectedAdUsers.size), "\u540D"), selectedAdUsers.size > 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSelectedAdUsers(/* @__PURE__ */ new Set()),
      style: { fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }
    },
    "\u30AF\u30EA\u30A2"
  )), /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid #e8ecf1", borderRadius: 10, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#f8fafc" } }, /* @__PURE__ */ React.createElement("th", { style: __spreadProps(__spreadValues({}, thStyle), { width: 36 }) }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: filteredAdUsers.length > 0 && filteredAdUsers.every((u) => selectedAdUsers.has(u.sam)),
      onChange: (e) => {
        if (e.target.checked) filteredAdUsers.forEach((u) => setSelectedAdUsers((prev) => /* @__PURE__ */ new Set([...prev, u.sam])));
        else setSelectedAdUsers(/* @__PURE__ */ new Set());
      },
      style: { accentColor: "#2563eb" }
    }
  )), ["CN\uFF08\u6C0F\u540D\uFF09", "sAMAccountName\uFF08\u793E\u54E1\u756A\u53F7\uFF09", "\u90E8\u7F72", "\u5F79\u8077", "OU\uFF08\u6240\u5C5E\uFF09", "\u6700\u7D42\u30ED\u30B0\u30A4\u30F3", "\u72B6\u614B"].map((h) => /* @__PURE__ */ React.createElement("th", { key: h, style: __spreadProps(__spreadValues({}, thStyle), { fontSize: 10 }) }, h)))), /* @__PURE__ */ React.createElement("tbody", null, filteredAdUsers.map((u) => /* @__PURE__ */ React.createElement(
    "tr",
    {
      key: u.sam,
      onClick: () => toggleAdUser(u.sam),
      style: {
        borderTop: "1px solid #f1f5f9",
        cursor: "pointer",
        background: selectedAdUsers.has(u.sam) ? "#eff6ff" : "transparent"
      }
    },
    /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "center" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: selectedAdUsers.has(u.sam),
        onChange: () => toggleAdUser(u.sam),
        style: { accentColor: "#2563eb" },
        onClick: (e) => e.stopPropagation()
      }
    )),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontWeight: selectedAdUsers.has(u.sam) ? 600 : 400, color: "#0f172a" }) }, u.cn),
    /* @__PURE__ */ React.createElement("td", { style: __spreadValues({}, tdStyle) }, /* @__PURE__ */ React.createElement("code", { style: {
      fontSize: 11,
      padding: "2px 7px",
      borderRadius: 4,
      background: selectedAdUsers.has(u.sam) ? "#dbeafe" : "#f1f5f9",
      color: selectedAdUsers.has(u.sam) ? "#1d4ed8" : "#475569",
      fontWeight: 600
    } }, u.sam)),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#475569" }) }, u.dept),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { color: "#64748b", fontSize: 11 }) }, u.title),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 10, color: "#94a3b8" }) }, u.ou),
    /* @__PURE__ */ React.createElement("td", { style: __spreadProps(__spreadValues({}, tdStyle), { fontSize: 10, color: "#64748b" }) }, u.lastLogon),
    /* @__PURE__ */ React.createElement("td", { style: __spreadValues({}, tdStyle) }, /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 10,
      padding: "1px 7px",
      borderRadius: 10,
      fontWeight: 600,
      background: u.enabled ? "#f0fdf4" : "#f8fafc",
      color: u.enabled ? "#22c55e" : "#94a3b8"
    } }, u.enabled ? "\u6709\u52B9" : "\u7121\u52B9"))
  ))))), selectedAdUsers.size > 0 && /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 12,
    background: "#eff6ff",
    borderRadius: 10,
    padding: "12px 16px",
    border: "1px solid #bfdbfe"
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#1d4ed8", marginBottom: 8 } }, "\u2705 \u9078\u629E\u6E08\u307FAD\u30E6\u30FC\u30B6\u30FC (", selectedAdUsers.size, "\u540D)"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 } }, [...selectedAdUsers].map((sam) => {
    const u = AD_USERS_MOCK.find((x) => x.sam === sam);
    return u ? /* @__PURE__ */ React.createElement("span", { key: sam, style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      borderRadius: 14,
      background: "#dbeafe",
      color: "#1d4ed8",
      fontSize: 11,
      fontWeight: 500
    } }, u.cn, /* @__PURE__ */ React.createElement("code", { style: { fontSize: 10, opacity: 0.8 } }, "(", u.sam, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => toggleAdUser(sam), style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#1d4ed8",
      fontSize: 12,
      padding: 0,
      lineHeight: 1
    } }, "\xD7")) : null;
  })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => executeAction("AD\u30E6\u30FC\u30B6\u30FC\u5272\u308A\u5F53\u3066", `${selectedAdUsers.size}\u540D \u2192 \u5C55\u958B\u8A2D\u5B9A\u306B\u4FDD\u5B58`),
      style: {
        padding: "8px 20px",
        borderRadius: 8,
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontSize: 12,
        cursor: "pointer",
        fontWeight: 600
      }
    },
    "\u{1F4BE} \u5C55\u958B\u8A2D\u5B9A\u306B\u30E6\u30FC\u30B6\u30FC\u3092\u5272\u308A\u5F53\u3066"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => executeAction("AD\u30E6\u30FC\u30B6\u30FC\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8", `${selectedAdUsers.size}\u540D CSV\u51FA\u529B`),
      style: {
        padding: "8px 16px",
        borderRadius: 8,
        border: "1px solid #bfdbfe",
        background: "#fff",
        fontSize: 12,
        cursor: "pointer",
        color: "#2563eb"
      }
    },
    "\u{1F4E5} CSV \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8"
  ))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 10, color: "#94a3b8" } }, "\u203B \u5B9F\u88C5\u6642\u306F ", /* @__PURE__ */ React.createElement("code", null, "/api/v1/ad/users"), " (LDAP proxy) \u304C\u30D0\u30C3\u30AF\u30A8\u30F3\u30C9\u3067\u30AF\u30A8\u30EA\u3092\u5B9F\u884C\u3057\u307E\u3059\u3002 \u30D7\u30ED\u30C8\u30BF\u30A4\u30D7\u306F\u30E2\u30C3\u30AF\u30C7\u30FC\u30BF\u3092\u8868\u793A\u3057\u3066\u3044\u307E\u3059\u3002"))))), activeTab === "database" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u63A5\u7D9A"), [{ k: "DATABASE_URL", v: "postgresql://cdx:***@localhost:5432/cdx" }, { k: "Backend", v: "PostgresStorage (async)" }, { k: "\u30C9\u30E9\u30A4\u30D0", v: "asyncpg + AsyncSession" }, { k: "ORM", v: "SQLAlchemy 2.0" }, { k: "\u30DE\u30A4\u30B0\u30EC\u30FC\u30B7\u30E7\u30F3", v: "Alembic 0002" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8" } }, r.k), /* @__PURE__ */ React.createElement("span", { style: { color: "#0f172a", fontWeight: 500 } }, r.v))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b" } }, "\u30D7\u30FC\u30EB\u4F7F\u7528"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "#22c55e" } }, "3/5")), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: "#e8ecf1", borderRadius: 3 } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: "60%", background: "#22c55e", borderRadius: 3 } })))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30C6\u30FC\u30D6\u30EB\u4E00\u89A7"), [{ n: "devices", r: 10 }, { n: "heartbeats", r: 2847 }, { n: "inventory_snapshots", r: 42 }, { n: "iso_build_jobs", r: 5 }, { n: "iso_build_audit", r: 18 }].map((t, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("code", { style: { color: "#2563eb", fontWeight: 500, width: 160 } }, t.n), /* @__PURE__ */ React.createElement("span", { style: { color: "#475569", fontWeight: 600 } }, t.r.toLocaleString()))))), activeTab === "agent" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "cdx-agent \u8A2D\u5B9A"), [{ k: "CDX_DEVICE_ID", v: "(\u7AEF\u672B\u5225)" }, { k: "CDX_API_ENDPOINT", v: "https://cdx-server:8300/api/v1" }, { k: "heartbeat\u9593\u9694", v: "60\u79D2" }, { k: "inventory\u9593\u9694", v: "3600\u79D2" }, { k: "policy poll", v: "300\u79D2" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("code", { style: { color: "#475569", fontWeight: 500 } }, r.k), /* @__PURE__ */ React.createElement("span", { style: { color: "#2563eb", fontWeight: 600 } }, r.v)))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "Agent \u30B3\u30DE\u30F3\u30C9 / systemd"), [{ c: "cdx-agent version" }, { c: "cdx-agent config" }, { c: "cdx-agent inventory" }, { c: "cdx-agent heartbeat" }, { c: "cdx-agent drain" }, { c: "cdx-agent poll-policy" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { padding: "4px 0", borderBottom: i < 5 ? "1px solid #f8fafc" : "none", fontSize: 11 } }, /* @__PURE__ */ React.createElement("code", { style: { color: "#2563eb", fontWeight: 500 } }, r.c))))), activeTab === "network" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "API \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8 (12)"), [{ m: "GET", p: "/health" }, { m: "POST", p: "/api/v1/devices/register" }, { m: "POST", p: "/api/v1/heartbeat" }, { m: "POST", p: "/api/v1/inventory" }, { m: "GET", p: "/api/v1/policy" }, { m: "POST", p: "/api/v1/iso-builds" }, { m: "GET", p: "/api/v1/iso-builds" }, { m: "GET", p: "/api/v1/iso-builds/{id}" }, { m: "GET", p: "/api/v1/iso-builds/{id}/log" }, { m: "GET", p: "/api/v1/iso-builds/{id}/download" }, { m: "POST", p: "/api/v1/iso-builds/{id}/cancel" }, { m: "GET", p: "/metrics" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: i < 11 ? "1px solid #f8fafc" : "none", fontSize: 11 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: r.m === "GET" ? "#eff6ff" : "#f0fdf4", color: r.m === "GET" ? "#2563eb" : "#22c55e", width: 32, textAlign: "center" } }, r.m), /* @__PURE__ */ React.createElement("code", { style: { color: "#0f172a" } }, r.p)))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u5916\u90E8\u30B5\u30FC\u30D3\u30B9 / Docker"), [{ s: "cdx-server", p: "8300" }, { s: "postgres", p: "5432" }, { s: "redis", p: "6379" }, { s: "minio", p: "9000" }, { s: "prometheus", p: "9090" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("code", { style: { color: "#475569", fontWeight: 500, width: 100 } }, r.s), /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8" } }, ":", r.p), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#22c55e", fontWeight: 500 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: "#22c55e" } }), "running"))))), activeTab === "notifications" && /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30A2\u30E9\u30FC\u30C8\u901A\u77E5\u8A2D\u5B9A"), notifications.map((n, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < notifications.length - 1 ? "1px solid #f8fafc" : "none" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, width: 100 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16 } }, n.type === "email" ? "\u{1F4E7}" : n.type === "webhook" ? "\u{1F517}" : "\u{1F4AC}"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, n.type === "email" ? "\u30E1\u30FC\u30EB" : n.type === "webhook" ? "Webhook" : "Slack")), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    const nv = [...notifications];
    nv[i] = __spreadProps(__spreadValues({}, nv[i]), { enabled: !nv[i].enabled });
    setNotifications(nv);
  }, style: { padding: "4px 12px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: n.enabled ? "#f0fdf4" : "#f8fafc", color: n.enabled ? "#22c55e" : "#94a3b8" } }, n.enabled ? "ON" : "OFF"), /* @__PURE__ */ React.createElement("input", { type: "text", placeholder: n.type === "email" ? "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9" : n.type === "webhook" ? "https://..." : "#channel", value: n.target, onChange: (e) => {
    const nv = [...notifications];
    nv[i] = __spreadProps(__spreadValues({}, nv[i]), { target: e.target.value });
    setNotifications(nv);
  }, style: { flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, color: "#0f172a" } }), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u901A\u77E5\u30C6\u30B9\u30C8", n.type), style: { padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb" } }, "\u30C6\u30B9\u30C8\u9001\u4FE1"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#64748b" } }, "\u901A\u77E5\u5BFE\u8C61: critical/high \u30A2\u30E9\u30FC\u30C8\u3001\u30C7\u30D0\u30A4\u30B9\u30AA\u30D5\u30E9\u30A4\u30F3\u3001ISO\u30D3\u30EB\u30C9\u5B8C\u4E86/\u5931\u6557\u3001\u30C8\u30FC\u30AF\u30F3\u30ED\u30FC\u30C6\u30FC\u30B7\u30E7\u30F3"), /* @__PURE__ */ React.createElement("button", { onClick: () => executeAction("\u901A\u77E5\u8A2D\u5B9A\u4FDD\u5B58", "\u5168\u30C1\u30E3\u30F3\u30CD\u30EB"), style: { marginTop: 8, padding: "6px 16px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" } }, "\u4FDD\u5B58")), activeTab === "maintenance" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u30E2\u30FC\u30C9"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#475569", lineHeight: 1.6 } }, "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u30E2\u30FC\u30C9\u3092\u6709\u52B9\u306B\u3059\u308B\u3068\u3001API \u304C 503 Service Unavailable \u3092\u8FD4\u5374\u3057\u3001\u7AEF\u672B\u304B\u3089\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u53D7\u4ED8\u3092\u4E00\u6642\u505C\u6B62\u3057\u307E\u3059\u3002\u7BA1\u7406WebUI\u306F\u5F15\u304D\u7D9A\u304D\u30A2\u30AF\u30BB\u30B9\u53EF\u80FD\u3067\u3059\u3002")), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setMaintenanceMode(!maintenanceMode);
    executeAction(maintenanceMode ? "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u30E2\u30FC\u30C9\u89E3\u9664" : "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u30E2\u30FC\u30C9\u958B\u59CB", "API 503 \u5207\u66FF");
  }, style: { padding: "10px 24px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: maintenanceMode ? "#22c55e" : "#dc2626", color: "#fff" } }, maintenanceMode ? "\u2713 \u89E3\u9664 (API\u53D7\u4ED8\u518D\u958B)" : "\u26A0 \u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u958B\u59CB")), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px", borderRadius: 8, background: maintenanceMode ? "#fef2f2" : "#f0fdf4", border: `1px solid ${maintenanceMode ? "#fecaca" : "#bbf7d0"}` } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: maintenanceMode ? "#dc2626" : "#22c55e" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: maintenanceMode ? "#dc2626" : "#22c55e" } }), maintenanceMode ? "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u30E2\u30FC\u30C9: ON \u2014 API \u306F 503 \u3092\u8FD4\u5374\u4E2D" : "\u901A\u5E38\u904B\u7528\u4E2D \u2014 API \u306F\u5168\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u53D7\u4ED8\u4E2D"))), /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 } }, "\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u6642\u306E\u5F71\u97FF"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "12px", background: "#fef2f2", borderRadius: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#dc2626", marginBottom: 6 } }, "\u505C\u6B62\u3055\u308C\u308B\u6A5F\u80FD"), ["heartbeat \u53D7\u4FE1", "inventory \u53D7\u4FE1", "\u30C7\u30D0\u30A4\u30B9\u767B\u9332", "\u30DD\u30EA\u30B7\u30FC\u914D\u4FE1", "ISO \u30D3\u30EB\u30C9\u958B\u59CB"].map((f, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 11, color: "#64748b", padding: "2px 0" } }, "\u2715 ", f))), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px", background: "#f0fdf4", borderRadius: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#22c55e", marginBottom: 6 } }, "\u7D99\u7D9A\u3059\u308B\u6A5F\u80FD"), ["\u7BA1\u7406WebUI \u30A2\u30AF\u30BB\u30B9", "\u76E3\u67FB\u30ED\u30B0\u95B2\u89A7", "\u8A2D\u5B9A\u5909\u66F4", "/health \u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8", "Prometheus \u30E1\u30C8\u30EA\u30AF\u30B9"].map((f, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { fontSize: 11, color: "#64748b", padding: "2px 0" } }, "\u2713 ", f)))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 11, color: "#94a3b8" } }, "\u26A0 \u7AEF\u672B\u5074\u306E cdx-agent \u306F\u30B9\u30D7\u30FC\u30EB\u306B\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u84C4\u7A4D\u3057\u3001\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u89E3\u9664\u5F8C\u306B\u81EA\u52D5\u518D\u9001\u3057\u307E\u3059\uFF08backoff + retry\uFF09"))), activeTab === "system" && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u60C5\u5831"), [{ k: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u540D", v: "\u5EFA\u8A2DDX OS" }, { k: "\u76EE\u7684", v: "\u5EFA\u8A2D\u4F1A\u793E\u5411\u3051\u696D\u52D9\u7528\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u57FA\u76E4" }, { k: "\u30D9\u30FC\u30B9OS", v: "Debian 13 stable" }, { k: "\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7", v: "XFCE" }, { k: "\u958B\u767A\u958B\u59CB", v: "2026-04-10" }, { k: "\u30EA\u30EA\u30FC\u30B9\u76EE\u6A19", v: "2026-10-10" }, { k: "\u73FE\u5728\u30D5\u30A7\u30FC\u30BA", v: "Phase 2" }, { k: "\u30EA\u30DD\u30B8\u30C8\u30EA", v: "Kensan196948G/Construction-DX-OS" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 7 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8" } }, r.k), /* @__PURE__ */ React.createElement("span", { style: { color: "#0f172a", fontWeight: 500 } }, r.v)))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30B3\u30F3\u30DD\u30FC\u30CD\u30F3\u30C8"), [{ k: "cdx-server", v: "0.1.0", s: "stable" }, { k: "cdx-agent", v: "0.2.0", s: "stable" }, { k: "build-worker", v: "0.1.0", s: "mock" }, { k: "OpenAPI", v: "12 endpoints", s: "synced" }, { k: "SDK (TS/Py)", v: "auto-gen", s: "synced" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#475569", fontWeight: 500, width: 100 } }, r.k), /* @__PURE__ */ React.createElement("span", { style: { color: "#2563eb", fontWeight: 600 } }, r.v), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f0fdf4", color: "#22c55e" } }, r.s)))), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 } }, "\u30C6\u30B9\u30C8\u30FB\u54C1\u8CEA"), [{ k: "\u7DCF\u30C6\u30B9\u30C8", v: "358\u4EF6", c: "#22c55e" }, { k: "CI", v: "8/8 green", c: "#22c55e" }, { k: "\u30AB\u30D0\u30EC\u30C3\u30B8", v: "97%", c: "#22c55e" }, { k: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3", v: "CVE 0", c: "#22c55e" }].map((r, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8" } }, r.k), /* @__PURE__ */ React.createElement("span", { style: { color: r.c, fontWeight: 600 } }, r.v)))))), actionLog.length > 0 && /* @__PURE__ */ React.createElement("div", { style: __spreadProps(__spreadValues({}, cardStyle), { marginTop: 16 }) }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "#0f172a" } }, "\u64CD\u4F5C\u30ED\u30B0"), /* @__PURE__ */ React.createElement("button", { onClick: () => setActionLog([]), style: { fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" } }, "\u30AF\u30EA\u30A2")), actionLog.slice(0, 10).map((a, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "4px 0", borderBottom: i < actionLog.length - 1 ? "1px solid #f8fafc" : "none", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#94a3b8", fontSize: 11 } }, a.at), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 500, color: "#475569" } }, a.action), /* @__PURE__ */ React.createElement("span", { style: { color: "#64748b" } }, a.detail), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "\u5B8C\u4E86" ? "#f0fdf4" : "#eff6ff", color: a.status === "\u5B8C\u4E86" ? "#22c55e" : "#3b82f6" } }, a.status)))));
};
window.SettingsPage = SettingsPage;

/* === proto-app.jsx === */
const NAV = [
  { id: "dashboard", label: "\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9", icon: "\u{1F4CA}", group: "overview" },
  { id: "devices", label: "\u7AEF\u672B\u7BA1\u7406", icon: "\u{1F4BB}", group: "deploy" },
  { id: "deployment", label: "OS\u30FB\u8A8D\u8A3C\u8A2D\u5B9A", icon: "\u{1F510}", group: "deploy" },
  { id: "register", label: "\u5C55\u958B\u53F0\u5E33", icon: "\u{1F4CB}", group: "deploy" },
  { id: "apps", label: "\u914D\u5E03\u30A2\u30D7\u30EA", icon: "\u{1F4E6}", group: "deploy" },
  { id: "iso", label: "ISO \u914D\u5E03", icon: "\u{1F4BF}", group: "deploy" },
  { id: "rings", label: "\u66F4\u65B0\u30EA\u30F3\u30B0\u7BA1\u7406", icon: "\u{1F504}", group: "deploy" },
  { id: "pxe", label: "PXE \u5C55\u958B\u7BA1\u7406", icon: "\u{1F5A5}\uFE0F", group: "deploy" },
  { id: "security", label: "\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30FB\u30DD\u30EA\u30B7\u30FC", icon: "\u{1F6E1}\uFE0F", group: "govern" },
  { id: "logs", label: "\u76E3\u67FB\u30ED\u30B0", icon: "\u{1F4CB}", group: "govern" },
  { id: "settings", label: "\u30B7\u30B9\u30C6\u30E0\u8A2D\u5B9A", icon: "\u2699\uFE0F", group: "govern" }
];
const NAV_GROUPS = [
  { id: "overview", label: null },
  { id: "deploy", label: "\u5C55\u958B\u30D5\u30ED\u30FC" },
  { id: "govern", label: "\u7BA1\u7406\u30FB\u30AC\u30D0\u30CA\u30F3\u30B9" }
];
function App() {
  const [nav, setNav] = React.useState("dashboard");
  const renderPage = () => {
    switch (nav) {
      case "dashboard":
        return /* @__PURE__ */ React.createElement(DashboardPage, null);
      case "devices":
        return /* @__PURE__ */ React.createElement(DevicesPage, null);
      case "iso":
        return /* @__PURE__ */ React.createElement(IsoPage, null);
      case "deployment":
        return /* @__PURE__ */ React.createElement(DeploymentPage, null);
      case "register":
        return /* @__PURE__ */ React.createElement(RegisterPage, null);
      case "apps":
        return /* @__PURE__ */ React.createElement(AppsPage, null);
      case "rings":
        return /* @__PURE__ */ React.createElement(RingsPage, null);
      case "pxe":
        return /* @__PURE__ */ React.createElement(PxePage, null);
      case "security":
        return /* @__PURE__ */ React.createElement(SecurityPage, null);
      case "logs":
        return /* @__PURE__ */ React.createElement(LogsPage, null);
      case "settings":
        return /* @__PURE__ */ React.createElement(SettingsPage, null);
      default:
        return /* @__PURE__ */ React.createElement(DashboardPage, null);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { style: {
    width: "100vw",
    height: "100vh",
    background: "#f8fafc",
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans JP', sans-serif",
    display: "flex",
    overflow: "hidden"
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 220,
    background: "#fff",
    borderRight: "1px solid #e8ecf1",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0
  } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "18px 18px 14px", borderBottom: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700
  } }, "C"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#0f172a" } }, "\u5EFA\u8A2DDX OS"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#94a3b8" } }, "\u4E2D\u592E\u7BA1\u7406\u30B3\u30F3\u30BD\u30FC\u30EB")))), /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" } }, NAV_GROUPS.map((grp) => {
    const items = NAV.filter((n) => n.group === grp.id);
    return /* @__PURE__ */ React.createElement("div", { key: grp.id }, grp.label && /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 9,
      fontWeight: 700,
      color: "#cbd5e1",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      padding: "10px 14px 4px"
    } }, grp.label), items.map((item) => /* @__PURE__ */ React.createElement("button", { key: item.id, onClick: () => setNav(item.id), style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 14px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontSize: 12.5,
      textAlign: "left",
      width: "100%",
      background: nav === item.id ? "#eff6ff" : "transparent",
      color: nav === item.id ? "#2563eb" : "#475569",
      fontWeight: nav === item.id ? 600 : 400,
      transition: "all 100ms"
    } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14 } }, item.icon), item.label)));
  })), /* @__PURE__ */ React.createElement("div", { style: { padding: "14px 16px", borderTop: "1px solid #f1f5f9" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#f0fdf4", borderRadius: 8, padding: "10px 12px", fontSize: 11 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, color: "#16a34a", marginBottom: 4 } }, "\u30B7\u30B9\u30C6\u30E0\u6B63\u5E38"), /* @__PURE__ */ React.createElement("div", { style: { color: "#64748b" } }, "PostgreSQL: OK"), /* @__PURE__ */ React.createElement("div", { style: { color: "#64748b" } }, "Redis: \u63A5\u7D9A\u4E2D"), /* @__PURE__ */ React.createElement("div", { style: { color: "#64748b" } }, "API: 7 endpoints")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 10, color: "#cbd5e1", textAlign: "center" } }, "cdx-server v0.1.0"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: {
    padding: "12px 28px",
    background: "#fff",
    borderBottom: "1px solid #e8ecf1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0
  } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#94a3b8" } }, "\u5EFA\u8A2DDX OS \u4E2D\u592E\u7BA1\u7406\u30B3\u30F3\u30BD\u30FC\u30EB \u2014 OS\u914D\u5E03\u30FB\u7AEF\u672B\u6A19\u6E96\u5316\u30FB\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u7D71\u5236"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#94a3b8" } }, "2026-05-06 09:30 JST"), /* @__PURE__ */ React.createElement("div", { style: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: 12
  } }, "\u7BA1"))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, padding: "24px 28px", overflowY: "auto" } }, renderPage())));
}
ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));

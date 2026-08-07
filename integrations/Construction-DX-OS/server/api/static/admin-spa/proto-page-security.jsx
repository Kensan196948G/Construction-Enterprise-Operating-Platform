/* ─── Security & Policy Page — Unified Security Governance + Policy Management ─── */

const SECURITY_EVENTS = [
  { at: "09:29:45", type: "apparmor_deny", device: "CDX-KSK-201", detail: "AppArmor DENIED: /usr/bin/cdx-agent write to /tmp/unauthorized", severity: "high" },
  { at: "09:28:12", type: "auth_failure", device: "unknown", detail: "HMAC 署名検証失敗: device_id=CDX-FAKE-999 (未登録端末)", severity: "critical" },
  { at: "09:25:00", type: "rate_limit", device: "CDX-FLD-102", detail: "レート制限超過: heartbeat 12/min (上限 10/min) → 429 返却", severity: "medium" },
  { at: "09:20:33", type: "apparmor_deny", device: "CDX-KSK-201", detail: "AppArmor DISABLED: プロファイル未適用状態を検知", severity: "critical" },
  { at: "09:15:00", type: "policy_applied", device: "CDX-HQ-001", detail: "nftables ルール v2.1 適用完了", severity: "info" },
  { at: "09:10:00", type: "agent_outdated", device: "CDX-FLD-101", detail: "cdx-agent 0.1.9 → 0.2.0 未更新 (Ring 2 展開済み)", severity: "medium" },
  { at: "09:05:00", type: "policy_applied", device: "CDX-BR-010", detail: "sudo ポリシー v2.0 適用完了", severity: "info" },
  { at: "08:55:00", type: "auth_failure", device: "unknown", detail: "Bearer Token 不一致: POST /api/v1/devices/register", severity: "high" },
  { at: "08:30:00", type: "cve_found", device: "CDX-KSK-201", detail: "CVE-2026-1234: libssl3 3.0.13 — Medium (修正版あり)", severity: "medium" },
  { at: "08:00:00", type: "policy_applied", device: "ALL", detail: "AppArmor プロファイル v1.3 全端末配信完了 (9/10 適用)", severity: "info" },
];

const VULN_DATA = [
  { cve: "CVE-2026-1234", pkg: "libssl3", installed: "3.0.13-1", fixed: "3.0.13-2", severity: "Medium", devices: ["CDX-KSK-201", "CDX-FLD-101"], status: "修正版あり" },
  { cve: "CVE-2026-0567", pkg: "curl", installed: "8.5.0-2", fixed: "8.5.0-3", severity: "Low", devices: ["CDX-KSK-201"], status: "修正版あり" },
];

const POLICY_TEMPLATES = [
  { name: "standard (本社/支店)", policies: ["AppArmor: enforced", "sudo: IT管理者のみ", "nftables: HTTPS+DNS+SSH", "APT: 社内ミラー", "USB: 許可"] },
  { name: "field (現場)", policies: ["AppArmor: enforced", "sudo: 制限付き", "nftables: HTTPS+DNS", "APT: 社内ミラー+キャッシュ", "USB: 読取のみ"] },
  { name: "kiosk (共用端末)", policies: ["AppArmor: enforced (strict)", "sudo: 無効", "nftables: HTTPS のみ", "APT: 自動更新無効", "USB: 無効"] },
];

const POLICIES_FULL = [
  { name: "AppArmor プロファイル", version: "v1.3", prev: "v1.2", lastPush: "2026-05-05 10:00", applied: 9, total: 10, status: "部分適用", schedule: "即時", nextVersion: "v1.4" },
  { name: "sudo ポリシー", version: "v2.0", prev: "v1.9", lastPush: "2026-05-04 14:00", applied: 10, total: 10, status: "全端末適用", schedule: "即時", nextVersion: null },
  { name: "nftables ルール", version: "v2.1", prev: "v2.0", lastPush: "2026-05-05 18:00", applied: 10, total: 10, status: "全端末適用", schedule: "即時", nextVersion: "v2.2" },
  { name: "APT ミラー設定", version: "v1.1", prev: "v1.0", lastPush: "2026-05-05 08:00", applied: 10, total: 10, status: "全端末適用", schedule: "メンテナンス窓", nextVersion: null },
  { name: "HMAC 共有鍵", version: "rotate-05", prev: "rotate-04", lastPush: "2026-05-01 00:00", applied: 10, total: 10, status: "全端末配布", schedule: "月次ローテーション", nextVersion: "rotate-06" },
  { name: "systemd timer 設定", version: "v1.0", prev: "v0.9", lastPush: "2026-04-28 09:00", applied: 10, total: 10, status: "全端末適用", schedule: "即時", nextVersion: null },
];

const DIFF_EXAMPLE = {
  "nftables ルール": {
    removed: [
      "  # v2.0",
      "  tcp dport { 80, 443 } accept",
      "  udp dport 53 accept",
    ],
    added: [
      "  # v2.1",
      "  tcp dport { 80, 443 } accept",
      "  udp dport 53 accept",
      "  tcp dport 8300 accept  # cdx-server API",
      "  icmp type echo-request limit rate 5/second accept",
    ],
  },
  "AppArmor プロファイル": {
    removed: [
      "  # v1.2",
      "  /var/lib/cdx-agent/spool/** rw,",
      "  /etc/cdx-agent/** r,",
    ],
    added: [
      "  # v1.3",
      "  /var/lib/cdx-agent/spool/** rw,",
      "  /etc/cdx-agent/** r,",
      "  /var/log/cdx-agent/** w,  # ログ出力追加",
      "  deny /tmp/** w,           # tmp書込み禁止",
    ],
  },
};

const sevColor = s => s === "critical" ? "#ef4444" : s === "high" ? "#f59e0b" : s === "medium" ? "#3b82f6" : "#22c55e";
const sevBg = s => s === "critical" ? "#fef2f2" : s === "high" ? "#fffbeb" : s === "medium" ? "#eff6ff" : "#f0fdf4";

const TMPL_COLORS = ["#2563eb", "#f59e0b", "#22c55e", "#8b5cf6", "#ef4444", "#06b6d4"];

const TemplatesTab = ({ executeAction }) => {
  const [templates, setTemplates] = React.useState(
    POLICY_TEMPLATES.map((t, i) => ({
      ...t,
      id: "tmpl-" + i,
      isDefault: true,
      color: TMPL_COLORS[i],
      policies: t.policies.map((p, j) => ({ text: p, enabled: true, id: "p-" + i + "-" + j })),
    }))
  );
  const [editing, setEditing] = React.useState(null);
  const [showNew, setShowNew] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newBase, setNewBase] = React.useState("");
  const [customPolicy, setCustomPolicy] = React.useState("");
  const [addingCustomTo, setAddingCustomTo] = React.useState(null);

  const duplicateTemplate = (tmpl) => {
    const newTmpl = {
      ...tmpl,
      id: "tmpl-" + Date.now(),
      name: tmpl.name + " (コピー)",
      isDefault: false,
      color: TMPL_COLORS[templates.length % TMPL_COLORS.length],
      policies: tmpl.policies.map((p, j) => ({ ...p, id: "p-new-" + Date.now() + "-" + j })),
    };
    setTemplates(prev => [...prev, newTmpl]);
    executeAction("テンプレート複製", tmpl.name + " → " + newTmpl.name);
  };

  const deleteTemplate = (tmplId) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl?.isDefault) return;
    setTemplates(prev => prev.filter(t => t.id !== tmplId));
    executeAction("テンプレート削除", tmpl?.name || tmplId);
    if (editing === tmplId) setEditing(null);
  };

  const togglePolicy = (tmplId, policyId) => {
    setTemplates(prev => prev.map(t => t.id === tmplId ? { ...t, policies: t.policies.map(p => p.id === policyId ? { ...p, enabled: !p.enabled } : p) } : t));
  };

  const removePolicy = (tmplId, policyId) => {
    setTemplates(prev => prev.map(t => t.id === tmplId ? { ...t, policies: t.policies.filter(p => p.id !== policyId) } : t));
  };

  const addCustomPolicy = (tmplId) => {
    if (!customPolicy.trim()) return;
    setTemplates(prev => prev.map(t => t.id === tmplId ? { ...t, policies: [...t.policies, { text: customPolicy.trim(), enabled: true, id: "p-custom-" + Date.now() }] } : t));
    executeAction("カスタムポリシー追加", customPolicy.trim());
    setCustomPolicy("");
    setAddingCustomTo(null);
  };

  const createTemplate = () => {
    if (!newName.trim()) return;
    const base = newBase ? templates.find(t => t.id === newBase) : null;
    const newTmpl = {
      id: "tmpl-" + Date.now(),
      name: newName.trim(),
      isDefault: false,
      color: TMPL_COLORS[templates.length % TMPL_COLORS.length],
      policies: base ? base.policies.map((p, j) => ({ ...p, id: "p-new-" + Date.now() + "-" + j })) : [
        { text: "AppArmor: enforced", enabled: true, id: "p-new-0" },
        { text: "sudo: 制限付き", enabled: true, id: "p-new-1" },
        { text: "nftables: HTTPS+DNS", enabled: true, id: "p-new-2" },
      ],
    };
    setTemplates(prev => [...prev, newTmpl]);
    executeAction("テンプレート新規作成", newTmpl.name + (base ? " (ベース: " + base.name + ")" : ""));
    setShowNew(false);
    setNewName("");
    setNewBase("");
    setEditing(newTmpl.id);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>プロファイル別ポリシーテンプレート</div>
        <button onClick={() => setShowNew(!showNew)} style={{ padding: "6px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 新規テンプレート</button>
      </div>

      {/* New template form */}
      {showNew && (
        <div style={{ ...cardStyle, marginBottom: 16, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", marginBottom: 10 }}>新規テンプレート作成</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>テンプレート名</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="例: 工場端末" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>ベーステンプレート（任意）</label>
              <select value={newBase} onChange={e => setNewBase(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12 }}>
                <option value="">空のテンプレート（デフォルトポリシーのみ）</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} を複製</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createTemplate} disabled={!newName.trim()} style={{ padding: "8px 18px", borderRadius: 8, background: newName.trim() ? "#2563eb" : "#e2e8f0", color: newName.trim() ? "#fff" : "#94a3b8", border: "none", fontSize: 12, fontWeight: 600, cursor: newName.trim() ? "pointer" : "not-allowed" }}>作成</button>
              <button onClick={() => setShowNew(false)} style={{ padding: "8px 14px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* Template cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        {templates.map((t) => {
          const isEditing = editing === t.id;
          return (
            <div key={t.id} style={{ ...cardStyle, borderTop: `3px solid ${t.color}`, background: isEditing ? "#fafbfd" : "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t.name}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {t.isDefault && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#94a3b8" }}>デフォルト</span>}
                  {!t.isDefault && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "#eff6ff", color: "#2563eb" }}>カスタム</span>}
                </div>
              </div>
              {/* Policy items */}
              {t.policies.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid #f1f5f9", fontSize: 12, opacity: p.enabled ? 1 : 0.4 }}>
                  {isEditing ? (
                    <React.Fragment>
                      <input type="checkbox" checked={p.enabled} onChange={() => togglePolicy(t.id, p.id)} style={{ cursor: "pointer" }} />
                      <span style={{ flex: 1, color: "#475569", textDecoration: p.enabled ? "none" : "line-through" }}>{p.text}</span>
                      <button onClick={() => removePolicy(t.id, p.id)} style={{ padding: "1px 5px", borderRadius: 3, border: "1px solid #fecaca", fontSize: 9, cursor: "pointer", background: "#fff", color: "#dc2626" }}>✕</button>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.enabled ? "#22c55e" : "#e2e8f0", flexShrink: 0 }}></span>
                      <span style={{ color: "#475569" }}>{p.text}</span>
                    </React.Fragment>
                  )}
                </div>
              ))}
              {/* Add custom policy */}
              {isEditing && addingCustomTo === t.id && (
                <div style={{ display: "flex", gap: 4, padding: "6px 0" }}>
                  <input type="text" value={customPolicy} onChange={e => setCustomPolicy(e.target.value)} placeholder="カスタムポリシー..." style={{ flex: 1, padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11 }} onKeyDown={e => e.key === "Enter" && addCustomPolicy(t.id)} />
                  <button onClick={() => addCustomPolicy(t.id)} style={{ padding: "4px 10px", borderRadius: 6, background: "#22c55e", color: "#fff", border: "none", fontSize: 10, cursor: "pointer" }}>追加</button>
                  <button onClick={() => { setAddingCustomTo(null); setCustomPolicy(""); }} style={{ padding: "4px 8px", borderRadius: 6, background: "#fff", color: "#94a3b8", border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer" }}>✕</button>
                </div>
              )}
              {/* Action buttons */}
              <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={() => executeAction("テンプレート適用", t.name)} style={{ flex: 1, padding: "5px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb", fontWeight: 600 }}>適用</button>
                <button onClick={() => setEditing(isEditing ? null : t.id)} style={{ flex: 1, padding: "5px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: isEditing ? "#eff6ff" : "#fff", color: isEditing ? "#2563eb" : "#64748b", fontWeight: isEditing ? 600 : 400 }}>{isEditing ? "完了" : "編集"}</button>
                {isEditing && (
                  <button onClick={() => { setAddingCustomTo(t.id); setCustomPolicy(""); }} style={{ flex: 1, padding: "5px", borderRadius: 6, border: "1px solid #bbf7d0", fontSize: 10, cursor: "pointer", background: "#f0fdf4", color: "#22c55e", fontWeight: 600 }}>+ ルール</button>
                )}
                <button onClick={() => duplicateTemplate(t)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" }}>複製</button>
                {!t.isDefault && (
                  <button onClick={() => deleteTemplate(t.id)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626" }}>削除</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Policy delivery mechanism */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>ポリシー配信メカニズム</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: "14px", background: "#f8fafc", borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>サーバー側 (Push)</div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
              <code style={{ background: "#e8ecf1", padding: "1px 4px", borderRadius: 2 }}>GET /api/v1/policy</code> エンドポイントで最新ポリシーを配信。管理者がWebUIからポリシー更新をトリガー可能。
            </div>
          </div>
          <div style={{ padding: "14px", background: "#f8fafc", borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>Agent側 (Pull)</div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
              <code style={{ background: "#e8ecf1", padding: "1px 4px", borderRadius: 2 }}>cdx-agent poll-policy</code> コマンドで定期取得。systemd timer で interval 設定。HMAC 署名付きリクエスト。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
    if (d.apparmor !== "有効") score -= 30;
    if (d.agent !== "0.2.0") score -= 20;
    if (d.status === "offline") score -= 15;
    if (d.status === "warning") score -= 10;
    return Math.max(0, score);
  };
  const fleetScore = Math.round(DEVICES_DATA.reduce((s, d) => s + complianceScore(d), 0) / DEVICES_DATA.length);

  const executeAction = (action, detail) => {
    const now = new Date().toLocaleTimeString("ja-JP");
    setActionLog(prev => [{ at: now, action, detail, status: "実行中" }, ...prev]);
    setTimeout(() => setActionLog(prev => prev.map((l, i) => i === 0 ? { ...l, status: "完了" } : l)), 1500);
  };

  const toggleIsolate = (deviceId) => {
    if (isolatedDevices.includes(deviceId)) {
      setIsolatedDevices(prev => prev.filter(id => id !== deviceId));
      executeAction("隔離解除", deviceId);
    } else {
      setIsolatedDevices(prev => [...prev, deviceId]);
      executeAction("自動隔離", deviceId + " — ネットワーク制限適用");
    }
  };

  const tabs = [
    { id: "overview", label: "概要" },
    { id: "compliance", label: "コンプライアンス" },
    { id: "events", label: "セキュリティイベント" },
    { id: "policies", label: "ポリシー管理" },
    { id: "templates", label: "ポリシーテンプレート" },
    { id: "vulnerabilities", label: "脆弱性" },
    { id: "report", label: "監査レポート" },
  ];

  const filteredEvents = eventFilter === "all" ? SECURITY_EVENTS : SECURITY_EVENTS.filter(e => e.severity === eventFilter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>セキュリティ統制・ポリシー管理</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>AppArmor・HMAC署名・ファイアウォール・ポリシー配信の統合管理</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: fleetScore >= 90 ? "#f0fdf4" : fleetScore >= 70 ? "#fffbeb" : "#fef2f2", border: `1px solid ${fleetScore >= 90 ? "#bbf7d0" : fleetScore >= 70 ? "#fde68a" : "#fecaca"}` }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>フリートスコア </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: fleetScore >= 90 ? "#22c55e" : fleetScore >= 70 ? "#f59e0b" : "#ef4444" }}>{fleetScore}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>/100</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid #e8ecf1" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 14px", fontSize: 12, border: "none", cursor: "pointer",
            borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
            color: activeTab === t.id ? "#2563eb" : "#64748b", fontWeight: activeTab === t.id ? 600 : 400,
            background: "transparent", marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "フリートスコア", val: fleetScore + "/100", color: fleetScore >= 90 ? "#22c55e" : "#f59e0b" },
              { label: "AppArmor有効", val: `${DEVICES_DATA.length - aaDisabledN}/${DEVICES_DATA.length}`, color: aaDisabledN > 0 ? "#f59e0b" : "#22c55e" },
              { label: "Agent最新", val: `${DEVICES_DATA.length - oldAgentN}/${DEVICES_DATA.length}`, color: oldAgentN > 0 ? "#f59e0b" : "#22c55e" },
              { label: "未対応イベント", val: SECURITY_EVENTS.filter(e => e.severity === "critical" || e.severity === "high").length + "件", color: "#ef4444" },
              { label: "隔離端末", val: isolatedDevices.length + "台", color: isolatedDevices.length > 0 ? "#ef4444" : "#22c55e" },
            ].map((s, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          {/* Security measures */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>セキュリティ対策一覧</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { title: "AppArmor MAC", desc: "cdx-agent に最小権限プロファイルを適用。spool rw, config r, HTTPS/DNS のみ。", status: "有効" },
                { title: "HMAC-SHA256 署名", desc: "全APIリクエストに device_id + payload_type + timestamp_bucket + body hash で署名。", status: "有効" },
                { title: "sudo ポリシー", desc: "一般ユーザーの sudo 実行を制限。IT管理者のみ特権操作。", status: "適用済" },
                { title: "nftables / ufw", desc: "ホストベースFWで不要ポートを閉鎖。HTTPS/DNS/cdx-server のみ許可。", status: "有効" },
                { title: "HTTPセキュリティヘッダー", desc: "X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy。", status: "有効" },
                { title: "レート制限", desc: "per-device token bucket + 429 + Retry-After。Redis sliding-window。", status: "有効" },
              ].map((m, i) => (
                <div key={i} style={{ padding: "14px", background: "#f8fafc", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{m.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, color: "#22c55e", padding: "1px 6px", background: "#f0fdf4", borderRadius: 4 }}>{m.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Recent events */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>最新セキュリティイベント</span>
              <button onClick={() => setActiveTab("events")} style={{ fontSize: 11, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>全て表示 →</button>
            </div>
            {SECURITY_EVENTS.slice(0, 5).map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: sevColor(e.severity), flexShrink: 0 }}></span>
                <span style={{ color: "#94a3b8", fontSize: 11, flexShrink: 0, width: 55 }}>{e.at}</span>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: sevBg(e.severity), color: sevColor(e.severity), fontWeight: 500, flexShrink: 0 }}>{e.severity}</span>
                <span style={{ flex: 1, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance */}
      {activeTab === "compliance" && (
        <div>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>端末別コンプライアンススコア</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                {["端末ID", "拠点", "スコア", "AppArmor", "Agent", "ポリシー", "HB状態", "隔離", "判定"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>{DEVICES_DATA.map(d => {
                const score = complianceScore(d);
                const allOk = d.apparmor === "有効" && d.agent === "0.2.0";
                const isolated = isolatedDevices.includes(d.id);
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid #f1f5f9", background: isolated ? "#fef2f2" : score < 70 ? "#fffbeb" : "" }}>
                    <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500 }}>{d.id}</td>
                    <td style={{ ...tdStyle, color: "#475569" }}>{d.location}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 50, height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: score + "%", background: score >= 90 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444", borderRadius: 3 }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: score >= 90 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444" }}>{score}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: d.apparmor === "有効" ? "#22c55e" : "#ef4444", fontWeight: 500 }}>{d.apparmor}</td>
                    <td style={{ ...tdStyle, color: d.agent === "0.2.0" ? "#22c55e" : "#f59e0b", fontWeight: 500 }}>v{d.agent}</td>
                    <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 500 }}>適用済</td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: sBg(d.status), color: sColor(d.status) }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: sColor(d.status) }}></span>{sLabel(d.status)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => toggleIsolate(d.id)} style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${isolated ? "#22c55e" : "#fecaca"}`, fontSize: 10, cursor: "pointer", background: isolated ? "#f0fdf4" : "#fff", color: isolated ? "#22c55e" : "#dc2626", fontWeight: 500 }}>
                        {isolated ? "解除" : "隔離"}
                      </button>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: allOk ? "#f0fdf4" : "#fef2f2", color: allOk ? "#22c55e" : "#ef4444" }}>{allOk ? "適合" : "要対応"}</span>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
          {/* Score trend (simulated) */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>フリートスコア推移 (直近7日)</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
              {[82, 85, 85, 87, 88, 90, fleetScore].map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: v >= 90 ? "#22c55e" : "#f59e0b" }}>{v}</span>
                  <div style={{ width: "100%", height: v * 0.9, background: v >= 90 ? "#bbf7d0" : "#fde68a", borderRadius: "4px 4px 0 0" }}></div>
                  <span style={{ fontSize: 9, color: "#94a3b8" }}>{["4/30", "5/1", "5/2", "5/3", "5/4", "5/5", "5/6"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Events */}
      {activeTab === "events" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {["all", "critical", "high", "medium", "info"].map(f => (
              <button key={f} onClick={() => setEventFilter(f)} style={{
                padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer",
                background: eventFilter === f ? sevBg(f === "all" ? "info" : f) : "#fff",
                color: eventFilter === f ? sevColor(f === "all" ? "info" : f) : "#64748b", fontWeight: eventFilter === f ? 600 : 400
              }}>{f === "all" ? `全て (${SECURITY_EVENTS.length})` : f}</button>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>セキュリティイベントタイムライン</div>
            {filteredEvents.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "start", gap: 12, padding: "10px 0", borderBottom: i < filteredEvents.length - 1 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, width: 60 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{e.at}</span>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: sevColor(e.severity) }}></span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: sevBg(e.severity), color: sevColor(e.severity) }}>{e.severity}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#64748b" }}>{e.type}</span>
                    {e.device !== "unknown" && e.device !== "ALL" && <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 500 }}>{e.device}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{e.detail}</div>
                </div>
                {(e.severity === "critical" || e.severity === "high") && e.device !== "unknown" && e.device !== "ALL" && (
                  <button onClick={() => toggleIsolate(e.device)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626", fontWeight: 500, flexShrink: 0 }}>
                    {isolatedDevices.includes(e.device) ? "隔離済" : "隔離"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy Management */}
      {activeTab === "policies" && (
        <div>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>ポリシー一覧</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                {["ポリシー名", "現行版", "前版", "配信日時", "スケジュール", "適用状態", "操作"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>{POLICIES_FULL.map((p, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: "#0f172a" }}>{p.name}</td>
                  <td style={tdStyle}><code style={{ fontSize: 11, background: "#eff6ff", padding: "2px 6px", borderRadius: 3, color: "#2563eb" }}>{p.version}</code></td>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>{p.prev}</td>
                  <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 11 }}>{p.lastPush}</td>
                  <td style={tdStyle}><span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#64748b" }}>{p.schedule}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${(p.applied / p.total) * 100}%`, background: p.applied === p.total ? "#22c55e" : "#f59e0b", borderRadius: 3 }}></div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, color: p.applied === p.total ? "#22c55e" : "#f59e0b" }}>{p.applied}/{p.total}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {DIFF_EXAMPLE[p.name] && <button onClick={() => setShowDiff(showDiff === p.name ? null : p.name)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: showDiff === p.name ? "#eff6ff" : "#fff", color: "#2563eb" }}>差分</button>}
                      <button onClick={() => { setShowPolicyAction(p.name); setPolicyActionType("push"); }} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#22c55e" }}>配信</button>
                      <button onClick={() => { setShowPolicyAction(p.name); setPolicyActionType("rollback"); }} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626" }}>戻す</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Diff view */}
          {showDiff && DIFF_EXAMPLE[showDiff] && (
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>{showDiff} — バージョン比較</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", marginBottom: 6 }}>- 前版 (削除)</div>
                  <pre style={{ background: "#fef2f2", padding: "10px 14px", borderRadius: 8, fontSize: 11, color: "#dc2626", margin: 0, lineHeight: 1.6 }}>{DIFF_EXAMPLE[showDiff].removed.join("\n")}</pre>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", marginBottom: 6 }}>+ 現行版 (追加)</div>
                  <pre style={{ background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, fontSize: 11, color: "#16a34a", margin: 0, lineHeight: 1.6 }}>{DIFF_EXAMPLE[showDiff].added.join("\n")}</pre>
                </div>
              </div>
              <button onClick={() => setShowDiff(null)} style={{ marginTop: 8, padding: "4px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" }}>閉じる</button>
            </div>
          )}
          {/* Policy action modal */}
          {showPolicyAction && (
            <div style={{ ...cardStyle, marginBottom: 16, background: policyActionType === "rollback" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${policyActionType === "rollback" ? "#fecaca" : "#bbf7d0"}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: policyActionType === "rollback" ? "#dc2626" : "#16a34a", marginBottom: 10 }}>
                {policyActionType === "rollback" ? "ポリシーロールバック" : "ポリシー配信"} — {showPolicyAction}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>配信スケジュール</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ id: "immediate", label: "即時配信" }, { id: "scheduled", label: "日時指定" }, { id: "maintenance", label: "メンテナンス窓" }].map(s => (
                    <button key={s.id} onClick={() => setPolicySchedule(s.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer", background: policySchedule === s.id ? "#eff6ff" : "#fff", color: policySchedule === s.id ? "#2563eb" : "#64748b", fontWeight: policySchedule === s.id ? 600 : 400 }}>{s.label}</button>
                  ))}
                </div>
              </div>
              {policySchedule === "scheduled" && (
                <div style={{ marginBottom: 12 }}>
                  <input type="datetime-local" defaultValue="2026-05-07T02:00" style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>対象</label>
                <select style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }}>
                  <option>全端末 (10台)</option>
                  <option>未適用端末のみ</option>
                  <option>standard プロファイルのみ</option>
                  <option>field プロファイルのみ</option>
                  <option>kiosk プロファイルのみ</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { executeAction(policyActionType === "rollback" ? "ポリシーロールバック" : "ポリシー配信", showPolicyAction); setShowPolicyAction(null); }} style={{ padding: "6px 16px", borderRadius: 6, background: policyActionType === "rollback" ? "#dc2626" : "#22c55e", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{policyActionType === "rollback" ? "ロールバック実行" : "配信実行"}</button>
                <button onClick={() => setShowPolicyAction(null)} style={{ padding: "6px 16px", borderRadius: 6, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" }}>キャンセル</button>
              </div>
            </div>
          )}
          {/* Per-device policy status */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>端末別ポリシー適用状態</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>端末ID</th>
                {POLICIES_FULL.slice(0, 4).map(p => <th key={p.name} style={{ ...thStyle, fontSize: 9 }}>{p.name.split(" ")[0]}</th>)}
                <th style={thStyle}>操作</th>
              </tr></thead>
              <tbody>{DEVICES_DATA.map(d => {
                const aaOk = d.apparmor === "有効";
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500 }}>{d.id}</td>
                    <td style={tdStyle}><span style={{ fontSize: 10, color: aaOk ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{aaOk ? "✓" : "✗"}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>✓</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>✓</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>✓</span></td>
                    <td style={tdStyle}>
                      {!aaOk && <button onClick={() => executeAction("ポリシー再配信", d.id + " — AppArmor")} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626" }}>再配信</button>}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Policy Templates */}
      {activeTab === "templates" && (
        <TemplatesTab executeAction={executeAction} />
      )}

      {/* Vulnerabilities */}
      {activeTab === "vulnerabilities" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { label: "検出CVE", val: VULN_DATA.length + "件", color: "#f59e0b" },
              { label: "影響端末", val: [...new Set(VULN_DATA.flatMap(v => v.devices))].length + "台", color: "#ef4444" },
              { label: "修正版あり", val: VULN_DATA.filter(v => v.status === "修正版あり").length + "件", color: "#22c55e" },
            ].map((s, i) => (
              <div key={i} style={{ ...cardStyle, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>検出された脆弱性</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                {["CVE ID", "パッケージ", "導入版", "修正版", "深刻度", "影響端末", "状態", "操作"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>{VULN_DATA.map((v, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500 }}>{v.cve}</td>
                  <td style={{ ...tdStyle, color: "#475569" }}>{v.pkg}</td>
                  <td style={tdStyle}><code style={{ fontSize: 11, color: "#dc2626" }}>{v.installed}</code></td>
                  <td style={tdStyle}><code style={{ fontSize: 11, color: "#22c55e" }}>{v.fixed}</code></td>
                  <td style={tdStyle}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: v.severity === "Medium" ? "#fffbeb" : "#f0fdf4", color: v.severity === "Medium" ? "#f59e0b" : "#22c55e" }}>{v.severity}</span></td>
                  <td style={{ ...tdStyle, color: "#475569" }}>{v.devices.join(", ")}</td>
                  <td style={tdStyle}><span style={{ fontSize: 10, color: "#22c55e", fontWeight: 500 }}>{v.status}</span></td>
                  <td style={tdStyle}><button onClick={() => executeAction("パッチ適用", v.cve + " → " + v.fixed)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #bbf7d0", fontSize: 10, cursor: "pointer", background: "#f0fdf4", color: "#22c55e", fontWeight: 600 }}>パッチ適用</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Report */}
      {activeTab === "report" && (
        <div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>セキュリティ監査レポート生成</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>レポート内容</div>
                {["フリートコンプライアンススコア推移", "端末別セキュリティ適合状態", "ポリシー適用状況サマリー", "セキュリティイベント集計", "脆弱性検出・対応状況", "更新リング展開履歴", "隔離端末履歴", "推奨改善アクション"].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb", flexShrink: 0 }}></span>
                    <span style={{ color: "#475569" }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>レポートサマリー (プレビュー)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { k: "レポート日", v: "2026-05-06" },
                    { k: "フリートスコア", v: fleetScore + "/100" },
                    { k: "管理端末数", v: DEVICES_DATA.length + "台" },
                    { k: "完全適合端末", v: DEVICES_DATA.filter(d => complianceScore(d) === 100).length + "台" },
                    { k: "要対応端末", v: DEVICES_DATA.filter(d => complianceScore(d) < 100).length + "台" },
                    { k: "検出CVE", v: VULN_DATA.length + "件" },
                    { k: "隔離中端末", v: isolatedDevices.length + "台" },
                    { k: "未対応イベント", v: SECURITY_EVENTS.filter(e => e.severity === "critical").length + "件" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                      <span style={{ color: "#94a3b8" }}>{r.k}</span>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => executeAction("レポート生成", "PDF")} style={{ padding: "8px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📄 PDF レポート生成</button>
              <button onClick={() => executeAction("レポート生成", "CSV")} style={{ padding: "8px 20px", borderRadius: 8, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" }}>📊 CSV エクスポート</button>
            </div>
          </div>
        </div>
      )}

      {/* Action log */}
      {actionLog.length > 0 && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>操作ログ</span>
            <button onClick={() => setActionLog([])} style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>クリア</button>
          </div>
          {actionLog.slice(0, 10).map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < actionLog.length - 1 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{a.at}</span>
              <span style={{ fontWeight: 500, color: "#475569" }}>{a.action}</span>
              <span style={{ color: "#64748b" }}>{a.detail}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "完了" ? "#f0fdf4" : "#eff6ff", color: a.status === "完了" ? "#22c55e" : "#3b82f6" }}>{a.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.SecurityPage = SecurityPage;

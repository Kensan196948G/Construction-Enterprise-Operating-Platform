/* ─── Audit Log Page — Full Featured ─── */

const EXTENDED_AUDIT_LOG = [
  ...AUDIT_LOG,
  { at: "2026-05-06 09:29:00", actor: "system", action: "heartbeat.received", detail: "CDX-HQ-001 heartbeat 受信", reqId: "req-hb-001", device: "CDX-HQ-001" },
  { at: "2026-05-06 09:28:00", actor: "system", action: "heartbeat.received", detail: "CDX-HQ-002 heartbeat 受信", reqId: "req-hb-002", device: "CDX-HQ-002" },
  { at: "2026-05-06 09:27:00", actor: "system", action: "heartbeat.received", detail: "CDX-BR-010 heartbeat 受信", reqId: "req-hb-003", device: "CDX-BR-010" },
  { at: "2026-05-06 09:20:00", actor: "system", action: "alert.create", detail: "CDX-KSK-201 AppArmor 無効検知", reqId: "req-alert-001", device: "CDX-KSK-201" },
  { at: "2026-05-06 09:15:00", actor: "system", action: "policy.applied", detail: "CDX-HQ-001 nftables v2.1 適用完了", reqId: "req-pol-001", device: "CDX-HQ-001" },
  { at: "2026-05-06 09:10:00", actor: "admin", action: "device.isolate", detail: "CDX-KSK-201 ネットワーク隔離実行", reqId: "req-iso-001", device: "CDX-KSK-201" },
  { at: "2026-05-06 08:30:00", actor: "system", action: "auth.failure", detail: "HMAC署名不一致: unknown device CDX-FAKE-999", reqId: "req-auth-001", device: null },
  { at: "2026-05-06 08:00:00", actor: "admin", action: "ring.deploy", detail: "Ring 2 へ cdx-agent 0.2.0 展開開始", reqId: "req-ring-001", device: null },
  { at: "2026-05-05 18:00:00", actor: "admin", action: "policy.push", detail: "nftables v2.1 全端末配信", reqId: "req-pol-002", device: null },
  { at: "2026-05-05 17:00:00", actor: "system", action: "inventory.received", detail: "CDX-FLD-102 インベントリ受信", reqId: "req-inv-001", device: "CDX-FLD-102" },
  { at: "2026-05-05 16:00:00", actor: "suzuki", action: "iso_build.create", detail: "kiosk ISO ビルド開始", reqId: "req-b8c9d0", device: null },
  { at: "2026-05-05 15:30:00", actor: "system", action: "rate_limit.exceeded", detail: "CDX-FLD-102 heartbeat 12/min 超過", reqId: "req-rl-001", device: "CDX-FLD-102" },
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

  const actions = [...new Set(EXTENDED_AUDIT_LOG.map(a => a.action.split(".")[0]))];
  const devices = [...new Set(EXTENDED_AUDIT_LOG.filter(a => a.device).map(a => a.device))];

  // Auto refresh
  React.useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => setRefreshCount(c => c + 1), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filtering
  const filtered = EXTENDED_AUDIT_LOG
    .filter(a => filterAction === "all" || a.action.startsWith(filterAction))
    .filter(a => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (a.actor && a.actor.toLowerCase().includes(s)) || (a.detail && a.detail.toLowerCase().includes(s)) || (a.reqId && a.reqId.toLowerCase().includes(s)) || (a.action && a.action.toLowerCase().includes(s));
    })
    .filter(a => !deviceFilter || a.device === deviceFilter)
    .filter(a => !dateFrom || a.at >= dateFrom)
    .filter(a => !dateTo || a.at <= dateTo + " 23:59:59");

  // Trace: find all events with same reqId prefix
  const traceEvents = traceReqId ? EXTENDED_AUDIT_LOG.filter(a => a.reqId === traceReqId) : [];

  // Stats
  const actionCounts = {};
  const actorCounts = {};
  EXTENDED_AUDIT_LOG.forEach(a => {
    const aType = a.action.split(".")[0];
    actionCounts[aType] = (actionCounts[aType] || 0) + 1;
    actorCounts[a.actor] = (actorCounts[a.actor] || 0) + 1;
  });
  const maxActionCount = Math.max(...Object.values(actionCounts));
  const maxActorCount = Math.max(...Object.values(actorCounts));

  // Operation flows
  const FLOWS = {
    "iso_build": { label: "ISO ビルド→配布フロー", events: ["iso_build.create", "iso_build.complete", "iso_build.failed"] },
    "policy": { label: "ポリシー配信フロー", events: ["policy.push", "policy.applied"] },
    "ring": { label: "リング展開フロー", events: ["ring.deploy"] },
    "device": { label: "デバイス操作フロー", events: ["device.isolate"] },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>監査ログ</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>全操作のトレーサビリティ — request-id による E2E 追跡 ({EXTENDED_AUDIT_LOG.length}件)</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: autoRefresh ? "#f0fdf4" : "#f8fafc", border: "1px solid #e8ecf1" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: autoRefresh ? "#22c55e" : "#94a3b8", animation: autoRefresh ? "pulse 2s infinite" : "none" }}></span>
            <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ border: "none", background: "transparent", fontSize: 11, cursor: "pointer", color: autoRefresh ? "#22c55e" : "#64748b", fontWeight: 500 }}>{autoRefresh ? "自動更新 ON" : "自動更新 OFF"}</button>
          </div>
          <button onClick={() => setShowStats(!showStats)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: showStats ? "#eff6ff" : "#fff", color: showStats ? "#2563eb" : "#64748b" }}>📊 統計</button>
          <button onClick={() => setShowExport(!showExport)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: "#fff", color: "#64748b" }}>📥 エクスポート</button>
          <button onClick={() => setShowRetention(!showRetention)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: "#fff", color: "#64748b" }}>⚙ 保持設定</button>
        </div>
      </div>

      {/* Export options */}
      {showExport && (
        <div style={{ ...cardStyle, marginBottom: 12, padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>ログエクスポート</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowExport(false)} style={{ padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📄 CSV ({filtered.length}件)</button>
            <button onClick={() => setShowExport(false)} style={{ padding: "6px 14px", borderRadius: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" }}>{"{ }"} JSON ({filtered.length}件)</button>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>現在のフィルタ条件で出力</span>
          </div>
        </div>
      )}

      {/* Retention settings */}
      {showRetention && (
        <div style={{ ...cardStyle, marginBottom: 12, padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>ログ保持ポリシー</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>保持期間</span>
              <input type="range" min={30} max={365} value={retentionDays} onChange={e => setRetentionDays(Number(e.target.value))} style={{ width: 120 }} />
              <span style={{ fontWeight: 600, color: "#2563eb" }}>{retentionDays}日</span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>超過ログは自動アーカイブ (MinIO/S3 に圧縮保管)</div>
            <button onClick={() => setShowRetention(false)} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, cursor: "pointer" }}>保存</button>
          </div>
        </div>
      )}

      {/* Statistics */}
      {showStats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>アクション種別集計</div>
            {Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).map(([k, v], i) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <code style={{ color: "#475569", width: 100, fontWeight: 500 }}>{k}</code>
                <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${(v / maxActionCount) * 100}%`, background: "#3b82f6", borderRadius: 4 }}></div>
                </div>
                <span style={{ fontWeight: 600, color: "#2563eb", width: 30, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>アクター別集計</div>
            {Object.entries(actorCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12 }}>
                <span style={{ color: "#475569", width: 80, fontWeight: 500 }}>{k}</span>
                <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${(v / maxActorCount) * 100}%`, background: "#8b5cf6", borderRadius: 4 }}></div>
                </div>
                <span style={{ fontWeight: 600, color: "#8b5cf6", width: 30, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter controls */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        {/* Action filter */}
        <button onClick={() => setFilterAction("all")} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: filterAction === "all" ? "#eff6ff" : "#fff", color: filterAction === "all" ? "#2563eb" : "#64748b", fontWeight: filterAction === "all" ? 600 : 400 }}>全て</button>
        {actions.map(a => (
          <button key={a} onClick={() => setFilterAction(filterAction === a ? "all" : a)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: filterAction === a ? "#eff6ff" : "#fff", color: filterAction === a ? "#2563eb" : "#64748b", fontWeight: filterAction === a ? 600 : 400 }}>{a}</button>
        ))}
        <span style={{ color: "#e2e8f0" }}>|</span>
        {/* Search */}
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 アクター / 詳細 / Request ID..." style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, width: 200, color: "#0f172a" }} />
        {/* Device filter */}
        <select value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, color: "#475569" }}>
          <option value="">全端末</option>
          {devices.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {/* Date range */}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, color: "#475569" }} />
        <span style={{ fontSize: 11, color: "#94a3b8" }}>〜</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, color: "#475569" }} />
        {(search || deviceFilter || dateFrom || dateTo || filterAction !== "all") && (
          <button onClick={() => { setSearch(""); setDeviceFilter(""); setDateFrom(""); setDateTo(""); setFilterAction("all"); }} style={{ padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 11, cursor: "pointer", background: "#fef2f2", color: "#dc2626" }}>クリア</button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{filtered.length}件 表示中</span>
      </div>

      {/* Operation flow buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>フロー追跡:</span>
        {Object.entries(FLOWS).map(([k, v]) => (
          <button key={k} onClick={() => setShowFlow(showFlow === k ? null : k)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: showFlow === k ? "#eff6ff" : "#fff", color: showFlow === k ? "#2563eb" : "#64748b", fontWeight: showFlow === k ? 600 : 400 }}>{v.label}</button>
        ))}
      </div>

      {/* Flow visualization */}
      {showFlow && (
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>{FLOWS[showFlow].label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {EXTENDED_AUDIT_LOG.filter(a => FLOWS[showFlow].events.some(e => a.action === e) || a.action.startsWith(showFlow)).map((a, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#2563eb", border: "2px solid #bfdbfe", flexShrink: 0 }}></div>
                  {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "#e2e8f0" }}></div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{a.at}</span>
                    <code style={{ fontSize: 10, background: "#f1f5f9", padding: "1px 6px", borderRadius: 3, color: "#475569" }}>{a.action}</code>
                    <span style={{ color: "#475569" }}>{a.actor}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{a.detail}</div>
                </div>
                <button onClick={() => setTraceReqId(a.reqId)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 9, cursor: "pointer", background: "#fff", color: "#2563eb", flexShrink: 0, alignSelf: "center" }}>{a.reqId}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request ID trace panel */}
      {traceReqId && (
        <div style={{ ...cardStyle, marginBottom: 12, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>Request ID 追跡: <code style={{ background: "#dbeafe", padding: "2px 8px", borderRadius: 4 }}>{traceReqId}</code></div>
            <button onClick={() => setTraceReqId(null)} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #bfdbfe", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" }}>閉じる</button>
          </div>
          {traceEvents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {traceEvents.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#fff", borderRadius: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0 }}></span>
                  <span style={{ color: "#94a3b8", fontSize: 11, width: 130 }}>{a.at}</span>
                  <span style={{ fontWeight: 500, color: "#475569" }}>{a.actor}</span>
                  <code style={{ fontSize: 10, background: "#f1f5f9", padding: "1px 6px", borderRadius: 3, color: "#475569" }}>{a.action}</code>
                  <span style={{ flex: 1, color: "#64748b" }}>{a.detail}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>この Request ID に関連するイベントは1件のみです</div>
          )}
        </div>
      )}

      {/* Main log table */}
      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8fafc" }}>
            {["日時", "アクター", "アクション", "端末", "詳細", "Request ID"].map(h =>
              <th key={h} style={thStyle}>{h}</th>
            )}
          </tr></thead>
          <tbody>{filtered.map((a, i) => {
            const isTraced = traceReqId && a.reqId === traceReqId;
            return (
              <tr key={i} style={{ borderTop: "1px solid #f1f5f9", background: isTraced ? "#eff6ff" : "" }}>
                <td style={{ ...tdStyle, color: "#94a3b8", whiteSpace: "nowrap", fontSize: 11 }}>{a.at}</td>
                <td style={{ ...tdStyle, color: "#475569", fontWeight: 500 }}>{a.actor}</td>
                <td style={tdStyle}><code style={{ fontSize: 10, background: "#f1f5f9", padding: "2px 6px", borderRadius: 3, color: "#475569" }}>{a.action}</code></td>
                <td style={{ ...tdStyle, color: a.device ? "#2563eb" : "#cbd5e1", fontWeight: a.device ? 500 : 400, fontSize: 11 }}>{a.device || "—"}</td>
                <td style={{ ...tdStyle, color: "#475569", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</td>
                <td style={tdStyle}>
                  <button onClick={() => setTraceReqId(traceReqId === a.reqId ? null : a.reqId)} style={{ padding: "1px 6px", borderRadius: 3, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: isTraced ? "#2563eb" : "#fff", color: isTraced ? "#fff" : "#94a3b8", fontFamily: "monospace" }}>{a.reqId}</button>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
};

window.LogsPage = LogsPage;

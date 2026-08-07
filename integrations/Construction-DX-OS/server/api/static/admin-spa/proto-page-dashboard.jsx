/* ─── Dashboard Page ─── */
const DashboardPage = () => {
  const [liveData, setLiveData] = React.useState(null);

  React.useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/v1/dashboard', { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setLiveData(d); })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const totalDevices = liveData ? liveData.devices.total : DEVICES_DATA.length;
  const liveOnline   = liveData ? liveData.devices.online : onlineN;
  const liveOffline  = liveData ? liveData.devices.offline : offlineN;
  const liveWarning  = liveData ? liveData.devices.warning : warnN;
  const totalIso     = liveData ? liveData.iso_builds.total : ISO_JOBS_DATA.length;
  const isoSucceeded = liveData ? liveData.iso_builds.succeeded : ISO_JOBS_DATA.filter(j=>j.status==="succeeded").length;
  const isoRunning   = liveData ? liveData.iso_builds.running : ISO_JOBS_DATA.filter(j=>j.status==="running").length;
  const liveTag      = liveData ? <span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:"#d1fae5",color:"#065f46",marginLeft:4}}>LIVE</span> : null;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "管理端末数", val: totalDevices, unit: "台", color: "#2563eb", sub: "5拠点 / 3プロファイル" },
          { label: "オンライン", val: liveOnline, unit: "台", color: "#22c55e", sub: `${liveOffline} 停止 / ${liveWarning} 警告` },
          { label: "ISO ビルド", val: totalIso, unit: "件", color: "#8b5cf6", sub: `${isoSucceeded} 成功 / ${isoRunning} 実行中` },
          { label: "セキュリティ適合", val: Math.round(((DEVICES_DATA.length - aaDisabledN) / Math.max(DEVICES_DATA.length, 1)) * 100), unit: "%", color: aaDisabledN > 0 ? "#f59e0b" : "#22c55e", sub: `AppArmor未適用: ${aaDisabledN}台` },
          { label: "Agent未更新", val: oldAgentN, unit: "台", color: oldAgentN > 0 ? "#f59e0b" : "#22c55e", sub: "最新: v0.2.0" },
        ].map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{s.label}{i < 3 ? liveTag : null}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      {/* Alerts */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>アラート・通知</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>未対応: {ALERTS_DATA.filter(a => !a.ack).length}件</span>
        </div>
        {ALERTS_DATA.slice(0, 5).map((a, i) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: aColor(a.level), flexShrink: 0 }}></span>
            <span style={{ flex: 1, color: "#475569" }}>{a.msg}</span>
            <span style={{ color: "#cbd5e1", fontSize: 11, flexShrink: 0 }}>{a.time.split(" ")[1]}</span>
            {!a.ack && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#fef2f2", color: "#ef4444", fontWeight: 500 }}>未対応</span>}
          </div>
        ))}
      </div>
      {/* Two-col */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        {/* Devices summary */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>端末一覧</span>
            <span style={{ fontSize: 11, color: "#2563eb", cursor: "pointer" }}>端末管理 →</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {["端末ID", "拠点", "プロファイル", "状態", "Agent", "リング", "最終HB"].map(h =>
                <th key={h} style={thStyle}>{h}</th>
              )}
            </tr></thead>
            <tbody>{DEVICES_DATA.map(d => (
              <tr key={d.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500 }}>{d.id}</td>
                <td style={{ ...tdStyle, color: "#475569" }}>{d.location}</td>
                <td style={tdStyle}><span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" }}>{d.profile}</span></td>
                <td style={tdStyle}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: sBg(d.status), color: sColor(d.status) }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: sColor(d.status) }}></span>{sLabel(d.status)}
                  </span>
                </td>
                <td style={{ ...tdStyle, color: d.agent === "0.2.0" ? "#475569" : "#f59e0b", fontWeight: d.agent !== "0.2.0" ? 600 : 400 }}>v{d.agent}</td>
                <td style={{ ...tdStyle, color: "#64748b", fontSize: 11 }}>{d.ring}</td>
                <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 11 }}>{d.lastHb.split(" ")[1]}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ISO */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>ISO 配布ジョブ</span>
              <span style={{ fontSize: 11, color: "#2563eb", cursor: "pointer" }}>ISO配布 →</span>
            </div>
            {ISO_JOBS_DATA.slice(0, 4).map(j => (
              <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: jBg(j.status), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>💿</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{j.profile} <span style={{ color: "#94a3b8" }}>#{j.id.slice(0, 8)}</span></div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{j.gitRef} · {j.requestedBy} · {j.createdAt.split(" ")[0]}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: jBg(j.status), color: jColor(j.status) }}>{jLabel(j.status)}</span>
              </div>
            ))}
          </div>
          {/* Security + Rings */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>セキュリティ</div>
              {[
                { label: "AppArmor", val: `${DEVICES_DATA.length - aaDisabledN}/${DEVICES_DATA.length}`, ok: aaDisabledN === 0 },
                { label: "Agent最新", val: `${DEVICES_DATA.length - oldAgentN}/${DEVICES_DATA.length}`, ok: oldAgentN === 0 },
                { label: "HMAC署名", val: "有効", ok: true },
                { label: "ポリシー", val: "適用済", ok: true },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11 }}>
                  <span style={{ color: "#64748b" }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: r.ok ? "#22c55e" : "#f59e0b" }}>{r.val}</span>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>更新リング</div>
              {RINGS_DATA.map((r, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
                    <span style={{ color: "#64748b" }}>{r.name.split(" (")[0]}</span>
                    <span style={{ fontWeight: 600, color: r.color }}>{r.count}</span>
                  </div>
                  <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${(r.count / DEVICES_DATA.length) * 100}%`, background: r.color, borderRadius: 3 }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.DashboardPage = DashboardPage;

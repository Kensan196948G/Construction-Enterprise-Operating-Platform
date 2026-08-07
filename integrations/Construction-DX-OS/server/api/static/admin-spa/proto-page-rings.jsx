/* ─── Rings Page — Full Update Ring Management ─── */

const UPDATE_PACKAGES = [
  { name: "cdx-agent", current: "0.2.0", prev: "0.1.9", type: "agent", size: "2.4 MB" },
  { name: "cdx-security-policy", current: "v2.1", prev: "v2.0", type: "policy", size: "48 KB" },
  { name: "linux-image-6.1.0-21", current: "6.1.0-21", prev: "6.1.0-20", type: "kernel", size: "68 MB" },
  { name: "construction-hub", current: "1.1.0", prev: "1.0.0", type: "app", size: "1.2 MB" },
];

const DEPLOY_HISTORY = [
  { id: "dep-006", pkg: "cdx-agent 0.2.0", ring: "Ring 1", startedAt: "2026-05-05 12:00", finishedAt: "2026-05-05 12:25", targets: 3, success: 3, failed: 0, status: "完了" },
  { id: "dep-005", pkg: "cdx-agent 0.2.0", ring: "Ring 2", startedAt: "2026-05-06 08:00", finishedAt: null, targets: 4, success: 2, failed: 0, status: "展開中" },
  { id: "dep-004", pkg: "cdx-security-policy v2.1", ring: "Ring 1", startedAt: "2026-05-04 14:00", finishedAt: "2026-05-04 14:05", targets: 3, success: 3, failed: 0, status: "完了" },
  { id: "dep-003", pkg: "cdx-security-policy v2.1", ring: "Ring 2", startedAt: "2026-05-05 14:00", finishedAt: "2026-05-05 14:08", targets: 4, success: 4, failed: 0, status: "完了" },
  { id: "dep-002", pkg: "cdx-agent 0.1.9", ring: "Ring 3", startedAt: "2026-05-03 10:00", finishedAt: "2026-05-03 10:30", targets: 3, success: 2, failed: 1, status: "部分失敗" },
  { id: "dep-001", pkg: "construction-hub 1.0.0", ring: "全リング", startedAt: "2026-04-28 09:00", finishedAt: "2026-04-28 10:15", targets: 10, success: 10, failed: 0, status: "完了" },
];

const AUTO_PROMOTE_RULES = {
  errorRateMax: 0,
  hbSuccessMin: 100,
  stableHours: 24,
  approvalRequired: { "Ring 0": false, "Ring 1": false, "Ring 2": true, "Ring 3": true },
};

const RingsPage = () => {
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
    { id: "apr-001", pkg: "cdx-agent 0.2.0", fromRing: "Ring 2", toRing: "Ring 3", requestedAt: "2026-05-06 09:00", status: "承認待ち" },
  ]);

  const ringHealth = RINGS_DATA.map(r => {
    const devs = r.devices.map(did => DEVICES_DATA.find(x => x.id === did)).filter(Boolean);
    const online = devs.filter(d => d.status === "online").length;
    const total = devs.length;
    const avgCpu = total > 0 ? Math.round(devs.reduce((s, d) => s + (d.status !== "offline" ? d.cpu : 0), 0) / Math.max(1, online)) : 0;
    const avgMem = total > 0 ? Math.round(devs.reduce((s, d) => s + (d.status !== "offline" ? d.mem : 0), 0) / Math.max(1, online)) : 0;
    const oldAgent = devs.filter(d => d.agent !== "0.2.0").length;
    const hbRate = total > 0 ? Math.round((online / total) * 100) : 0;
    return { ...r, devs, online, total, avgCpu, avgMem, oldAgent, hbRate, errorRate: total > 0 ? Math.round((devs.filter(d => d.status === "warning" || d.status === "offline").length / total) * 100) : 0 };
  });

  const executeAction = (action, detail) => {
    const now = new Date().toLocaleTimeString("ja-JP");
    setActionLog(prev => [{ at: now, action, detail, status: "実行中" }, ...prev]);
    setTimeout(() => setActionLog(prev => prev.map((l, i) => i === 0 ? { ...l, status: "完了" } : l)), 1500);
  };

  const approvePromotion = (aprId) => {
    setApprovalQueue(prev => prev.map(a => a.id === aprId ? { ...a, status: "承認済み" } : a));
    executeAction("昇格承認", `${approvalQueue.find(a => a.id === aprId)?.pkg} → ${approvalQueue.find(a => a.id === aprId)?.toRing}`);
  };

  const rejectPromotion = (aprId) => {
    setApprovalQueue(prev => prev.map(a => a.id === aprId ? { ...a, status: "却下" } : a));
  };

  // Deploy new update view
  if (showDeploy) {
    return (
      <div>
        <button onClick={() => setShowDeploy(false)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← リング管理へ戻る</button>
        <div style={{ ...cardStyle, maxWidth: 640 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>更新展開</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>更新パッケージ</label>
              <select value={deployPkg} onChange={e => setDeployPkg(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}>
                <option value="">パッケージを選択...</option>
                {UPDATE_PACKAGES.map(p => <option key={p.name} value={p.name}>{p.name} {p.prev} → {p.current} ({p.size})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>展開先リング</label>
              <select value={deployRing} onChange={e => setDeployRing(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}>
                <option value="">リングを選択...</option>
                {RINGS_DATA.map(r => <option key={r.name} value={r.name}>{r.name} ({r.count}台)</option>)}
              </select>
            </div>
            {deployRing && rules.approvalRequired[deployRing.split(" ")[0] + " " + deployRing.split(" ")[1]?.replace("(", "").replace(")", "")] && (
              <div style={{ padding: "10px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a", fontSize: 12, color: "#92400e" }}>
                ⚠️ このリングへの展開には管理者承認が必要です
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>メモ</label>
              <textarea rows={2} placeholder="展開理由..." style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}></textarea>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { executeAction("更新展開開始", `${deployPkg} → ${deployRing}`); setShowDeploy(false); }} disabled={!deployPkg || !deployRing} style={{ padding: "8px 20px", borderRadius: 8, background: deployPkg && deployRing ? "#2563eb" : "#e2e8f0", color: deployPkg && deployRing ? "#fff" : "#94a3b8", border: "none", fontSize: 13, fontWeight: 600, cursor: deployPkg && deployRing ? "pointer" : "not-allowed" }}>展開開始</button>
              <button onClick={() => setShowDeploy(false)} style={{ padding: "8px 20px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer" }}>キャンセル</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>更新リング管理</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>段階配信によるOS・Agent更新の安全な展開 (Ring 0→1→2→3)</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAutoRules(!showAutoRules)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 12, cursor: "pointer", background: "#fff", color: "#64748b" }}>⚙ 自動昇格ルール</button>
          <button onClick={() => setShowDeploy(true)} style={{ padding: "6px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 更新展開</button>
        </div>
      </div>

      {/* Auto-promote rules */}
      {showAutoRules && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>自動昇格ルール・ロールバックトリガー</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>自動昇格条件 (全て満たすと次リングへ展開)</div>
              {[
                { label: "エラー率上限", key: "errorRateMax", unit: "%", min: 0, max: 10 },
                { label: "HB成功率下限", key: "hbSuccessMin", unit: "%", min: 90, max: 100 },
                { label: "安定時間", key: "stableHours", unit: "時間", min: 1, max: 72 },
              ].map(r => (
                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 12 }}>
                  <span style={{ color: "#64748b", width: 120 }}>{r.label}</span>
                  <input type="range" min={r.min} max={r.max} value={rules[r.key]} onChange={e => setRules(prev => ({ ...prev, [r.key]: Number(e.target.value) }))} style={{ width: 120 }} />
                  <span style={{ fontWeight: 600, color: "#2563eb", width: 50 }}>{rules[r.key]}{r.unit}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>展開承認ゲート</div>
              {RINGS_DATA.map((r, i) => {
                const key = r.name.split(" (")[0];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                    <span style={{ color: "#475569" }}>{r.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: rules.approvalRequired[key] ? "#f59e0b" : "#22c55e" }}>{rules.approvalRequired[key] ? "承認必須" : "自動展開"}</span>
                      <button onClick={() => setRules(prev => ({ ...prev, approvalRequired: { ...prev.approvalRequired, [key]: !prev.approvalRequired[key] } }))} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: rules.approvalRequired[key] ? "#fffbeb" : "#f0fdf4", color: rules.approvalRequired[key] ? "#f59e0b" : "#22c55e" }}>
                        {rules.approvalRequired[key] ? "🔒" : "🔓"}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 10, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, fontSize: 11, color: "#dc2626" }}>
                <b>ロールバック自動トリガー:</b> エラー率 {">"} {rules.errorRateMax}% または HB成功率 {"<"} {rules.hbSuccessMin}% 検知時に前版へ自動切り戻し
              </div>
            </div>
          </div>
          <button onClick={() => setShowAutoRules(false)} style={{ marginTop: 10, padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>保存</button>
        </div>
      )}

      {/* Approval queue */}
      {approvalQueue.filter(a => a.status === "承認待ち").length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16, background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>承認待ちの展開 ({approvalQueue.filter(a => a.status === "承認待ち").length}件)</div>
          {approvalQueue.filter(a => a.status === "承認待ち").map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #fef3c7" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{a.pkg}</div>
                <div style={{ fontSize: 11, color: "#92400e" }}>{a.fromRing} → {a.toRing} · {a.requestedAt}</div>
              </div>
              <button onClick={() => approvePromotion(a.id)} style={{ padding: "5px 14px", borderRadius: 6, background: "#22c55e", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✓ 承認</button>
              <button onClick={() => rejectPromotion(a.id)} style={{ padding: "5px 14px", borderRadius: 6, background: "#fff", color: "#dc2626", border: "1px solid #fecaca", fontSize: 11, cursor: "pointer" }}>✗ 却下</button>
            </div>
          ))}
        </div>
      )}

      {/* Ring cards with health */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {ringHealth.map((r, i) => (
          <div key={i} onClick={() => setSelectedRing(selectedRing === i ? null : i)} style={{ ...cardStyle, cursor: "pointer", borderTop: `3px solid ${r.color}`, background: selectedRing === i ? "#fafbfd" : "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{r.name}</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.count}</span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{r.desc}</div>
            {/* Health bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              <div style={{ fontSize: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}><span>HB成功率</span><span style={{ fontWeight: 600, color: r.hbRate >= rules.hbSuccessMin ? "#22c55e" : "#ef4444" }}>{r.hbRate}%</span></div>
                <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 2 }}><div style={{ height: "100%", width: r.hbRate + "%", background: r.hbRate >= rules.hbSuccessMin ? "#22c55e" : "#ef4444", borderRadius: 2 }}></div></div>
              </div>
              <div style={{ fontSize: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}><span>エラー率</span><span style={{ fontWeight: 600, color: r.errorRate <= rules.errorRateMax ? "#22c55e" : "#ef4444" }}>{r.errorRate}%</span></div>
                <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 2 }}><div style={{ height: "100%", width: r.errorRate + "%", background: r.errorRate <= rules.errorRateMax ? "#22c55e" : "#ef4444", borderRadius: 2 }}></div></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, fontSize: 10 }}>
              <span style={{ padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#64748b" }}>CPU {r.avgCpu}%</span>
              <span style={{ padding: "1px 6px", borderRadius: 3, background: "#f1f5f9", color: "#64748b" }}>MEM {r.avgMem}%</span>
              {r.oldAgent > 0 && <span style={{ padding: "1px 6px", borderRadius: 3, background: "#fffbeb", color: "#f59e0b" }}>旧版 {r.oldAgent}</span>}
            </div>
            {/* Promote / Rollback buttons */}
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {i < 3 && r.count > 0 && (
                <button onClick={(e) => { e.stopPropagation(); executeAction("昇格", `${r.name} → ${RINGS_DATA[i + 1]?.name}`); }} style={{ flex: 1, padding: "4px", borderRadius: 5, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb", fontWeight: 500 }}>↗ 昇格</button>
              )}
              {r.count > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setShowRollback(i); }} style={{ flex: 1, padding: "4px", borderRadius: 5, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626", fontWeight: 500 }}>↩ ロールバック</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rollback modal */}
      {showRollback !== null && (
        <div style={{ ...cardStyle, marginBottom: 16, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 10 }}>ロールバック — {RINGS_DATA[showRollback]?.name}</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>対象リングの全端末を前版に切り戻します。</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {UPDATE_PACKAGES.map(p => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "#fff", borderRadius: 6, fontSize: 12 }}>
                <span style={{ fontWeight: 500, color: "#0f172a", flex: 1 }}>{p.name}</span>
                <span style={{ color: "#dc2626" }}>{p.current}</span>
                <span style={{ color: "#94a3b8" }}>→</span>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>{p.prev}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { executeAction("ロールバック実行", RINGS_DATA[showRollback]?.name); setShowRollback(null); }} style={{ padding: "6px 16px", borderRadius: 6, background: "#dc2626", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>ロールバック実行</button>
            <button onClick={() => setShowRollback(null)} style={{ padding: "6px 16px", borderRadius: 6, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" }}>キャンセル</button>
          </div>
        </div>
      )}

      {/* Selected ring detail: device list + move */}
      {selectedRing !== null && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: 0 }}>{RINGS_DATA[selectedRing].name} — 所属端末</h3>
          </div>
          {RINGS_DATA[selectedRing].devices.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                {["端末ID", "拠点", "ホスト名", "プロファイル", "Agent", "状態", "リング移動"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>{RINGS_DATA[selectedRing].devices.map(did => {
                const d = DEVICES_DATA.find(x => x.id === did);
                if (!d) return null;
                return (
                  <tr key={d.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500 }}>{d.id}</td>
                    <td style={{ ...tdStyle, color: "#475569" }}>{d.location}</td>
                    <td style={{ ...tdStyle, color: "#475569" }}>{d.hostname}</td>
                    <td style={tdStyle}><span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" }}>{d.profile}</span></td>
                    <td style={{ ...tdStyle, color: d.agent === "0.2.0" ? "#475569" : "#f59e0b", fontWeight: d.agent !== "0.2.0" ? 600 : 400 }}>v{d.agent}</td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: sBg(d.status), color: sColor(d.status) }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: sColor(d.status) }}></span>{sLabel(d.status)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <select defaultValue="" onChange={e => { if (e.target.value) { executeAction("リング移動", `${d.id}: ${RINGS_DATA[selectedRing].name} → ${e.target.value}`); e.target.value = ""; } }} style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 10, color: "#475569" }}>
                          <option value="">移動先...</option>
                          {RINGS_DATA.filter((_, ri) => ri !== selectedRing).map(r => <option key={r.name} value={r.name}>{r.name.split(" (")[0]}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          ) : <p style={{ fontSize: 12, color: "#94a3b8" }}>このリングに端末は割り当てられていません。</p>}
        </div>
      )}

      {/* Update packages */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>配信パッケージ</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8fafc" }}>
            {["パッケージ名", "種別", "前版", "現行版", "サイズ", "Ring 0", "Ring 1", "Ring 2", "Ring 3"].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>{UPDATE_PACKAGES.map((p, i) => {
            const ringStatus = (ringIdx) => {
              if (p.name === "cdx-agent") {
                const devs = RINGS_DATA[ringIdx].devices.map(did => DEVICES_DATA.find(x => x.id === did)).filter(Boolean);
                const updated = devs.filter(d => d.agent === p.current).length;
                return { updated, total: devs.length };
              }
              return { updated: RINGS_DATA[ringIdx].count, total: RINGS_DATA[ringIdx].count };
            };
            return (
              <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ ...tdStyle, fontWeight: 500, color: "#0f172a" }}>{p.name}</td>
                <td style={tdStyle}><span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" }}>{p.type}</span></td>
                <td style={{ ...tdStyle, color: "#94a3b8" }}>{p.prev}</td>
                <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 600 }}>{p.current}</td>
                <td style={{ ...tdStyle, color: "#94a3b8" }}>{p.size}</td>
                {[0, 1, 2, 3].map(ri => {
                  const rs = ringStatus(ri);
                  const pct = rs.total > 0 ? Math.round((rs.updated / rs.total) * 100) : 0;
                  return (
                    <td key={ri} style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 40, height: 4, background: "#f1f5f9", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: pct + "%", background: pct === 100 ? "#22c55e" : pct > 0 ? "#3b82f6" : "#e2e8f0", borderRadius: 2 }}></div>
                        </div>
                        <span style={{ fontSize: 10, color: pct === 100 ? "#22c55e" : "#64748b", fontWeight: 500 }}>{rs.updated}/{rs.total}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}</tbody>
        </table>
      </div>

      {/* Deployment flow */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>段階配信フロー</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {ringHealth.map((r, i) => (
            <React.Fragment key={i}>
              <div style={{ flex: 1, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, borderLeft: `3px solid ${r.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{r.name}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{r.count}台</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4, fontSize: 9 }}>
                  <span style={{ color: r.hbRate >= rules.hbSuccessMin ? "#22c55e" : "#ef4444" }}>HB {r.hbRate}%</span>
                  <span style={{ color: r.errorRate <= rules.errorRateMax ? "#22c55e" : "#ef4444" }}>Err {r.errorRate}%</span>
                </div>
                {rules.approvalRequired[r.name.split(" (")[0]] && <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 2 }}>🔒 承認必須</div>}
              </div>
              {i < RINGS_DATA.length - 1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 14, color: "#cbd5e1" }}>→</span>
                  <span style={{ fontSize: 8, color: "#94a3b8" }}>{rules.stableHours}h</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#64748b", padding: "8px 12px", background: "#eff6ff", borderRadius: 8 }}>
          自動昇格条件: エラー率 ≤ {rules.errorRateMax}% / HB成功率 ≥ {rules.hbSuccessMin}% / 安定時間 ≥ {rules.stableHours}時間 → 条件充足で次リングへ自動展開
        </div>
      </div>

      {/* Deployment history */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>展開履歴</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: "#f8fafc" }}>
            {["ID", "パッケージ", "対象リング", "開始", "完了", "対象", "成功", "失敗", "ステータス"].map(h => <th key={h} style={thStyle}>{h}</th>)}
          </tr></thead>
          <tbody>{DEPLOY_HISTORY.map((d, i) => (
            <tr key={d.id} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500 }}>{d.id}</td>
              <td style={{ ...tdStyle, color: "#475569" }}>{d.pkg}</td>
              <td style={tdStyle}><span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" }}>{d.ring}</span></td>
              <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 11 }}>{d.startedAt}</td>
              <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 11 }}>{d.finishedAt || "—"}</td>
              <td style={{ ...tdStyle, color: "#475569" }}>{d.targets}台</td>
              <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 600 }}>{d.success}</td>
              <td style={{ ...tdStyle, color: d.failed > 0 ? "#ef4444" : "#94a3b8", fontWeight: d.failed > 0 ? 600 : 400 }}>{d.failed}</td>
              <td style={tdStyle}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                  background: d.status === "完了" ? "#f0fdf4" : d.status === "展開中" ? "#eff6ff" : "#fef2f2",
                  color: d.status === "完了" ? "#22c55e" : d.status === "展開中" ? "#3b82f6" : "#ef4444"
                }}>{d.status}</span>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Action log */}
      {actionLog.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>操作ログ</span>
            <button onClick={() => setActionLog([])} style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>クリア</button>
          </div>
          {actionLog.slice(0, 10).map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < actionLog.length - 1 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
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

window.RingsPage = RingsPage;

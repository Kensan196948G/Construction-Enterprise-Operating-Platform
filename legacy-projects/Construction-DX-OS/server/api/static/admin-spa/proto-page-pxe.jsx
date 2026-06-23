/* ─── PXE 展開管理ページ ─── */

const PXE_PROFILES = [
  { id: "standard", label: "standard", desc: "事務・本社端末", count: 5, color: "#3b82f6" },
  { id: "field",    label: "field",    desc: "現場・巡回端末", count: 3, color: "#f59e0b" },
  { id: "kiosk",   label: "kiosk",   desc: "受付・共用端末", count: 2, color: "#8b5cf6" },
];

const PXE_EVENTS = [
  { id: 1, at: "2026-05-14 09:12", device: "CDX-HQ-001", profile: "standard", event: "boot_request", status: "ok",   detail: "PXE ブートリクエスト受信 — ISO v1.0.0 配信開始" },
  { id: 2, at: "2026-05-14 09:14", device: "CDX-HQ-001", profile: "standard", event: "install_done",  status: "ok",   detail: "OS インストール完了 — 初回 heartbeat 送信" },
  { id: 3, at: "2026-05-14 08:50", device: "CDX-FLD-102", profile: "field",   event: "boot_request", status: "ok",   detail: "PXE ブートリクエスト受信 — ISO v1.0.0 (field) 配信" },
  { id: 4, at: "2026-05-14 08:52", device: "CDX-FLD-102", profile: "field",   event: "install_done",  status: "ok",   detail: "OS インストール完了" },
  { id: 5, at: "2026-05-13 17:30", device: "CDX-KSK-201", profile: "kiosk",  event: "rollback",      status: "warn", detail: "ロールバック実行 — v1.0.0-rc2 → v0.9.0 (AppArmor 問題)" },
  { id: 6, at: "2026-05-13 17:35", device: "CDX-KSK-201", profile: "kiosk",  event: "install_done",  status: "ok",   detail: "ロールバック完了 — v0.9.0 稼働中" },
  { id: 7, at: "2026-05-13 12:00", device: "CDX-HQ-003", profile: "standard", event: "boot_request", status: "fail", detail: "PXE ブート失敗 — DHCP タイムアウト (NIC driver 問題)" },
  { id: 8, at: "2026-05-12 10:00", device: "CDX-BR-010", profile: "standard", event: "boot_request", status: "ok",  detail: "PXE ブートリクエスト受信 — ISO v1.0.0 配信" },
];

const ROLLBACK_PATTERNS = [
  { id: "single",    icon: "🖥️",  label: "単体ロールバック",   desc: "指定端末1台をロールバック" },
  { id: "profile",   icon: "🏷️",  label: "プロファイル一括",   desc: "同プロファイルの全端末を一括ロールバック" },
  { id: "ring",      icon: "🔄",  label: "リング単位",          desc: "更新リング単位でロールバック" },
  { id: "emergency", icon: "🚨",  label: "緊急全端末",          desc: "全端末を即時ロールバック (重大障害時)" },
];

Object.assign(window, { PXE_PROFILES, PXE_EVENTS, ROLLBACK_PATTERNS });

/* ─────────────────────────────────────── */
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
    { id: "status",   label: "展開ステータス", icon: "📡" },
    { id: "rollback", label: "ロールバック",   icon: "🔙" },
    { id: "log",      label: "PXE イベントログ", icon: "📋" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          🖥️ PXE 展開管理
        </h2>
        <p style={{ fontSize: 12, color: "#64748b" }}>
          PXE ネットブートによる OS 展開状況の確認、ロールバック実行、展開イベントログを管理します。
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "展開済み端末",   value: "9台",     icon: "✅", color: "#22c55e" },
          { label: "展開中",        value: "0台",     icon: "⏳", color: "#3b82f6" },
          { label: "ロールバック中", value: "0台",     icon: "🔄", color: "#f59e0b" },
          { label: "失敗",          value: "1台",     icon: "❌", color: "#ef4444" },
        ].map(c => (
          <div key={c.label} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e8ecf1" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 18px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? "#2563eb" : "#64748b",
            borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
            marginBottom: -2, display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {activeTab === "status" && <PxeStatusTab />}
      {activeTab === "rollback" && (
        <PxeRollbackTab
          rollbackTarget={rollbackTarget} setRollbackTarget={setRollbackTarget}
          selectedDevice={selectedDevice} setSelectedDevice={setSelectedDevice}
          selectedProfile={selectedProfile} setSelectedProfile={setSelectedProfile}
          targetVersion={targetVersion} setTargetVersion={setTargetVersion}
          rollbackReason={rollbackReason} setRollbackReason={setRollbackReason}
          showConfirm={showConfirm} setShowConfirm={setShowConfirm}
          rollbackDone={rollbackDone} setRollbackDone={setRollbackDone}
        />
      )}
      {activeTab === "log" && <PxeLogTab />}
    </div>
  );
}

/* ── Status tab ── */
function PxeStatusTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile deployment status */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
          📡 プロファイル別展開状況
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {PXE_PROFILES.map(p => (
            <div key={p.id} style={{
              background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
              borderTop: `3px solid ${p.color}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.desc}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                  background: p.color + "20", color: p.color
                }}>{p.count}台</span>
              </div>
              {/* Progress bar */}
              <div style={{ background: "#e2e8f0", borderRadius: 4, height: 6, marginBottom: 6 }}>
                <div style={{
                  height: 6, borderRadius: 4, background: p.color,
                  width: "100%", transition: "width 0.3s"
                }} />
              </div>
              <div style={{ fontSize: 10, color: "#64748b" }}>展開完了: {p.count}/{p.count}台</div>
            </div>
          ))}
        </div>
      </div>

      {/* Device deployment list */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
          端末別展開状況
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["端末ID", "プロファイル", "現在のOS", "展開方法", "最終展開", "ステータス"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEVICES_DATA.map(d => (
              <tr key={d.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={tdStyle}><span style={{ fontFamily: "monospace", fontSize: 11 }}>{d.id}</span></td>
                <td style={tdStyle}><span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9" }}>{d.profile}</span></td>
                <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{d.os}</td>
                <td style={tdStyle}><span style={{ fontSize: 10, color: "#6366f1" }}>PXE</span></td>
                <td style={{ ...tdStyle, fontSize: 11, color: "#64748b" }}>2026-05-14</td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600,
                    background: d.status === "online" ? "#f0fdf4" : d.status === "offline" ? "#f8fafc" : "#fffbeb",
                    color: sColor(d.status)
                  }}>{sLabel(d.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Link to SSR admin */}
      <div style={{
        ...cardStyle, background: "#eff6ff", borderColor: "#bfdbfe",
        display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ fontSize: 22 }}>🔗</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", marginBottom: 2 }}>
            詳細な PXE ロールバックコンソール
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            より詳細なロールバック操作は管理 SSR ページで行えます。
          </div>
        </div>
        <a href="/admin/pxe-rollback" target="_blank" style={{
          marginLeft: "auto", padding: "7px 16px", borderRadius: 8,
          background: "#2563eb", color: "#fff", fontSize: 12, textDecoration: "none",
          fontWeight: 500, whiteSpace: "nowrap"
        }}>PXEコンソールを開く →</a>
      </div>
    </div>
  );
}

/* ── Rollback tab ── */
function PxeRollbackTab({
  rollbackTarget, setRollbackTarget, selectedDevice, setSelectedDevice,
  selectedProfile, setSelectedProfile, targetVersion, setTargetVersion,
  rollbackReason, setRollbackReason, showConfirm, setShowConfirm,
  rollbackDone, setRollbackDone
}) {
  const handleSubmit = () => {
    setShowConfirm(false);
    setRollbackDone(true);
  };

  if (rollbackDone) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>
          ロールバックをキューに登録しました
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          PXE イベントログで進捗を確認できます
        </div>
        <button onClick={() => setRollbackDone(false)} style={{
          padding: "8px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
          background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569"
        }}>別のロールバックを実行</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Warning banner */}
      <div style={{
        background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10,
        padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start"
      }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div style={{ fontSize: 12, color: "#92400e" }}>
          <strong>ロールバックは端末を再起動します。</strong> 実行前に作業データの保存状況を確認してください。
          緊急時以外は更新リング管理を通じた段階的ロールバックを推奨します。
        </div>
      </div>

      {/* Rollback pattern selection */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
          ロールバック対象
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
          {ROLLBACK_PATTERNS.map(p => (
            <button key={p.id} onClick={() => setRollbackTarget(p.id)} style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px",
              borderRadius: 10, border: "2px solid",
              borderColor: rollbackTarget === p.id ? "#ef4444" : "#e2e8f0",
              background: rollbackTarget === p.id ? "#fef2f2" : "#fff",
              cursor: "pointer", textAlign: "left"
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{p.label}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{p.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Target selection */}
        {rollbackTarget === "single" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>対象端末</label>
            <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 12, background: "#fff"
            }}>
              {DEVICES_DATA.map(d => (
                <option key={d.id} value={d.id}>{d.id} — {d.hostname} ({d.location})</option>
              ))}
            </select>
          </div>
        )}
        {rollbackTarget === "profile" && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>対象プロファイル</label>
            <select value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 12, background: "#fff"
            }}>
              {PXE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.label} ({p.count}台)</option>)}
            </select>
          </div>
        )}
        {rollbackTarget === "emergency" && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
            padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#991b1b"
          }}>
            🚨 <strong>全{DEVICES_DATA.length}台</strong>を同時ロールバックします。この操作は取り消せません。
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>ロールバック先バージョン</label>
          <select value={targetVersion} onChange={e => setTargetVersion(e.target.value)} style={{
            width: "100%", padding: "8px 10px", borderRadius: 8,
            border: "1px solid #e2e8f0", fontSize: 12, background: "#fff"
          }}>
            <option value="v0.9.0">v0.9.0 (安定版 — 2026-05-02)</option>
            <option value="v1.0.0-rc1">v1.0.0-rc1 (2026-05-04)</option>
            <option value="v1.0.0-rc2">v1.0.0-rc2 (2026-05-05)</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
            ロールバック理由 <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea value={rollbackReason} onChange={e => setRollbackReason(e.target.value)} rows={2}
            placeholder="例: AppArmor プロファイル不具合によるキオスク端末ロールバック"
            style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 12, resize: "vertical", outline: "none"
            }} />
        </div>

        <button
          onClick={() => rollbackReason.trim() && setShowConfirm(true)}
          disabled={!rollbackReason.trim()}
          style={{
            padding: "9px 22px", borderRadius: 8, border: "none", cursor: rollbackReason.trim() ? "pointer" : "not-allowed",
            background: rollbackReason.trim() ? "#ef4444" : "#e2e8f0",
            color: rollbackReason.trim() ? "#fff" : "#94a3b8",
            fontSize: 13, fontWeight: 600
          }}>
          🔙 ロールバック実行
        </button>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 14, padding: 28, width: 420,
            boxShadow: "0 20px 60px rgba(0,0,0,.2)"
          }}>
            <div style={{ fontSize: 30, textAlign: "center", marginBottom: 10 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
              ロールバックの確認
            </div>
            <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginBottom: 16 }}>
              {rollbackTarget === "single" ? selectedDevice :
               rollbackTarget === "profile" ? `${selectedProfile} プロファイル全台` :
               rollbackTarget === "ring" ? "指定リング全台" : "全端末"}
              を <strong>{targetVersion}</strong> にロールバックします。
            </div>
            <div style={{
              background: "#f8fafc", borderRadius: 8, padding: "8px 12px",
              fontSize: 11, color: "#64748b", marginBottom: 16
            }}>
              理由: {rollbackReason}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowConfirm(false)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569"
              }}>キャンセル</button>
              <button onClick={handleSubmit} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                background: "#ef4444", fontSize: 12, cursor: "pointer",
                color: "#fff", fontWeight: 600
              }}>実行する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Log tab ── */
function PxeLogTab() {
  const evColor = s => s === "ok" ? "#22c55e" : s === "warn" ? "#f59e0b" : "#ef4444";
  const evBg   = s => s === "ok" ? "#f0fdf4"  : s === "warn" ? "#fffbeb"  : "#fef2f2";
  const evLabel = s => s === "ok" ? "成功" : s === "warn" ? "警告" : "失敗";
  const evIcon  = e => ({
    boot_request: "📡", install_done: "✅", rollback: "🔙", failed: "❌"
  }[e] || "📋");

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
        PXE イベントログ
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["日時", "端末", "プロファイル", "イベント", "詳細", "結果"].map(h => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PXE_EVENTS.map(e => (
            <tr key={e.id} style={{ borderTop: "1px solid #f1f5f9" }}>
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 10, color: "#64748b", whiteSpace: "nowrap" }}>{e.at}</td>
              <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{e.device}</td>
              <td style={tdStyle}><span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "#f1f5f9" }}>{e.profile}</span></td>
              <td style={tdStyle}><span style={{ fontSize: 13 }}>{evIcon(e.event)}</span></td>
              <td style={{ ...tdStyle, fontSize: 11, color: "#475569", maxWidth: 280 }}>{e.detail}</td>
              <td style={tdStyle}>
                <span style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600,
                  background: evBg(e.status), color: evColor(e.status)
                }}>{evLabel(e.status)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

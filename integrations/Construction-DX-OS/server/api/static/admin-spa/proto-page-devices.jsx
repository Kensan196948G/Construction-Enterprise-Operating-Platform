/* ─── Devices Page — Full Fleet Management ─── */

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

  // Simulated live data with jitter
  const [liveDevices, setLiveDevices] = React.useState(DEVICES_DATA.map(d => ({ ...d, _lastSeen: Date.now() - Math.random() * 300000 })));

  // Auto-refresh
  React.useEffect(() => {
    if (autoRefresh === 0) return;
    const interval = setInterval(() => {
      setLiveDevices(prev => prev.map(d => ({
        ...d,
        cpu: d.status === "offline" ? 0 : Math.max(0, Math.min(100, d.cpu + Math.floor(Math.random() * 11) - 5)),
        mem: d.status === "offline" ? 0 : Math.max(0, Math.min(100, d.mem + Math.floor(Math.random() * 5) - 2)),
        _lastSeen: d.status === "offline" ? d._lastSeen : Date.now() - Math.floor(Math.random() * 5000),
      })));
      setLastRefresh(Date.now());
      setRefreshCount(c => c + 1);
    }, autoRefresh * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const manualRefresh = () => {
    setLiveDevices(prev => prev.map(d => ({
      ...d,
      cpu: d.status === "offline" ? 0 : Math.max(0, Math.min(100, d.cpu + Math.floor(Math.random() * 11) - 5)),
      mem: d.status === "offline" ? 0 : Math.max(0, Math.min(100, d.mem + Math.floor(Math.random() * 5) - 2)),
      _lastSeen: d.status === "offline" ? d._lastSeen : Date.now(),
    })));
    setLastRefresh(Date.now());
    setRefreshCount(c => c + 1);
  };

  const timeSince = (ts) => {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 5) return "たった今";
    if (sec < 60) return sec + "秒前";
    if (sec < 3600) return Math.floor(sec / 60) + "分前";
    return Math.floor(sec / 3600) + "時間前";
  };

  // Filter + search
  const filtered = liveDevices
    .filter(d => filter === "all" || d.status === filter)
    .filter(d => {
      if (!search) return true;
      const s = search.toLowerCase();
      return d.id.toLowerCase().includes(s) || d.hostname.toLowerCase().includes(s) || d.location.toLowerCase().includes(s) || d.profile.toLowerCase().includes(s);
    });

  // Group
  const groups = groupBy === "none" ? { "全端末": filtered } :
    groupBy === "location" ? filtered.reduce((acc, d) => { (acc[d.location] = acc[d.location] || []).push(d); return acc; }, {}) :
    groupBy === "profile" ? filtered.reduce((acc, d) => { (acc[d.profile] = acc[d.profile] || []).push(d); return acc; }, {}) :
    groupBy === "ring" ? filtered.reduce((acc, d) => { (acc[d.ring] = acc[d.ring] || []).push(d); return acc; }, {}) :
    { "全端末": filtered };

  const toggleCheck = (id) => setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setCheckedIds(checkedIds.length === filtered.length ? [] : filtered.map(d => d.id));

  const executeBulkAction = (action) => {
    const targets = checkedIds;
    const now = new Date().toLocaleTimeString("ja-JP");
    const newLogs = targets.map(id => ({ at: now, device: id, action, status: "実行中" }));
    setActionLog(prev => [...newLogs, ...prev]);
    setShowBulkAction(null);
    setCheckedIds([]);
    // Simulate completion
    setTimeout(() => {
      setActionLog(prev => prev.map(l => newLogs.find(n => n.device === l.device && n.action === l.action) ? { ...l, status: "完了" } : l));
    }, 2000);
  };

  const executeDeviceAction = (deviceId, action) => {
    const now = new Date().toLocaleTimeString("ja-JP");
    setActionLog(prev => [{ at: now, device: deviceId, action, status: "実行中" }, ...prev]);
    setTimeout(() => {
      setActionLog(prev => prev.map((l, i) => i === 0 ? { ...l, status: "完了" } : l));
    }, 1500);
  };

  // Resource alert check
  const hasAlert = (d) => d.status !== "offline" && (d.cpu >= alertThresholds.cpu || d.mem >= alertThresholds.mem || d.disk >= alertThresholds.disk);

  // Device detail
  const dev = selected ? liveDevices.find(d => d.id === selected) : null;

  if (dev) {
    const devActions = actionLog.filter(l => l.device === dev.id);
    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← 端末一覧へ戻る</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: sColor(dev.status) }}></span>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>{dev.id}</h2>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: sBg(dev.status), color: sColor(dev.status), fontWeight: 500 }}>{sLabel(dev.status)}</span>
              {hasAlert(dev) && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#fef2f2", color: "#ef4444", fontWeight: 600 }}>リソース警告</span>}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {[["ホスト名", dev.hostname], ["拠点", dev.location], ["IPアドレス", dev.ip], ["プロファイル", dev.profile], ["OS", dev.os], ["cdx-agent", "v" + dev.agent], ["更新リング", dev.ring], ["AppArmor", dev.apparmor], ["最終通信", timeSince(dev._lastSeen)]].map(([k, v], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px 10px", color: "#94a3b8", fontWeight: 500, width: 140, fontSize: 12 }}>{k}</td>
                    <td style={{ padding: "8px 10px", color: k === "AppArmor" ? (v === "有効" ? "#22c55e" : "#ef4444") : "#0f172a", fontWeight: k === "AppArmor" ? 600 : 400, fontSize: 12 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Device actions */}
            <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Agent更新指示", "ポリシー再配信", "リブート指示", "インベントリ取得", "heartbeat要求"].map(a => (
                <button key={a} onClick={() => executeDeviceAction(dev.id, a)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer", background: "#fff", color: "#475569" }}>{a}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>リソース使用状況</div>
              {[{ label: "CPU", val: dev.cpu }, { label: "メモリ", val: dev.mem }, { label: "ディスク", val: dev.disk }].map((r, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#475569" }}>{r.label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {dev.status !== "offline" && r.val >= alertThresholds[r.label === "CPU" ? "cpu" : r.label === "メモリ" ? "mem" : "disk"] && <span style={{ fontSize: 9, color: "#ef4444" }}>閾値超過</span>}
                      <span style={{ fontWeight: 600, color: usageColor(r.val) }}>{dev.status === "offline" ? "—" : r.val + "%"}</span>
                    </span>
                  </div>
                  <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, position: "relative" }}>
                    <div style={{ height: "100%", width: dev.status === "offline" ? "0%" : r.val + "%", background: usageColor(r.val), borderRadius: 4, transition: "width 500ms" }}></div>
                    {/* Threshold line */}
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: alertThresholds[r.label === "CPU" ? "cpu" : r.label === "メモリ" ? "mem" : "disk"] + "%", width: 2, background: "#ef4444", opacity: 0.5 }}></div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>閾値: CPU {alertThresholds.cpu}% / MEM {alertThresholds.mem}% / Disk {alertThresholds.disk}%</div>
            </div>
            {/* Connection timeline */}
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>接続タイムライン (直近1時間)</div>
              <div style={{ display: "flex", gap: 2, height: 24, borderRadius: 4, overflow: "hidden" }}>
                {Array.from({ length: 60 }, (_, i) => {
                  const isOnline = dev.status !== "offline" || i < 40;
                  const isRecent = i > 55;
                  return <div key={i} style={{ flex: 1, background: isOnline ? (isRecent ? "#22c55e" : "#86efac") : "#e2e8f0", transition: "background 300ms" }}></div>;
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                <span>60分前</span><span>30分前</span><span>現在</span>
              </div>
            </div>
            {/* HB history */}
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>ハートビート履歴</div>
              {dev.status !== "offline" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {Array.from({ length: 8 }, (_, i) => ({ time: `09:${String(29 - i).padStart(2, "0")}`, status: "ok" })).map((h, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }}></span>
                      <span style={{ color: "#94a3b8", width: 50 }}>{h.time}</span>
                      <span style={{ color: "#475569" }}>heartbeat received</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ fontSize: 12, color: "#94a3b8" }}>端末オフライン — ハートビート未受信</div>}
            </div>
          </div>
        </div>
        {/* Inventory */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>インベントリ情報</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[{ k: "カーネル", v: "6.1.0-20-amd64" }, { k: "アーキテクチャ", v: "x86_64" }, { k: "RAM", v: "16 GB DDR4" }, { k: "ストレージ", v: "256 GB NVMe SSD" }, { k: "ネットワーク", v: "Realtek RTL8111" }, { k: "デスクトップ", v: "XFCE 4.18" }, { k: "ブラウザ", v: "Chromium 124" }, { k: "ONLYOFFICE", v: "8.0.1" }].map((item, i) => (
              <div key={i} style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 12 }}>
                <div style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>{item.k}</div>
                <div style={{ color: "#0f172a", fontWeight: 500 }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Command history */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>端末コマンド履歴</div>
          {devActions.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {["日時", "アクション", "ステータス"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>{devActions.map((a, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>{a.at}</td>
                  <td style={{ ...tdStyle, color: "#475569" }}>{a.action}</td>
                  <td style={tdStyle}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "完了" ? "#f0fdf4" : "#eff6ff", color: a.status === "完了" ? "#22c55e" : "#3b82f6" }}>{a.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          ) : <div style={{ fontSize: 12, color: "#94a3b8" }}>この端末へのコマンド履歴はありません</div>}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>端末管理</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>登録済み端末のフリート管理・リアルタイム監視・インベントリ</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Auto-refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: autoRefresh > 0 ? "#f0fdf4" : "#f8fafc", border: "1px solid #e8ecf1" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: autoRefresh > 0 ? "#22c55e" : "#94a3b8", animation: autoRefresh > 0 ? "pulse 2s infinite" : "none" }}></span>
            <select value={autoRefresh} onChange={e => setAutoRefresh(Number(e.target.value))} style={{ border: "none", background: "transparent", fontSize: 11, color: "#475569", cursor: "pointer", outline: "none" }}>
              <option value={0}>手動更新</option>
              <option value={5}>5秒</option>
              <option value={10}>10秒</option>
              <option value={30}>30秒</option>
              <option value={60}>60秒</option>
            </select>
          </div>
          <button onClick={manualRefresh} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer", background: "#fff", color: "#2563eb", fontWeight: 600 }}>🔄 更新</button>
          <span style={{ fontSize: 10, color: "#cbd5e1" }}>#{refreshCount}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "総端末数", val: liveDevices.length + "台", color: "#2563eb" },
          { label: "拠点数", val: [...new Set(liveDevices.map(d => d.location))].length + "拠点", color: "#8b5cf6" },
          { label: "オンライン", val: liveDevices.filter(d => d.status === "online").length + "台", color: "#22c55e" },
          { label: "オフライン", val: liveDevices.filter(d => d.status === "offline").length + "台", color: "#94a3b8" },
          { label: "警告", val: liveDevices.filter(d => d.status === "warning").length + "台", color: "#f59e0b" },
          { label: "リソース警告", val: liveDevices.filter(d => hasAlert(d)).length + "台", color: liveDevices.filter(d => hasAlert(d)).length > 0 ? "#ef4444" : "#22c55e" },
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        {/* Filter */}
        {[{ id: "all", label: `全て (${liveDevices.length})` }, { id: "online", label: `稼働` }, { id: "offline", label: `停止` }, { id: "warning", label: `警告` }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer",
            background: filter === f.id ? "#eff6ff" : "#fff", color: filter === f.id ? "#2563eb" : "#64748b", fontWeight: filter === f.id ? 600 : 400
          }}>{f.label}</button>
        ))}
        <span style={{ color: "#e2e8f0" }}>|</span>
        {/* Search */}
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 端末ID / ホスト名 / 拠点で検索..." style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, width: 220, color: "#0f172a" }} />
        {/* Group by */}
        <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, color: "#475569" }}>
          <option value="none">グループなし</option>
          <option value="location">拠点別</option>
          <option value="profile">プロファイル別</option>
          <option value="ring">リング別</option>
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {/* Threshold */}
          <button onClick={() => setShowThresholdEdit(!showThresholdEdit)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: "#fff", color: "#64748b" }}>⚙ 閾値</button>
          {/* Export */}
          <button onClick={() => setShowExport(!showExport)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 11, cursor: "pointer", background: "#fff", color: "#64748b" }}>📥 エクスポート</button>
        </div>
      </div>

      {/* Threshold editor */}
      {showThresholdEdit && (
        <div style={{ ...cardStyle, marginBottom: 12, padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>リソースアラート閾値設定</div>
          <div style={{ display: "flex", gap: 16 }}>
            {[{ k: "cpu", label: "CPU" }, { k: "mem", label: "メモリ" }, { k: "disk", label: "ディスク" }].map(t => (
              <div key={t.k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ color: "#64748b", width: 50 }}>{t.label}</span>
                <input type="range" min={50} max={100} value={alertThresholds[t.k]} onChange={e => setAlertThresholds(prev => ({ ...prev, [t.k]: Number(e.target.value) }))} style={{ width: 100 }} />
                <span style={{ fontWeight: 600, color: "#ef4444", width: 35 }}>{alertThresholds[t.k]}%</span>
              </div>
            ))}
            <button onClick={() => setShowThresholdEdit(false)} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, cursor: "pointer" }}>適用</button>
          </div>
        </div>
      )}

      {/* Export options */}
      {showExport && (
        <div style={{ ...cardStyle, marginBottom: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>
            📥 エクスポート形式 <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>対象: {filtered.length}台</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Full CSV */}
            <button onClick={() => {
              const header = "端末ID,シリアル番号,ホスト名,プロファイル,設置場所,IPアドレス,OS,Agent,リング,AppArmor,状態,最終通信";
              const rows = filtered.map(d => [d.id, d.serial||"", d.hostname, d.profile, d.location, d.ip, d.os, d.agent, d.ring, d.apparmor, d.status, d.lastHb].join(","));
              const blob = new Blob(["﻿" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
              a.download = `cdx-devices-${new Date().toISOString().slice(0,10)}.csv`; a.click();
              setShowExport(false);
            }} style={{ padding: "7px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              📄 端末一覧CSV（全フィールド）
            </button>
            {/* Serial ↔ Hostname CSV */}
            <button onClick={() => {
              const header = "シリアル番号,ホスト名,端末ID,プロファイル,設置場所,状態,登録日";
              const rows = filtered.map(d => [d.serial||"", d.hostname, d.id, d.profile, d.location, d.status, "2026-05-10"].join(","));
              const blob = new Blob(["﻿" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
              a.download = `cdx-serial-hostname-${new Date().toISOString().slice(0,10)}.csv`; a.click();
              setShowExport(false);
            }} style={{ padding: "7px 14px", borderRadius: 8, background: "#22c55e", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              🔗 シリアル番号↔ホスト名 紐付け台帳
            </button>
            {/* JSON */}
            <button onClick={() => {
              const data = filtered.map(d => ({ id: d.id, serial: d.serial||"", hostname: d.hostname, profile: d.profile, location: d.location, status: d.status }));
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
              a.download = `cdx-devices-${new Date().toISOString().slice(0,10)}.json`; a.click();
              setShowExport(false);
            }} style={{ padding: "7px 14px", borderRadius: 8, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" }}>
              {"{ }"} JSON
            </button>
            <button onClick={() => setShowExport(false)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#94a3b8" }}>×</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#94a3b8" }}>
            ※「シリアル番号↔ホスト名 紐付け台帳」は展開後のIT資産管理台帳として利用できます
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {checkedIds.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 12, padding: "10px 16px", background: "#eff6ff", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>{checkedIds.length}台 選択中</span>
          <span style={{ color: "#bfdbfe" }}>|</span>
          {["Agent更新指示", "ポリシー再配信", "リブート指示", "インベントリ取得"].map(a => (
            <button key={a} onClick={() => executeBulkAction(a)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #bfdbfe", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb", fontWeight: 500 }}>{a}</button>
          ))}
          <button onClick={() => setCheckedIds([])} style={{ marginLeft: "auto", padding: "4px 10px", borderRadius: 5, border: "none", fontSize: 10, cursor: "pointer", background: "transparent", color: "#94a3b8" }}>選択解除</button>
        </div>
      )}

      {/* Device tables (grouped) */}
      {Object.entries(groups).map(([groupName, devices]) => (
        <div key={groupName} style={{ ...cardStyle, marginBottom: 12 }}>
          {groupBy !== "none" && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
              {groupName} <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>({devices.length}台)</span>
            </div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8fafc" }}>
              <th style={{ ...thStyle, width: 30 }}><input type="checkbox" checked={checkedIds.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              {["端末ID", "拠点", "ホスト名", "プロファイル", "Agent", "リング", "CPU", "MEM", "Disk", "状態", "最終通信"].map(h =>
                <th key={h} style={thStyle}>{h}</th>
              )}
              <th style={thStyle}>操作</th>
            </tr></thead>
            <tbody>{devices.map(d => (
              <tr key={d.id} style={{ borderTop: "1px solid #f1f5f9", background: hasAlert(d) ? "#fefce8" : "" }}>
                <td style={{ ...tdStyle, width: 30 }}><input type="checkbox" checked={checkedIds.includes(d.id)} onChange={() => toggleCheck(d.id)} /></td>
                <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500, cursor: "pointer" }} onClick={() => setSelected(d.id)}>{d.id}</td>
                <td style={{ ...tdStyle, color: "#475569" }}>{d.location}</td>
                <td style={{ ...tdStyle, color: "#475569" }}>{d.hostname}</td>
                <td style={tdStyle}><span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 10, background: "#f1f5f9", color: "#64748b" }}>{d.profile}</span></td>
                <td style={{ ...tdStyle, color: d.agent === "0.2.0" ? "#475569" : "#f59e0b", fontWeight: d.agent !== "0.2.0" ? 600 : 400 }}>v{d.agent}</td>
                <td style={{ ...tdStyle, color: "#64748b", fontSize: 11 }}>{d.ring}</td>
                <td style={{ ...tdStyle, fontSize: 11 }}>
                  <span style={{ color: usageColor(d.cpu), fontWeight: d.cpu >= alertThresholds.cpu ? 600 : 400 }}>{d.status === "offline" ? "—" : d.cpu + "%"}</span>
                </td>
                <td style={{ ...tdStyle, fontSize: 11 }}>
                  <span style={{ color: usageColor(d.mem), fontWeight: d.mem >= alertThresholds.mem ? 600 : 400 }}>{d.status === "offline" ? "—" : d.mem + "%"}</span>
                </td>
                <td style={{ ...tdStyle, fontSize: 11 }}>
                  <span style={{ color: usageColor(d.disk), fontWeight: d.disk >= alertThresholds.disk ? 600 : 400 }}>{d.status === "offline" ? "—" : d.disk + "%"}</span>
                </td>
                <td style={tdStyle}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: sBg(d.status), color: sColor(d.status) }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: sColor(d.status) }}></span>{sLabel(d.status)}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: 10, color: d.status === "offline" ? "#94a3b8" : "#475569" }}>{timeSince(d._lastSeen)}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 3 }}>
                    <button onClick={(e) => { e.stopPropagation(); executeDeviceAction(d.id, "heartbeat要求"); }} title="heartbeat要求" style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb" }}>💓</button>
                    <button onClick={(e) => { e.stopPropagation(); executeDeviceAction(d.id, "ポリシー再配信"); }} title="ポリシー再配信" style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#f59e0b" }}>📜</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelected(d.id); }} title="詳細" style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" }}>→</button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ))}

      {/* Action log */}
      {actionLog.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>コマンド実行履歴</span>
            <button onClick={() => setActionLog([])} style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>クリア</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {["日時", "端末ID", "アクション", "ステータス"].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>{actionLog.slice(0, 20).map((a, i) => (
              <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                <td style={{ ...tdStyle, color: "#94a3b8" }}>{a.at}</td>
                <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500 }}>{a.device}</td>
                <td style={{ ...tdStyle, color: "#475569" }}>{a.action}</td>
                <td style={tdStyle}><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "完了" ? "#f0fdf4" : "#eff6ff", color: a.status === "完了" ? "#22c55e" : "#3b82f6" }}>{a.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

window.DevicesPage = DevicesPage;

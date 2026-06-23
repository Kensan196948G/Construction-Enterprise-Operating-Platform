/* ─── 展開台帳ページ (CSV 一括展開・ホスト名↔シリアル番号管理) ─── */

const CSV_TEMPLATE_HEADER = "serial_number,hostname,profile,ou,ad_user_sam,ad_user_cn,location,notes";

const CSV_TEMPLATE_ROWS = [
  "SN-HQ-001001,CDX-HQ-001,standard,\"OU=Workstations,OU=Standard,DC=mirai,DC=local\",T001,田中 太郎,新宿本社,本社1F-A棟",
  "SN-HQ-001002,CDX-HQ-002,standard,\"OU=Workstations,OU=Standard,DC=mirai,DC=local\",T002,鈴木 花子,新宿本社,本社1F-B棟",
  "SN-FLD-002001,CDX-FLD-001,field,\"OU=Workstations,OU=Field,DC=mirai,DC=local\",T010,吉田 浩二,川崎現場A,",
  "SN-FLD-002002,CDX-FLD-002,field,\"OU=Workstations,OU=Field,DC=mirai,DC=local\",T005,伊藤 美咲,横浜現場B,",
  "SN-KSK-003001,CDX-KSK-001,kiosk,,,,名古屋支店,受付ロビー",
];

const DEPLOY_REGISTER_MOCK = [
  { id:1, serial:"SN-HQ-001001", hostname:"CDX-HQ-001", profile:"standard", ou:"OU=Workstations,OU=Standard,DC=mirai,DC=local", sam:"T001", cn:"田中 太郎", location:"新宿本社",   notes:"本社1F-A棟", status:"deployed", registeredAt:"2026-05-10" },
  { id:2, serial:"SN-HQ-001002", hostname:"CDX-HQ-002", profile:"standard", ou:"OU=Workstations,OU=Standard,DC=mirai,DC=local", sam:"T002", cn:"鈴木 花子", location:"新宿本社",   notes:"本社1F-B棟", status:"deployed", registeredAt:"2026-05-10" },
  { id:3, serial:"SN-HQ-001003", hostname:"CDX-HQ-003", profile:"standard", ou:"OU=Workstations,OU=Standard,DC=mirai,DC=local", sam:"T004", cn:"佐藤 三郎", location:"新宿本社",   notes:"",          status:"deployed", registeredAt:"2026-05-11" },
  { id:4, serial:"SN-BR-002001", hostname:"CDX-BR-010", profile:"standard", ou:"OU=Workstations,OU=Standard,DC=mirai,DC=local", sam:"T003", cn:"山田 次郎", location:"大阪支店",   notes:"",          status:"deployed", registeredAt:"2026-05-11" },
  { id:5, serial:"SN-BR-002002", hostname:"CDX-BR-011", profile:"standard", ou:"OU=Workstations,OU=Standard,DC=mirai,DC=local", sam:"T006", cn:"渡辺 健一", location:"大阪支店",   notes:"",          status:"deployed", registeredAt:"2026-05-12" },
  { id:6, serial:"SN-FLD-003001", hostname:"CDX-FLD-101", profile:"field",  ou:"OU=Workstations,OU=Field,DC=mirai,DC=local",    sam:"T008", cn:"小林 正道", location:"川崎現場A",  notes:"",          status:"pending",  registeredAt:"2026-05-13" },
  { id:7, serial:"SN-FLD-003002", hostname:"CDX-FLD-102", profile:"field",  ou:"OU=Workstations,OU=Field,DC=mirai,DC=local",    sam:"T010", cn:"吉田 浩二", location:"横浜現場B",  notes:"",          status:"deployed", registeredAt:"2026-05-12" },
  { id:8, serial:"SN-FLD-003003", hostname:"CDX-FLD-103", profile:"field",  ou:"OU=Workstations,OU=Field,DC=mirai,DC=local",    sam:"T005", cn:"伊藤 美咲", location:"千葉現場C",  notes:"",          status:"deployed", registeredAt:"2026-05-12" },
  { id:9, serial:"SN-KSK-004001", hostname:"CDX-KSK-201", profile:"kiosk", ou:"",                                               sam:"",     cn:"",         location:"名古屋支店",  notes:"受付ロビー",  status:"deployed", registeredAt:"2026-05-10" },
  { id:10,serial:"SN-KSK-004002", hostname:"CDX-KSK-202", profile:"kiosk", ou:"",                                               sam:"",     cn:"",         location:"福岡支店",    notes:"受付ロビー",  status:"deployed", registeredAt:"2026-05-10" },
];

const STATUS_META = {
  deployed: { label: "展開済み", color: "#22c55e", bg: "#f0fdf4" },
  pending:  { label: "未展開",   color: "#f59e0b", bg: "#fffbeb" },
  error:    { label: "エラー",   color: "#ef4444", bg: "#fef2f2" },
  planned:  { label: "計画中",   color: "#8b5cf6", bg: "#f5f3ff" },
};

Object.assign(window, { DEPLOY_REGISTER_MOCK, CSV_TEMPLATE_HEADER, CSV_TEMPLATE_ROWS, STATUS_META });

/* ─────────────────────────────────────── */
function RegisterPage() {
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

  // File server state
  const [fsStatus, setFsStatus] = React.useState(null); // null | {mounted, pending_images, queue_size}
  const [fsLoading, setFsLoading] = React.useState(false);
  const [fsQueue, setFsQueue] = React.useState([]);
  const [fsScanDone, setFsScanDone] = React.useState(false);
  const [fsConfirming, setFsConfirming] = React.useState(null); // item id
  const [fsHostname, setFsHostname] = React.useState("");
  const [fsProfile, setFsProfile] = React.useState("standard");
  const [fsLocation, setFsLocation] = React.useState("");

  const fetchFsStatus = async () => {
    setFsLoading(true);
    try {
      const r = await fetch("/api/v1/serial/status");
      setFsStatus(await r.json());
    } catch { setFsStatus({ mounted: false, error: "API到達不可" }); }
    setFsLoading(false);
  };

  const triggerFsScan = async () => {
    setFsLoading(true); setFsScanDone(false);
    try {
      const r = await fetch("/api/v1/serial/scan", { method: "POST" });
      const data = await r.json();
      setFsQueue(prev => [...data.items, ...prev]);
      setFsScanDone(true);
      setFsStatus(prev => prev ? ({ ...prev, pending_images: 0, queue_size: data.processed }) : null);
    } catch { /* ignore */ }
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
      body: JSON.stringify({ serial_number: item.serial_confirmed, hostname: fsHostname, profile: fsProfile, location: fsLocation }),
    });
    if (r.ok) {
      const confirmed = await r.json();
      setFsQueue(prev => prev.map(i => i.id === item.id ? confirmed : i));
      setRecords(prev => [...prev, {
        id: Date.now(), serial: confirmed.serial_confirmed, hostname: confirmed.hostname,
        profile: confirmed.profile, ou: confirmed.profile !== "kiosk" ? `OU=Workstations,OU=Standard,DC=mirai,DC=local` : "",
        sam: "", cn: "", location: confirmed.location, notes: "GMSV0002 OCRスキャン",
        status: "planned", registeredAt: new Date().toISOString().slice(0,10)
      }]);
      setFsConfirming(null); setFsHostname(""); setFsLocation("");
    }
  };

  const discardFsItem = async (id) => {
    await fetch(`/api/v1/serial/queue/${id}`, { method: "DELETE" });
    setFsQueue(prev => prev.filter(i => i.id !== id));
  };

  // Camera / OCR state
  const [ocrImage, setOcrImage] = React.useState(null);
  const [ocrStatus, setOcrStatus] = React.useState("idle"); // idle / analyzing / done / error
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
      // Simulate OCR processing (1.5s → extract serial from filename or mock)
      setTimeout(() => {
        // In production: Tesseract.js or /api/v1/ocr endpoint
        const mockSerial = "SN-" + file.name.replace(/\.[^.]+$/, "").toUpperCase().slice(0, 12).replace(/[^A-Z0-9-]/g, "-") || "SN-UNKNOWN";
        const candidates = ["SN-HQ-005001", "SN-FLD-006002", "SN-KSK-007001", mockSerial];
        const extracted = candidates[Math.floor(Math.random() * 2)]; // realistic mock
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
    setCsvText(prev => prev ? prev + "\n" + newRow : CSV_TEMPLATE_HEADER + "\n" + newRow);
    setOcrImage(null); setOcrStatus("idle"); setOcrResult(""); setOcrConfirmed("");
    setActiveTab("import");
  };

  const tabs = [
    { id: "list",       label: "展開台帳",         icon: "📋" },
    { id: "fileserver", label: "ファイルサーバー連携", icon: "🖥️" },
    { id: "camera",     label: "カメラ読み取り",    icon: "📷" },
    { id: "import",     label: "CSV インポート",    icon: "📥" },
    { id: "export",     label: "エクスポート",      icon: "📤" },
  ];

  const filtered = records.filter(r => {
    if (profileFilter !== "all" && r.profile !== profileFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.hostname.toLowerCase().includes(q) ||
             r.serial.toLowerCase().includes(q) ||
             r.cn.toLowerCase().includes(q) ||
             r.sam.toLowerCase().includes(q) ||
             r.location.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total:    records.length,
    deployed: records.filter(r => r.status === "deployed").length,
    pending:  records.filter(r => r.status === "pending").length,
    error:    records.filter(r => r.status === "error").length,
  };

  // CSV parse
  const parseCsv = (text) => {
    setCsvError("");
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) { setCsvError("2行以上必要です（ヘッダー＋データ）"); return; }
    const header = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const required = ["serial_number", "hostname", "profile"];
    const missing = required.filter(f => !header.includes(f));
    if (missing.length) { setCsvError(`必須列が不足: ${missing.join(", ")}`); return; }
    const rows = lines.slice(1).map((line, idx) => {
      // Handle quoted commas (simple CSV parse)
      const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
      const obj = {};
      header.forEach((h, i) => { obj[h] = (cols[i] || "").replace(/^"|"$/g, "").trim(); });
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
        registeredAt: new Date().toISOString().slice(0, 10),
      };
    });
    setCsvPreview(rows);
  };

  const handleImport = () => {
    if (csvPreview.length === 0) return;
    setRecords(prev => [...prev, ...csvPreview]);
    setCsvPreview([]);
    setCsvText("");
    setImportDone(true);
    setActiveTab("list");
    setTimeout(() => setImportDone(false), 3000);
  };

  // Export functions
  const buildCsvRow = (r, cols) => cols.map(c => {
    const v = r[c] || "";
    return v.includes(",") ? `"${v}"` : v;
  }).join(",");

  const downloadCsv = (filename, header, rows) => {
    const content = [header, ...rows].join("\n");
    const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportFull = () => {
    const cols = ["serial","hostname","profile","ou","sam","cn","location","notes","status","registeredAt"];
    const header = "シリアル番号,ホスト名,プロファイル,OUパス,社員番号,氏名,設置場所,備考,ステータス,登録日";
    downloadCsv(`cdx-deploy-register-${new Date().toISOString().slice(0,10)}.csv`, header,
      records.map(r => buildCsvRow(r, cols)));
  };

  const exportSerialHostname = () => {
    const header = "シリアル番号,ホスト名,プロファイル,設置場所,登録日";
    downloadCsv(`cdx-serial-hostname-${new Date().toISOString().slice(0,10)}.csv`, header,
      records.map(r => [r.serial, r.hostname, r.profile, r.location, r.registeredAt].join(",")));
  };

  const exportAdUsers = () => {
    const header = "ホスト名,シリアル番号,社員番号(sAMAccountName),氏名(CN),設置場所,OUパス";
    const rows = records.filter(r => r.sam).map(r =>
      [r.hostname, r.serial, r.sam, r.cn, r.location, r.ou].join(","));
    downloadCsv(`cdx-ad-user-assign-${new Date().toISOString().slice(0,10)}.csv`, header, rows);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          📋 展開台帳
        </h2>
        <p style={{ fontSize: 12, color: "#64748b" }}>
          CSV一括インポートで端末のホスト名・シリアル番号・ADユーザーを管理します。
          ISO展開時に自動参照され、ホスト名↔シリアル番号の紐付け台帳をエクスポートできます。
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "登録台数",   value: stats.total,    icon: "📋", color: "#3b82f6" },
          { label: "展開済み",   value: stats.deployed, icon: "✅", color: "#22c55e" },
          { label: "未展開",     value: stats.pending,  icon: "⏳", color: "#f59e0b" },
          { label: "エラー",     value: stats.error,    icon: "❌", color: "#ef4444" },
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

      {importDone && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
          padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#15803d", fontWeight: 600
        }}>✅ CSVインポートが完了しました</div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid #e8ecf1" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? "#2563eb" : "#64748b",
            borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
            marginBottom: -2, display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: 展開台帳 ── */}
      {activeTab === "list" && (
        <div>
          {/* Filter bar */}
          <div style={{ ...cardStyle, marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input type="text" placeholder="ホスト名 / シリアル番号 / 氏名 / 場所..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: "1 1 200px", padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
            />
            <select value={profileFilter} onChange={e => setProfileFilter(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }}>
              <option value="all">全プロファイル</option>
              <option value="standard">standard</option>
              <option value="field">field</option>
              <option value="kiosk">kiosk</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }}>
              <option value="all">全ステータス</option>
              <option value="deployed">展開済み</option>
              <option value="pending">未展開</option>
              <option value="planned">計画中</option>
              <option value="error">エラー</option>
            </select>
            <span style={{ fontSize: 11, color: "#64748b" }}>{filtered.length} 件</span>
          </div>

          {/* Table */}
          <div style={{ ...cardStyle, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["ホスト名", "シリアル番号", "プロファイル", "ADユーザー（CN / SAM）", "設置場所", "OUパス", "ステータス", "登録日"].map(h => (
                    <th key={h} style={{ ...thStyle, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const sm = STATUS_META[r.status] || STATUS_META.planned;
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                        {r.hostname}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: "#475569" }}>
                        {r.serial}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f1f5f9" }}>
                          {r.profile}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {r.cn ? (
                          <div>
                            <div style={{ fontSize: 12, color: "#0f172a" }}>{r.cn}</div>
                            <code style={{ fontSize: 10, color: "#3b82f6" }}>{r.sam}</code>
                          </div>
                        ) : <span style={{ fontSize: 10, color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ ...tdStyle, color: "#64748b", fontSize: 11 }}>{r.location}</td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 9, color: "#94a3b8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.ou || "—"}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: sm.bg, color: sm.color }}>
                          {sm.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: "#94a3b8" }}>{r.registeredAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: ファイルサーバー連携 ── */}
      {activeTab === "fileserver" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Architecture diagram */}
          <div style={{
            background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
            border: "1px solid #e8ecf1", fontSize: 11
          }}>
            <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 8, fontSize: 12 }}>
              🏗️ 連携フロー
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", color: "#475569" }}>
              {["📱 iPhone撮影", "→", "📂 GMSV0002 共有フォルダ", "→", "🖥️ cdx-server マウント", "→", "🔍 easyocr OCR処理", "→", "📋 展開台帳 取り込みキュー", "→", "✅ ホスト名確定"].map((s, i) => (
                <span key={i} style={{ fontWeight: s === "→" ? 400 : 600, color: s === "→" ? "#cbd5e1" : "#0f172a", fontSize: s === "→" ? 14 : 11 }}>{s}</span>
              ))}
            </div>
            <div style={{ marginTop: 8, color: "#64748b" }}>
              SMBマウント: <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>/mnt/gmsv0002-serial</code>
              &nbsp;| OCRエンジン: <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>easyocr</code>
              &nbsp;| 対応形式: <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>JPEG・PNG・HEIC・BMP・TIFF</code>
              &nbsp;| 認証: cdx-server ログインユーザーのみ
            </div>
          </div>

          {/* Connection status */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                🖥️ GMSV0002 接続ステータス
              </div>
              <button onClick={fetchFsStatus} disabled={fsLoading} style={{
                padding: "6px 14px", borderRadius: 8, border: "none",
                background: fsLoading ? "#93c5fd" : "#2563eb", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600
              }}>
                {fsLoading ? "確認中..." : "🔍 状態確認"}
              </button>
            </div>

            {fsStatus === null ? (
              <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "12px 0" }}>
                「状態確認」を押してGMSV0002の接続状態を確認します
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                {[
                  { label: "SMBマウント", value: fsStatus.mounted ? "マウント済み" : "未マウント", ok: fsStatus.mounted, icon: "🔗" },
                  { label: "新着画像", value: `${fsStatus.pending_images ?? 0}件`, ok: (fsStatus.pending_images ?? 0) >= 0, icon: "🖼️" },
                  { label: "OCRキュー", value: `${fsStatus.queue_size ?? fsQueue.length}件`, ok: true, icon: "📋" },
                  { label: "キューDB", value: fsStatus.queue_backend === "postgres" ? "PostgreSQL (永続)" : "In-Memory", ok: true, icon: "💾" },
                  { label: "モード", value: fsStatus.mock_mode ? "テスト(Mock)" : "本番(easyocr)", ok: true, icon: "⚙️" },
                ].map(c => (
                  <div key={c.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: `1px solid ${c.ok ? "#e8ecf1" : "#fecaca"}` }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{c.icon} {c.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.ok ? "#0f172a" : "#ef4444" }}>{c.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scan trigger */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>
              📡 新着画像をOCR処理
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: fsScanDone ? 10 : 0 }}>
              <button onClick={triggerFsScan} disabled={fsLoading} style={{
                padding: "9px 22px", borderRadius: 8, border: "none",
                background: fsLoading ? "#93c5fd" : "#2563eb",
                color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
              }}>
                {fsLoading ? "⏳ OCR処理中..." : "🔍 GMSV0002からスキャン実行"}
              </button>
              <button onClick={fetchFsQueue} style={{
                padding: "9px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569"
              }}>
                🔄 キューを更新
              </button>
            </div>
            {fsScanDone && (
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>
                ✅ スキャン完了。下のキューで確認・ホスト名入力してください。
              </div>
            )}
          </div>

          {/* OCR Queue */}
          {fsQueue.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
                📋 OCR取り込みキュー ({fsQueue.length}件)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {fsQueue.map(item => (
                  <div key={item.id} style={{
                    background: item.status === "confirmed" ? "#f0fdf4" : "#f8fafc",
                    borderRadius: 10, padding: "12px 14px",
                    border: `1px solid ${item.status === "confirmed" ? "#bbf7d0" : "#e8ecf1"}`
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: item.status !== "confirmed" && fsConfirming !== item.id ? 0 : 8 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                          background: item.status === "confirmed" ? "#dcfce7" : "#eff6ff",
                          color: item.status === "confirmed" ? "#16a34a" : "#2563eb"
                        }}>{item.status === "confirmed" ? "✅ 確定" : "⏳ 未確定"}</span>
                        <div>
                          <span style={{ fontSize: 11, color: "#64748b" }}>元ファイル: </span>
                          <code style={{ fontSize: 11, color: "#475569" }}>{item.filename}</code>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: "#64748b" }}>OCR結果: </span>
                          <code style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>{item.serial_confirmed}</code>
                        </div>
                        {item.hostname && (
                          <div>
                            <span style={{ fontSize: 11, color: "#64748b" }}>ホスト名: </span>
                            <code style={{ fontSize: 12, fontWeight: 600, color: "#22c55e" }}>{item.hostname}</code>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {item.status !== "confirmed" && (
                          <button onClick={() => { setFsConfirming(item.id); setFsHostname(""); }}
                            style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                            ✏️ ホスト名を設定
                          </button>
                        )}
                        <button onClick={() => discardFsItem(item.id)}
                          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#94a3b8" }}>
                          破棄
                        </button>
                      </div>
                    </div>

                    {/* Confirm form */}
                    {fsConfirming === item.id && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, marginTop: 8, alignItems: "flex-end" }}>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>
                            ホスト名 <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <input value={fsHostname} onChange={e => setFsHostname(e.target.value)}
                            placeholder="CDX-HQ-005"
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #2563eb", fontSize: 12, outline: "none" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 600, color: "#374151", display: "block", marginBottom: 3 }}>プロファイル</label>
                          <select value={fsProfile} onChange={e => setFsProfile(e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }}>
                            <option value="standard">standard</option>
                            <option value="field">field</option>
                            <option value="kiosk">kiosk</option>
                          </select>
                        </div>
                        <button onClick={() => confirmFsItem(item)} disabled={!fsHostname}
                          style={{ padding: "8px 16px", borderRadius: 8, border: "none",
                            background: fsHostname ? "#22c55e" : "#e2e8f0",
                            color: fsHostname ? "#fff" : "#94a3b8", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                          ✅ 確定
                        </button>
                        <button onClick={() => setFsConfirming(null)}
                          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#94a3b8" }}>
                          キャンセル
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Setup guide */}
          <div style={{ ...cardStyle, background: "#fffbeb", border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>📖 GMSV0002 セットアップ手順</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11, color: "#78350f" }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>① GMSV0002 側（IT管理者）</div>
                <div style={{ lineHeight: 1.8 }}>
                  1. 共有フォルダ作成: <code>cdx-serial-scans</code><br/>
                  2. アクセス権: <code>MIRAI\svc-cdxserver</code> 読み書き<br/>
                  3. iOSユーザーに読み書き権限付与
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>② cdx-server 側</div>
                <div style={{ lineHeight: 1.8 }}>
                  <code>sudo mount -t cifs //GMSV0002/cdx-serial-scans</code><br/>
                  <code>/mnt/gmsv0002-serial -o credentials=</code><br/>
                  <code>/etc/cdx-smb.creds,iocharset=utf8</code><br/>
                  <code>SERIAL_SCAN_MOCK=0 SERIAL_SCAN_PATH=/mnt/...</code>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>③ iPhone 側</div>
                <div style={{ lineHeight: 1.8 }}>
                  「ファイル」アプリ → 右上「…」→「サーバーに接続」<br/>
                  smb://GMSV0002 → ユーザー名・パスワード入力<br/>
                  cdx-serial-scans フォルダに写真を保存
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>④ 自動化（オプション）</div>
                <div style={{ lineHeight: 1.8 }}>
                  cron: <code>*/5 * * * * curl -X POST .../api/v1/serial/scan</code><br/>
                  または inotifywait でリアルタイム検知<br/>
                  easyocr install: <code>pip install easyocr</code><br/>
                  HEIC対応（iPhone標準形式）: <code>pip install pillow-heif</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: カメラ読み取り ── */}
      {activeTab === "camera" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Explanation */}
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
            padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start"
          }}>
            <span style={{ fontSize: 20 }}>📷</span>
            <div style={{ fontSize: 12, color: "#1d4ed8" }}>
              端末本体のシリアル番号ラベルを撮影すると、OCR でシリアル番号を自動抽出します。<br/>
              抽出結果を確認後、CSV インポートに追記できます。<br/>
              <strong>対応形式:</strong> JPEG・PNG・<strong>HEIC</strong>（iPhone標準）・BMP・TIFF<br/>
              <strong>本番実装:</strong> Tesseract.js（ブラウザ内OCR）または <code>/api/v1/ocr</code> エンドポイントを使用。
            </div>
          </div>

          {/* Camera trigger */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
              シリアル番号ラベルを撮影
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              {/* Camera button (mobile: opens camera, desktop: file picker) */}
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 10, cursor: "pointer",
                background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600
              }}>
                <span style={{ fontSize: 18 }}>📷</span>
                カメラで撮影
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/bmp,image/tiff" capture="environment"
                  onChange={handleImageCapture} style={{ display: "none" }} />
              </label>
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 10, cursor: "pointer",
                background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 13
              }}>
                <span style={{ fontSize: 16 }}>🖼️</span>
                画像ファイルを選択
                <input type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/bmp,image/tiff"
                  onChange={handleImageCapture} style={{ display: "none" }} />
              </label>
            </div>

            {/* Preview + OCR result */}
            {ocrImage && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Image preview */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>撮影画像</div>
                  <img src={ocrImage} alt="serial label"
                    style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }} />
                </div>

                {/* OCR result */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      OCR 解析結果
                      {ocrStatus === "analyzing" && (
                        <span style={{ fontSize: 10, color: "#3b82f6", marginLeft: 8, fontWeight: 400 }}>⏳ 解析中...</span>
                      )}
                      {ocrStatus === "done" && (
                        <span style={{ fontSize: 10, color: "#22c55e", marginLeft: 8, fontWeight: 400 }}>✅ 完了</span>
                      )}
                    </div>
                    {ocrStatus === "analyzing" ? (
                      <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 8, textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "#64748b" }}>Tesseract.js で OCR 実行中...</div>
                        <div style={{ marginTop: 8, height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "60%", background: "#3b82f6", borderRadius: 2, animation: "none" }} />
                        </div>
                      </div>
                    ) : ocrStatus === "done" ? (
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>抽出されたシリアル番号（編集可）</div>
                        <input
                          value={ocrConfirmed}
                          onChange={e => setOcrConfirmed(e.target.value)}
                          style={{
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            border: "2px solid #22c55e", fontSize: 14, fontWeight: 600,
                            fontFamily: "monospace", outline: "none", color: "#0f172a"
                          }}
                        />
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                          誤認識がある場合は直接編集してください
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {ocrStatus === "done" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button onClick={appendOcrToCsv} style={{
                        padding: "10px 16px", borderRadius: 8, border: "none",
                        background: "#22c55e", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
                      }}>
                        ✅ CSVに追記してインポートへ
                      </button>
                      <button onClick={() => {
                        // Direct add to register
                        const now = new Date().toISOString().slice(0,10);
                        const newRec = {
                          id: Date.now(), serial: ocrConfirmed,
                          hostname: "", profile: "standard",
                          ou: "OU=Workstations,OU=Standard,DC=mirai,DC=local",
                          sam: "", cn: "", location: "", notes: "カメラOCR読み取り",
                          status: "planned", registeredAt: now
                        };
                        setRecords(prev => [...prev, newRec]);
                        setOcrImage(null); setOcrStatus("idle"); setActiveTab("list");
                      }} style={{
                        padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                        background: "#fff", fontSize: 12, cursor: "pointer", color: "#2563eb"
                      }}>
                        📋 台帳に直接追加（ホスト名等は後で設定）
                      </button>
                      <button onClick={() => { setOcrImage(null); setOcrStatus("idle"); setOcrResult(""); }}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, cursor: "pointer", color: "#94a3b8" }}>
                        やり直す
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Batch camera hint */}
            {!ocrImage && (
              <div style={{
                background: "#f8fafc", borderRadius: 8, padding: "16px",
                textAlign: "center", border: "2px dashed #e2e8f0"
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                  端末を受け取ったら1台ずつシリアル番号を撮影してください。<br/>
                  撮影 → OCR確認 → 台帳追加 を繰り返すことで<br/>
                  大量展開時の資産登録を素早く完了できます。
                </div>
              </div>
            )}
          </div>

          {/* Scan history */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
              最近スキャンした端末
            </div>
            {records.filter(r => r.notes === "カメラOCR読み取り").length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["シリアル番号", "ホスト名", "ステータス", "登録日"].map(h => (
                      <th key={h} style={{ ...thStyle, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.filter(r => r.notes === "カメラOCR読み取り").map(r => (
                    <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: 600, color: "#2563eb" }}>{r.serial}</td>
                      <td style={{ ...tdStyle, color: r.hostname ? "#0f172a" : "#94a3b8", fontStyle: r.hostname ? "normal" : "italic" }}>
                        {r.hostname || "未設定"}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: "#f5f3ff", color: "#7c3aed" }}>計画中</span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: "#94a3b8" }}>{r.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: "12px 0", fontStyle: "italic" }}>
                まだスキャン履歴がありません
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: CSV インポート ── */}
      {activeTab === "import" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Template section */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                📄 CSV テンプレート
              </div>
              <button onClick={() => setShowTemplate(!showTemplate)} style={{
                padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
                background: "#fff", fontSize: 11, cursor: "pointer", color: "#2563eb"
              }}>
                {showTemplate ? "閉じる" : "テンプレートを表示"}
              </button>
            </div>

            <div style={{ fontSize: 11, color: "#64748b", marginBottom: showTemplate ? 10 : 0, lineHeight: 1.7 }}>
              <strong>必須列:</strong> serial_number（シリアル番号）, hostname（ホスト名）, profile（standard/field/kiosk）<br/>
              <strong>任意列:</strong> ou（OUパス）, ad_user_sam（社員番号）, ad_user_cn（氏名）, location（設置場所）, notes（備考）
            </div>

            {showTemplate && (
              <pre style={{
                background: "#1e1e2e", color: "#cdd6f4", borderRadius: 8,
                padding: "12px 14px", fontSize: 10, overflowX: "auto", lineHeight: 1.6,
                whiteSpace: "pre"
              }}>{CSV_TEMPLATE_HEADER + "\n" + CSV_TEMPLATE_ROWS.join("\n")}</pre>
            )}

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const content = CSV_TEMPLATE_HEADER + "\n" + CSV_TEMPLATE_ROWS.join("\n");
                  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url;
                  a.download = "cdx-deploy-template.csv"; a.click(); URL.revokeObjectURL(url);
                }}
                style={{
                  padding: "7px 16px", borderRadius: 8, border: "none",
                  background: "#2563eb", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
                }}
              >
                📥 テンプレート CSV をダウンロード
              </button>
            </div>
          </div>

          {/* CSV paste area */}
          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>
              📋 CSVを貼り付け
            </div>
            <textarea
              value={csvText}
              onChange={e => { setCsvText(e.target.value); setCsvPreview([]); setCsvError(""); }}
              placeholder={CSV_TEMPLATE_HEADER + "\nSN-HQ-001001,CDX-HQ-001,standard,..."}
              rows={8}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${csvError ? "#fecaca" : "#e2e8f0"}`,
                fontSize: 11, fontFamily: "monospace", resize: "vertical", outline: "none",
                lineHeight: 1.5
              }}
            />
            {csvError && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ {csvError}</div>}
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button onClick={() => parseCsv(csvText)} disabled={!csvText.trim()} style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: csvText.trim() ? "#2563eb" : "#e2e8f0",
                color: csvText.trim() ? "#fff" : "#94a3b8", fontSize: 12, cursor: "pointer", fontWeight: 600
              }}>🔍 プレビュー確認</button>
              <button onClick={() => { setCsvText(""); setCsvPreview([]); setCsvError(""); }}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#64748b" }}>
                クリア
              </button>
            </div>
          </div>

          {/* Preview */}
          {csvPreview.length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
                  ✅ プレビュー ({csvPreview.length}件)
                </div>
                <button onClick={handleImport} style={{
                  padding: "8px 20px", borderRadius: 8, border: "none",
                  background: "#22c55e", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
                }}>
                  📥 {csvPreview.length}件をインポート
                </button>
              </div>
              <div style={{ overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: "#f0fdf4" }}>
                      {["ホスト名", "シリアル番号", "プロファイル", "社員番号", "氏名", "設置場所"].map(h => (
                        <th key={h} style={{ ...thStyle, fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, fontWeight: 600, color: "#2563eb" }}>{r.hostname}</td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{r.serial}</td>
                        <td style={tdStyle}><span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#f1f5f9" }}>{r.profile}</span></td>
                        <td style={{ ...tdStyle, fontSize: 11 }}><code style={{ color: "#3b82f6" }}>{r.sam || "—"}</code></td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{r.cn || "—"}</td>
                        <td style={{ ...tdStyle, fontSize: 11, color: "#64748b" }}>{r.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: エクスポート ── */}
      {activeTab === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "📋 展開台帳（全フィールド）",
              desc: "ホスト名・シリアル番号・AD ユーザー・OU・ステータスを含む完全な展開記録",
              btn: "📤 全フィールドCSV出力",
              action: exportFull,
              color: "#2563eb",
              preview: "シリアル番号,ホスト名,プロファイル,OUパス,社員番号,氏名,...",
              count: records.length,
            },
            {
              title: "🔗 ホスト名↔シリアル番号 紐付け台帳",
              desc: "IT資産管理用。シリアル番号とホスト名の対応表のみをエクスポート",
              btn: "📤 シリアル↔ホスト名CSV",
              action: exportSerialHostname,
              color: "#22c55e",
              preview: "シリアル番号,ホスト名,プロファイル,設置場所,登録日",
              count: records.length,
            },
            {
              title: "👤 ADユーザー割り当て一覧",
              desc: "AD管理者向け。ホスト名・シリアル番号・ADユーザー（CN/SAM）・OUパスの対応表",
              btn: "📤 ADユーザー割り当てCSV",
              action: exportAdUsers,
              color: "#8b5cf6",
              preview: "ホスト名,シリアル番号,社員番号(sAMAccountName),氏名(CN),設置場所,OUパス",
              count: records.filter(r => r.sam).length,
            },
          ].map(e => (
            <div key={e.title} style={cardStyle}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{e.desc}</div>
                  <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 10px", fontFamily: "monospace", fontSize: 10, color: "#94a3b8" }}>
                    {e.preview}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{e.count} 件</div>
                </div>
                <button onClick={e.action} style={{
                  padding: "10px 20px", borderRadius: 8, border: "none",
                  background: e.color, color: "#fff", fontSize: 12,
                  cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0
                }}>{e.btn}</button>
              </div>
            </div>
          ))}

          <div style={{
            ...cardStyle, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 11, color: "#92400e"
          }}>
            💡 <strong>大量展開の推奨フロー:</strong><br/>
            1. 端末のシリアル番号一覧をCSVに入力（Excelで作成可）<br/>
            2. 社名規定のホスト名・プロファイル・ADユーザーを紐付け<br/>
            3. このページでインポート → ISO 配布時に自動参照<br/>
            4. 展開後に「シリアル↔ホスト名台帳」をエクスポートしてIT資産管理台帳に保管
          </div>
        </div>
      )}
    </div>
  );
}

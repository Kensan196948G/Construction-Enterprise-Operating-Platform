/* ========================================
   Documents PDF View — the default file browser
   ======================================== */

function DocumentsPDFView() {
  const [selectedDoc, setSelectedDoc] = React.useState(null);
  const cs = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  };

  const folders = [
    { name: "品川タワー新築工事", count: 142, updated: "2026/05/24" },
    { name: "横浜分譲マンション", count: 87, updated: "2026/05/23" },
    { name: "大田区土木工事", count: 63, updated: "2026/05/22" },
    { name: "共通図面", count: 215, updated: "2026/05/20" },
  ];

  const documents = [
    {
      name: "構造図_7F_鉄骨配置図.pdf",
      type: "PDF",
      size: "4.2MB",
      date: "2026/05/24",
      status: "承認済",
      author: "佐藤",
      version: "v3.1",
    },
    {
      name: "施工計画書_躯体工事_Rev2.pdf",
      type: "PDF",
      size: "8.7MB",
      date: "2026/05/23",
      status: "承認待ち",
      author: "田中",
      version: "v2.0",
    },
    {
      name: "配筋図_6F_スラブ.dwg",
      type: "CAD",
      size: "12.1MB",
      date: "2026/05/22",
      status: "承認済",
      author: "山田",
      version: "v1.2",
    },
    {
      name: "安全パトロール報告_0524.pdf",
      type: "PDF",
      size: "1.8MB",
      date: "2026/05/24",
      status: "新規",
      author: "鈴木",
      version: "v1.0",
    },
    {
      name: "BIMモデル_品川タワー.ifc",
      type: "BIM",
      size: "245MB",
      date: "2026/05/21",
      status: "最新",
      author: "高橋",
      version: "v4.0",
    },
    {
      name: "コンクリート強度試験_5F.pdf",
      type: "PDF",
      size: "2.4MB",
      date: "2026/05/24",
      status: "新規",
      author: "渡辺",
      version: "v1.0",
    },
    {
      name: "足場計画図.pdf",
      type: "PDF",
      size: "3.6MB",
      date: "2026/05/20",
      status: "承認済",
      author: "伊藤",
      version: "v2.1",
    },
    {
      name: "週間工程表_W22.xlsx",
      type: "Excel",
      size: "0.8MB",
      date: "2026/05/24",
      status: "配布済",
      author: "田中",
      version: "v1.0",
    },
  ];

  const typeColor = {
    PDF: "#dc2626",
    CAD: "#1a56db",
    BIM: "#7c3aed",
    Excel: "#16a34a",
  };
  const statusColor = {
    承認済: { bg: "#dcfce7", color: "#166534" },
    承認待ち: { bg: "#fff7ed", color: "#92400e" },
    新規: { bg: "#dbeafe", color: "#1e40af" },
    最新: { bg: "#f0fdf4", color: "#166534" },
    配布済: { bg: "#f1f5f9", color: "#475569" },
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
              margin: 0,
            }}
          >
            文書・図面管理
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            PDF・CAD・BIM・写真の統合管理
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#374151",
              fontFamily: "inherit",
            }}
          >
            <Icon name="download" size={14} />
            電子納品
          </button>
          <button
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#1a56db",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "inherit",
            }}
          >
            <Icon name="plus" size={14} />
            アップロード
          </button>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          ...cs,
          padding: "10px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            background: "#f8fafc",
            borderRadius: 8,
            padding: "6px 12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <Icon name="search" size={16} style={{ color: "#94a3b8" }} />
          <input
            placeholder="AI文書検索... ファイル名、内容、図面番号で検索"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "#0f172a",
              flex: 1,
              fontFamily: "inherit",
            }}
          />
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 4,
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            AI
          </span>
        </div>
        {["PDF", "CAD", "BIM", "写真"].map((f) => (
          <button
            key={f}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              background: "#fff",
              fontSize: 11,
              color: "#64748b",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: selectedDoc !== null ? "1fr 340px" : "1fr",
          gap: 20,
        }}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#64748b",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              プロジェクトフォルダ
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
                gap: 10,
              }}
            >
              {folders.map((f, i) => (
                <div
                  key={i}
                  style={{
                    ...cs,
                    padding: "12px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(0,0,0,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name="folder"
                      size={18}
                      style={{ color: "#1a56db" }}
                    />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {f.name}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}
                    >
                      {f.count}件 · {f.updated}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            最近のファイル
          </div>
          <div style={cs}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 70px 90px 80px 50px",
                gap: 12,
                padding: "10px 16px",
                borderBottom: "1px solid #e2e8f0",
                fontSize: 11,
                fontWeight: 600,
                color: "#94a3b8",
              }}
            >
              <span>ファイル名</span>
              <span>種類</span>
              <span>サイズ</span>
              <span>更新日</span>
              <span>ステータス</span>
              <span></span>
            </div>
            {documents.map((doc, i) => {
              const sc = statusColor[doc.status] || statusColor["新規"];
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDoc(i)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 60px 70px 90px 80px 50px",
                    gap: 12,
                    padding: "12px 16px",
                    alignItems: "center",
                    borderBottom:
                      i < documents.length - 1 ? "1px solid #f1f5f9" : "none",
                    cursor: "pointer",
                    background: selectedDoc === i ? "#f8fafc" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDoc !== i)
                      e.currentTarget.style.background = "#fafbfc";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDoc !== i)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        flexShrink: 0,
                        background: (typeColor[doc.type] || "#94a3b8") + "15",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        color: typeColor[doc.type] || "#94a3b8",
                      }}
                    >
                      {doc.type}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        {doc.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        {doc.author} · {doc.version}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {doc.type}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {doc.size}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {doc.date}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: sc.bg,
                      color: sc.color,
                    }}
                  >
                    {doc.status}
                  </span>
                  <button
                    style={{
                      padding: 4,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#94a3b8",
                    }}
                  >
                    <Icon name="eye" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDoc !== null && (
          <div style={{ ...cs, padding: 0, position: "sticky", top: 24 }}>
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                ファイル詳細
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#94a3b8",
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <div
                style={{
                  height: 180,
                  borderRadius: 8,
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 16,
                  border: "1px dashed #d1d5db",
                }}
              >
                <Icon name="file-text" size={32} style={{ color: "#94a3b8" }} />
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  プレビュー
                </span>
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 12,
                }}
              >
                {documents[selectedDoc].name}
              </div>
              {[
                ["種類", documents[selectedDoc].type],
                ["サイズ", documents[selectedDoc].size],
                ["作成者", documents[selectedDoc].author],
                ["バージョン", documents[selectedDoc].version],
                ["更新日", documents[selectedDoc].date],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    padding: "5px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>{k}</span>
                  <span style={{ color: "#0f172a", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 6,
                    border: "none",
                    background: "#1a56db",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  開く
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    color: "#374151",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ダウンロード
                </button>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: "#f5f3ff",
                  border: "1px solid #ede9fe",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#7c3aed",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="brain" size={12} />
                  AI要約
                </div>
                <div
                  style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}
                >
                  7階鉄骨配置図の最新版。前版からの変更点：梁接合部のボルト仕様変更（M22→M24）。
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.DocumentsPDFView = DocumentsPDFView;

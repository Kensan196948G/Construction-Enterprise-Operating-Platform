/* ========================================
   Construction Enterprise OS — Dashboard Page
   Multiple dashboard views: All / Field / Exec / AI / KPI
   ======================================== */

function DashboardPage({ subPath }) {
  const view =
    subPath === "/dashboard/field"
      ? "field"
      : subPath === "/dashboard/exec"
        ? "exec"
        : subPath === "/dashboard/ai"
          ? "ai"
          : subPath === "/dashboard/kpi"
            ? "kpi"
            : "all";

  if (view === "field") return <DashFieldView />;
  if (view === "exec") return <DashExecView />;
  if (view === "ai") return <DashAIView />;
  if (view === "kpi") return <DashKPIView />;
  return <DashAllView />;
}

/* ---- 全社統合ダッシュボード ---- */
function DashAllView() {
  const [now] = React.useState(new Date());
  const stats = [
    {
      label: "進行中工事",
      value: "12",
      trend: "+2 今月",
      up: true,
      color: "#1a56db",
      bg: "#eff6ff",
      icon: "clipboard",
    },
    {
      label: "要承認",
      value: "5",
      trend: "3件 期限切迫",
      up: false,
      color: "#f97316",
      bg: "#fff7ed",
      icon: "check-circle",
    },
    {
      label: "IoTアラート",
      value: "3",
      trend: "要対応",
      up: false,
      color: "#dc2626",
      bg: "#fef2f2",
      icon: "alert-triangle",
    },
    {
      label: "新着文書",
      value: "28",
      trend: "+8 今週",
      up: true,
      color: "#16a34a",
      bg: "#f0fdf4",
      icon: "file-text",
    },
    {
      label: "本日作業員",
      value: "186",
      trend: "13現場稼働",
      up: true,
      color: "#7c3aed",
      bg: "#f5f3ff",
      icon: "users",
    },
    {
      label: "工程遅延",
      value: "2",
      trend: "品川・川崎",
      up: false,
      color: "#92400e",
      bg: "#fef3c7",
      icon: "clock",
    },
  ];
  const activities = [
    {
      action: "安全パトロール報告書が提出されました",
      project: "品川タワー新築工事",
      time: "10分前",
      type: "safety",
    },
    {
      action: "工程会議議事録の承認依頼",
      project: "横浜分譲マンション",
      time: "32分前",
      type: "approval",
    },
    {
      action: "コンクリート強度試験結果がアップロード",
      project: "大田区土木工事",
      time: "1時間前",
      type: "document",
    },
    {
      action: "週間安全サイクルが完了しました",
      project: "新宿再開発ビル",
      time: "2時間前",
      type: "check",
    },
    {
      action: "重機稼働データの異常を検知",
      project: "川崎物流センター",
      time: "3時間前",
      type: "alert",
    },
    {
      action: "ドローン測量データが処理完了",
      project: "千葉港湾整備",
      time: "4時間前",
      type: "document",
    },
  ];
  const typeColors = {
    safety: "#f97316",
    approval: "#1a56db",
    document: "#16a34a",
    check: "#7c3aed",
    alert: "#dc2626",
  };
  const projects = [
    { name: "品川タワー新築工事", progress: 68, status: "施工中", workers: 45 },
    { name: "横浜分譲マンション", progress: 42, status: "施工中", workers: 32 },
    { name: "大田区土木工事", progress: 85, status: "仕上げ", workers: 18 },
    { name: "新宿再開発ビル", progress: 23, status: "基礎", workers: 28 },
    { name: "川崎物流センター", progress: 55, status: "躯体", workers: 38 },
  ];
  const cs = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: 20,
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}
        >
          おかえりなさい、田中さん
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          {now.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}{" "}
          — 本日も安全第一で。
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              ...cs,
              padding: 16,
              cursor: "pointer",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={s.icon} size={18} style={{ color: s.color }} />
              </div>
              <Icon
                name="arrow-up-right"
                size={14}
                style={{ color: "#94a3b8" }}
              />
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
                marginTop: 12,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#64748b",
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 11,
                marginTop: 6,
                fontWeight: 500,
                color: s.up ? "#16a34a" : "#dc2626",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Icon name={s.up ? "trending-up" : "trending-down"} size={12} />
              {s.trend}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Map */}
        <div style={{ ...cs, padding: 0, overflow: "hidden", minHeight: 300 }}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              工事位置マップ
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#16a34a",
                }}
              ></span>
              リアルタイム
            </span>
          </div>
          <div
            style={{ height: 260, background: "#f0f4f8", position: "relative" }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 500 260"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#bfdbfe" />
                  <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
              </defs>
              <rect fill="url(#water)" width="500" height="260" />
              <path
                d="M50,50 Q100,30 180,60 Q250,80 300,50 Q350,30 400,70 L400,200 Q350,180 300,200 Q250,220 180,190 Q100,170 50,200 Z"
                fill="#d1fae5"
                stroke="#86efac"
                strokeWidth="1"
              />
              <path
                d="M320,120 Q380,100 450,140 L450,230 Q380,210 320,230 Z"
                fill="#d1fae5"
                stroke="#86efac"
                strokeWidth="1"
              />
              {[
                { x: 120, y: 90, c: "#1a56db", l: "品川" },
                { x: 200, y: 140, c: "#16a34a", l: "横浜" },
                { x: 160, y: 170, c: "#f97316", l: "大田区" },
                { x: 280, y: 80, c: "#7c3aed", l: "新宿" },
                { x: 360, y: 130, c: "#dc2626", l: "川崎" },
              ].map((m, i) => (
                <g key={i}>
                  <circle cx={m.x} cy={m.y} r="16" fill={m.c} opacity="0.15">
                    <animate
                      attributeName="r"
                      values="14;20;14"
                      dur="3s"
                      repeatCount="indefinite"
                      begin={`${i * 0.5}s`}
                    />
                  </circle>
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r="5"
                    fill={m.c}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x={m.x}
                    y={m.y - 12}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#374151"
                    fontWeight="600"
                    fontFamily="'Noto Sans JP',sans-serif"
                  >
                    {m.l}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
        {/* AI Insights */}
        <div style={cs}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Icon name="brain" size={18} style={{ color: "#7c3aed" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              AI分析・予測
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#7c3aed",
                background: "#f5f3ff",
                padding: "3px 8px",
                borderRadius: 10,
                fontWeight: 600,
                marginLeft: "auto",
              }}
            >
              AI推奨アクション
            </span>
          </div>
          {[
            {
              title: "工程遅延リスク",
              desc: "品川タワー：鉄骨建方が2日遅延。天候影響による後続工程への波及を予測",
              sev: "warning",
            },
            {
              title: "原価超過予測",
              desc: "川崎物流センター：資材高騰により予算比+3.2%の超過見込み",
              sev: "danger",
            },
            {
              title: "安全改善提案",
              desc: "AI画像解析：横浜現場の足場設置状況について改善推奨",
              sev: "info",
            },
          ].map((ins, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 8,
                marginBottom: 10,
                background:
                  ins.sev === "warning"
                    ? "#fff7ed"
                    : ins.sev === "danger"
                      ? "#fef2f2"
                      : "#eff6ff",
                borderLeft: `3px solid ${ins.sev === "warning" ? "#f97316" : ins.sev === "danger" ? "#dc2626" : "#1a56db"}`,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 4,
                }}
              >
                {ins.title}
              </div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                {ins.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div style={{ ...cs, padding: 0 }}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              最近のアクティビティ
            </span>
            <button
              style={{
                fontSize: 12,
                color: "#1a56db",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              すべて表示
            </button>
          </div>
          {activities.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "12px 20px",
                borderBottom:
                  i < activities.length - 1 ? "1px solid #f1f5f9" : "none",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  marginTop: 5,
                  flexShrink: 0,
                  background: typeColors[item.type],
                }}
              ></span>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}
                >
                  {item.action}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                  {item.project} · {item.time}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={cs}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 16,
            }}
          >
            工事進捗
          </div>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <span
                  style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}
                >
                  {p.name}
                </span>
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: "#1a56db" }}
                >
                  {p.progress}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "#e2e8f0",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${p.progress}%`,
                    background:
                      p.progress > 70
                        ? "#16a34a"
                        : p.progress > 40
                          ? "#1a56db"
                          : "#f97316",
                  }}
                ></div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 4,
                  fontSize: 10,
                  color: "#94a3b8",
                }}
              >
                <span>{p.status}</span>
                <span>{p.workers}名</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- 現場ダッシュボード ---- */
function DashFieldView() {
  const cs = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  };
  const weather = [
    { time: "09:00", temp: "28°C", wind: "3m/s", icon: "sun" },
    { time: "12:00", temp: "32°C", wind: "5m/s", icon: "sun" },
    { time: "15:00", temp: "30°C", wind: "8m/s", icon: "cloud" },
    { time: "18:00", temp: "26°C", wind: "4m/s", icon: "cloud" },
  ];
  const safetyItems = [
    { label: "新規入場者教育", count: 3, color: "#1a56db" },
    { label: "KY活動完了率", count: "92%", color: "#16a34a" },
    { label: "ヒヤリハット", count: 1, color: "#f97316" },
    { label: "是正指摘", count: 2, color: "#dc2626" },
  ];
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}
        >
          現場ダッシュボード
        </h1>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          全現場のリアルタイム状況を一覧表示
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "稼働現場",
            value: "13",
            icon: "hard-hat",
            color: "#1a56db",
            bg: "#eff6ff",
          },
          {
            label: "本日作業員",
            value: "186",
            icon: "users",
            color: "#16a34a",
            bg: "#f0fdf4",
          },
          {
            label: "重機稼働",
            value: "42台",
            icon: "zap",
            color: "#f97316",
            bg: "#fff7ed",
          },
          {
            label: "安全アラート",
            value: "3",
            icon: "alert-triangle",
            color: "#dc2626",
            bg: "#fef2f2",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              ...cs,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={s.icon} size={16} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={cs}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            本日の気象予報
          </div>
          <div
            style={{
              padding: 16,
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 12,
            }}
          >
            {weather.map((w, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  borderRadius: 8,
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}
                >
                  {w.time}
                </div>
                <Icon
                  name={w.icon}
                  size={24}
                  style={{
                    color: w.icon === "sun" ? "#eab308" : "#94a3b8",
                    margin: "0 auto 6px",
                    display: "block",
                  }}
                />
                <div
                  style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}
                >
                  {w.temp}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#64748b",
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                  }}
                >
                  <Icon name="wind" size={10} />
                  {w.wind}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid #e2e8f0",
              background: "#fff7ed",
              borderRadius: "0 0 12px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#92400e",
            }}
          >
            <Icon
              name="alert-triangle"
              size={14}
              style={{ color: "#f97316" }}
            />
            15時以降 風速増加予報 — クレーン作業要注意
          </div>
        </div>
        <div style={cs}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            安全管理サマリー
          </div>
          <div
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {safetyItems.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#f8fafc",
                }}
              >
                <span
                  style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}
                >
                  {s.label}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>
                  {s.count}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>
                WBGT警戒: 28°C（厳重警戒）
              </div>
              <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>
                全現場へ熱中症対策強化指示済み
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- 経営ダッシュボード ---- */
function DashExecView() {
  const cs = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  };
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}
        >
          経営ダッシュボード
        </h1>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          売上・利益・受注残・リスクの経営視点サマリー
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "年度売上高",
            value: "¥18.2B",
            sub: "前年比 +12.3%",
            icon: "trending-up",
            color: "#1a56db",
            bg: "#eff6ff",
          },
          {
            label: "粗利率",
            value: "14.8%",
            sub: "目標15.0%",
            icon: "activity",
            color: "#f97316",
            bg: "#fff7ed",
          },
          {
            label: "受注残高",
            value: "¥42.5B",
            sub: "24案件",
            icon: "clipboard",
            color: "#16a34a",
            bg: "#f0fdf4",
          },
          {
            label: "原価差異",
            value: "-¥180M",
            sub: "超過3件",
            icon: "alert-triangle",
            color: "#dc2626",
            bg: "#fef2f2",
          },
        ].map((s, i) => (
          <div key={i} style={{ ...cs, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
                <div
                  style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}
                >
                  {s.value}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={cs}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            売上推移
          </div>
          <div style={{ padding: 16 }}>
            <svg
              width="100%"
              height="160"
              viewBox="0 0 500 160"
              preserveAspectRatio="none"
            >
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 50 + 10}
                  x2="500"
                  y2={i * 50 + 10}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              ))}
              <path
                d="M20,140 L60,130 L100,125 L140,110 L180,100 L220,95 L260,85 L300,80 L340,70 L380,55 L420,45 L460,35 L500,25"
                fill="none"
                stroke="#1a56db"
                strokeWidth="2.5"
              />
              <path
                d="M20,140 L60,130 L100,125 L140,110 L180,100 L220,95 L260,85 L300,80 L340,70 L380,55 L420,45 L460,35 L500,25 L500,160 L20,160 Z"
                fill="#1a56db10"
              />
            </svg>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "#94a3b8",
                marginTop: 4,
              }}
            >
              <span>4月</span>
              <span>6月</span>
              <span>8月</span>
              <span>10月</span>
              <span>12月</span>
              <span>2月</span>
            </div>
          </div>
        </div>
        <div style={cs}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            部門別利益率
          </div>
          <div
            style={{
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[
              {
                name: "建築事業部",
                profit: "15.2%",
                revenue: "¥8.4B",
                color: "#1a56db",
                pct: 76,
              },
              {
                name: "土木事業部",
                profit: "13.8%",
                revenue: "¥5.2B",
                color: "#16a34a",
                pct: 69,
              },
              {
                name: "港湾事業部",
                profit: "16.1%",
                revenue: "¥3.1B",
                color: "#7c3aed",
                pct: 80,
              },
              {
                name: "その他",
                profit: "11.5%",
                revenue: "¥1.5B",
                color: "#f97316",
                pct: 57,
              },
            ].map((d, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontWeight: 500, color: "#0f172a" }}>
                    {d.name}
                  </span>
                  <span style={{ fontWeight: 600, color: d.color }}>
                    {d.profit}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "#e2e8f0",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${d.pct}%`,
                      background: d.color,
                      borderRadius: 3,
                    }}
                  ></div>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  売上 {d.revenue}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- AI分析ダッシュボード ---- */
function DashAIView() {
  const cs = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  };
  const models = [
    {
      name: "工程遅延予測モデル",
      accuracy: "87.2%",
      lastTrained: "2026/05/20",
      predictions: 342,
      status: "active",
    },
    {
      name: "原価超過予測モデル",
      accuracy: "82.5%",
      lastTrained: "2026/05/18",
      predictions: 156,
      status: "active",
    },
    {
      name: "安全リスク判定モデル",
      accuracy: "91.3%",
      lastTrained: "2026/05/22",
      predictions: 891,
      status: "active",
    },
    {
      name: "画像異常検知モデル",
      accuracy: "94.1%",
      lastTrained: "2026/05/24",
      predictions: 2340,
      status: "active",
    },
    {
      name: "品質予測モデル",
      accuracy: "79.8%",
      lastTrained: "2026/05/15",
      predictions: 89,
      status: "training",
    },
  ];
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}
        >
          AI分析ダッシュボード
        </h1>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          AIモデル稼働状況・予測精度・分析結果
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "稼働AIモデル",
            value: "5",
            icon: "brain",
            color: "#7c3aed",
            bg: "#f5f3ff",
          },
          {
            label: "本日予測数",
            value: "3,818",
            icon: "zap",
            color: "#1a56db",
            bg: "#eff6ff",
          },
          {
            label: "平均精度",
            value: "86.9%",
            icon: "check-circle",
            color: "#16a34a",
            bg: "#f0fdf4",
          },
          {
            label: "検知アラート",
            value: "7",
            icon: "alert-triangle",
            color: "#f97316",
            bg: "#fff7ed",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              ...cs,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={s.icon} size={16} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={cs}>
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #e2e8f0",
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          AIモデル一覧
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 80px 120px 100px 80px",
            gap: 12,
            padding: "10px 16px",
            borderBottom: "1px solid #e2e8f0",
            fontSize: 11,
            fontWeight: 600,
            color: "#94a3b8",
          }}
        >
          <span>モデル名</span>
          <span>精度</span>
          <span>最終学習</span>
          <span>予測回数</span>
          <span>状態</span>
        </div>
        {models.map((m, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 80px 120px 100px 80px",
              gap: 12,
              padding: "12px 16px",
              alignItems: "center",
              borderBottom:
                i < models.length - 1 ? "1px solid #f1f5f9" : "none",
              fontSize: 12,
            }}
          >
            <span
              style={{
                fontWeight: 500,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="brain" size={14} style={{ color: "#7c3aed" }} />
              {m.name}
            </span>
            <span style={{ fontWeight: 600, color: "#16a34a" }}>
              {m.accuracy}
            </span>
            <span style={{ color: "#64748b", fontSize: 11 }}>
              {m.lastTrained}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                color: "#374151",
                fontSize: 11,
              }}
            >
              {m.predictions.toLocaleString()}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 10,
                background: m.status === "active" ? "#dcfce7" : "#fef3c7",
                color: m.status === "active" ? "#166534" : "#92400e",
              }}
            >
              {m.status === "active" ? "稼働中" : "学習中"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- KPI / アラート ---- */
function DashKPIView() {
  const cs = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  };
  const kpis = [
    {
      category: "工程",
      items: [
        {
          name: "全工事平均進捗率",
          value: "54.6%",
          target: "58%",
          status: "warning",
        },
        { name: "工程遵守率", value: "84.2%", target: "90%", status: "danger" },
        {
          name: "工期内完了率",
          value: "92.0%",
          target: "95%",
          status: "warning",
        },
      ],
    },
    {
      category: "安全",
      items: [
        { name: "度数率", value: "0.42", target: "<1.0", status: "ok" },
        { name: "強度率", value: "0.08", target: "<0.1", status: "ok" },
        { name: "KY実施率", value: "92%", target: "100%", status: "warning" },
      ],
    },
    {
      category: "原価",
      items: [
        { name: "原価差異率", value: "+2.1%", target: "±1%", status: "danger" },
        { name: "購買効率", value: "88.5%", target: "90%", status: "warning" },
        { name: "外注費比率", value: "62.3%", target: "<65%", status: "ok" },
      ],
    },
    {
      category: "品質",
      items: [
        { name: "手戻り率", value: "1.8%", target: "<2%", status: "ok" },
        { name: "検査合格率", value: "98.2%", target: ">97%", status: "ok" },
        { name: "顧客満足度", value: "4.2/5.0", target: ">4.0", status: "ok" },
      ],
    },
  ];
  const statusIcon = { ok: "#16a34a", warning: "#f97316", danger: "#dc2626" };
  const alerts = [
    {
      time: "09:15",
      message: "品川タワー：鉄骨建方 2日遅延",
      severity: "warning",
    },
    {
      time: "09:00",
      message: "川崎物流：原価超過予測 +¥180M",
      severity: "danger",
    },
    {
      time: "08:42",
      message: "全現場：WBGT 28°C 熱中症厳重警戒",
      severity: "warning",
    },
    {
      time: "08:30",
      message: "横浜マンション：足場不備是正勧告",
      severity: "danger",
    },
    {
      time: "08:15",
      message: "風速計#3：風速8.5m/s（閾値接近）",
      severity: "warning",
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}
        >
          KPI / アラート
        </h1>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          重要業績評価指標とアラート一覧
        </p>
      </div>
      {alerts.map((a, i) => (
        <div
          key={i}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            marginBottom: 6,
            background: a.severity === "danger" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${a.severity === "danger" ? "#fecaca" : "#fed7aa"}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
          }}
        >
          <Icon
            name="alert-triangle"
            size={14}
            style={{ color: a.severity === "danger" ? "#dc2626" : "#f97316" }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: "#94a3b8",
              width: 40,
            }}
          >
            {a.time}
          </span>
          <span
            style={{
              color: a.severity === "danger" ? "#991b1b" : "#92400e",
              fontWeight: 500,
            }}
          >
            {a.message}
          </span>
        </div>
      ))}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 16,
          marginTop: 16,
        }}
      >
        {kpis.map((cat, ci) => (
          <div key={ci} style={cs}>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e2e8f0",
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {cat.category} KPI
            </div>
            <div
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {cat.items.map((k, ki) => (
                <div
                  key={ki}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "#f8fafc",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: statusIcon[k.status],
                    }}
                  ></span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: "#374151",
                      fontWeight: 500,
                    }}
                  >
                    {k.name}
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: statusIcon[k.status],
                    }}
                  >
                    {k.value}
                  </span>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>
                    目標: {k.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.DashboardPage = DashboardPage;

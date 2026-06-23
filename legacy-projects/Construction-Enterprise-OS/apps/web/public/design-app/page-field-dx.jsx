/* ========================================
   Construction Enterprise OS — 現場DX Page
   Project list, timeline, safety, worker management
   Routes sub-paths to specific views
   ======================================== */

function FieldDXPage({ subPath }) {
  // Route sub-pages to dedicated views
  if (subPath !== "/field/projects" && subPath !== "/field") {
    return <FieldSubPage subPath={subPath} />;
  }
  // Default: project list + detail view
  return <FieldProjectsView />;
}

function FieldProjectsView() {
  const [selectedProject, setSelectedProject] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState("timeline");

  const projects = [
    {
      name: "品川タワー新築工事",
      client: "品川都市開発(株)",
      period: "2025/04 〜 2027/03",
      progress: 68,
      status: "施工中",
      workers: 45,
      equipment: 8,
      weather: "晴れ 32°C",
      phases: [
        { name: "基礎工事", progress: 100, status: "done" },
        { name: "躯体工事", progress: 85, status: "active" },
        { name: "内装工事", progress: 15, status: "upcoming" },
        { name: "外装工事", progress: 0, status: "upcoming" },
        { name: "設備工事", progress: 5, status: "upcoming" },
      ],
      todayTasks: [
        { time: "08:00", task: "朝礼・KY活動", status: "done" },
        { time: "08:30", task: "7F鉄骨建方", status: "active" },
        { time: "10:00", task: "コンクリート打設（5F）", status: "active" },
        { time: "13:00", task: "配筋検査（6F）", status: "upcoming" },
        { time: "15:00", task: "安全パトロール", status: "upcoming" },
        { time: "16:30", task: "作業終了・後片付け", status: "upcoming" },
      ],
      alerts: [
        {
          type: "warning",
          message: "明日15時以降 強風予報（風速12m/s）— クレーン作業中止検討",
        },
        { type: "info", message: "AI工程分析：鉄骨建方は予定通り完了見込み" },
      ],
    },
    {
      name: "横浜分譲マンション",
      client: "横浜住宅(株)",
      period: "2025/06 〜 2027/09",
      progress: 42,
      status: "施工中",
      workers: 32,
      equipment: 5,
      weather: "曇り 28°C",
      phases: [
        { name: "基礎工事", progress: 100, status: "done" },
        { name: "躯体工事", progress: 45, status: "active" },
        { name: "内装工事", progress: 0, status: "upcoming" },
        { name: "外構工事", progress: 0, status: "upcoming" },
      ],
      todayTasks: [
        { time: "08:00", task: "朝礼・KY活動", status: "done" },
        { time: "08:30", task: "3F型枠組立", status: "active" },
        { time: "10:00", task: "2F配筋作業", status: "active" },
        { time: "14:00", task: "足場点検", status: "upcoming" },
      ],
      alerts: [
        {
          type: "danger",
          message: "足場不備を検知 — AI画像解析により是正勧告",
        },
      ],
    },
  ];

  const proj = projects[selectedProject];

  const statusDot = (s) =>
    ({
      done: "#16a34a",
      active: "#1a56db",
      upcoming: "#d1d5db",
    })[s];

  const tabStyle = (active) => ({
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    color: active ? "#1a56db" : "#64748b",
    cursor: "pointer",
    borderBottom: active ? "2px solid #1a56db" : "2px solid transparent",
    background: "none",
    border: "none",
    borderBottomStyle: "solid",
    fontFamily: "inherit",
    transition: "all 0.15s",
  });

  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
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
            現場DX
          </h1>
          <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
            工事管理・現場進捗・安全管理
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#374151",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "inherit",
            }}
          >
            <Icon name="filter" size={14} />
            フィルタ
          </button>
          <button
            style={{
              padding: "8px 16px",
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
            新規工事登録
          </button>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}
      >
        {/* Project list */}
        <div style={{ ...cardStyle, padding: 0 }}>
          <div
            style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
              工事一覧
            </div>
          </div>
          <div>
            {projects.map((p, i) => (
              <div
                key={i}
                onClick={() => setSelectedProject(i)}
                style={{
                  padding: "14px 16px",
                  cursor: "pointer",
                  background: i === selectedProject ? "#eff6ff" : "transparent",
                  borderBottom: "1px solid #f1f5f9",
                  borderLeft:
                    i === selectedProject
                      ? "3px solid #1a56db"
                      : "3px solid transparent",
                  transition: "all 0.12s",
                }}
              >
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                  {p.client}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: "#e2e8f0",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${p.progress}%`,
                        borderRadius: 2,
                        background: p.progress > 70 ? "#16a34a" : "#1a56db",
                      }}
                    ></div>
                  </div>
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: "#1a56db" }}
                  >
                    {p.progress}%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 6,
                    fontSize: 10,
                    color: "#94a3b8",
                  }}
                >
                  <span>{p.workers}名</span>
                  <span>重機{p.equipment}台</span>
                  <span>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project detail */}
        <div>
          {/* Project header cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[
              {
                label: "進捗率",
                value: `${proj.progress}%`,
                icon: "activity",
                color: "#1a56db",
                bg: "#eff6ff",
              },
              {
                label: "作業員",
                value: `${proj.workers}名`,
                icon: "users",
                color: "#7c3aed",
                bg: "#f5f3ff",
              },
              {
                label: "重機稼働",
                value: `${proj.equipment}台`,
                icon: "hard-hat",
                color: "#f97316",
                bg: "#fff7ed",
              },
              {
                label: "天候",
                value: proj.weather,
                icon: "sun",
                color: "#eab308",
                bg: "#fefce8",
              },
            ].map((s, i) => (
              <div key={i} style={{ ...cardStyle, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: s.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={s.icon} size={16} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {s.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {proj.alerts.map((a, i) => (
            <div
              key={i}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 8,
                background:
                  a.type === "danger"
                    ? "#fef2f2"
                    : a.type === "warning"
                      ? "#fff7ed"
                      : "#eff6ff",
                border: `1px solid ${a.type === "danger" ? "#fecaca" : a.type === "warning" ? "#fed7aa" : "#bfdbfe"}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 12,
                color:
                  a.type === "danger"
                    ? "#991b1b"
                    : a.type === "warning"
                      ? "#92400e"
                      : "#1e3a8a",
              }}
            >
              <Icon name="alert-triangle" size={16} />
              <span style={{ fontWeight: 500 }}>{a.message}</span>
            </div>
          ))}

          {/* Tabs */}
          <div style={{ ...cardStyle, marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #e2e8f0",
                padding: "0 16px",
              }}
            >
              {[
                { id: "timeline", label: "本日の工程" },
                { id: "phases", label: "全体工程" },
                { id: "photos", label: "現場写真" },
                { id: "safety", label: "安全管理" },
                { id: "daily", label: "日報" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={tabStyle(activeTab === t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 20 }}>
              {activeTab === "timeline" && (
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0f172a",
                      marginBottom: 16,
                    }}
                  >
                    本日のタイムライン — {proj.name}
                  </div>
                  <div style={{ position: "relative", paddingLeft: 24 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 7,
                        top: 4,
                        bottom: 4,
                        width: 2,
                        background: "#e2e8f0",
                      }}
                    ></div>
                    {proj.todayTasks.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          marginBottom: 20,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: -20,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: statusDot(t.status),
                            border: "2px solid #fff",
                            boxShadow:
                              "0 0 0 2px " + statusDot(t.status) + "40",
                            marginTop: 2,
                          }}
                        ></div>
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              fontWeight: 500,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {t.time}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: t.status === "active" ? 600 : 400,
                              color:
                                t.status === "done" ? "#94a3b8" : "#0f172a",
                              textDecoration:
                                t.status === "done" ? "line-through" : "none",
                              marginTop: 2,
                            }}
                          >
                            {t.task}
                          </div>
                          {t.status === "active" && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#1a56db",
                                background: "#eff6ff",
                                padding: "2px 8px",
                                borderRadius: 10,
                              }}
                            >
                              作業中
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "phases" && (
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0f172a",
                      marginBottom: 16,
                    }}
                  >
                    全体工程 — {proj.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {proj.phases.map((ph, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          background:
                            ph.status === "active" ? "#eff6ff" : "#f8fafc",
                          border: `1px solid ${ph.status === "active" ? "#bfdbfe" : "#e2e8f0"}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {ph.name}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 10,
                              background:
                                ph.status === "done"
                                  ? "#dcfce7"
                                  : ph.status === "active"
                                    ? "#dbeafe"
                                    : "#f1f5f9",
                              color:
                                ph.status === "done"
                                  ? "#166534"
                                  : ph.status === "active"
                                    ? "#1e40af"
                                    : "#94a3b8",
                            }}
                          >
                            {ph.status === "done"
                              ? "完了"
                              : ph.status === "active"
                                ? "進行中"
                                : "未着手"}
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
                              width: `${ph.progress}%`,
                              borderRadius: 3,
                              background:
                                ph.status === "done" ? "#16a34a" : "#1a56db",
                              transition: "width 0.8s",
                            }}
                          ></div>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
                            marginTop: 4,
                          }}
                        >
                          {ph.progress}% 完了
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "photos" && (
                <div
                  style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}
                >
                  <Icon
                    name="camera"
                    size={40}
                    style={{ color: "#d1d5db", margin: "0 auto 12px" }}
                  />
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    現場写真ビューア
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    写真を選択するか、新しい写真をアップロードしてください
                  </div>
                </div>
              )}

              {activeTab === "safety" && (
                <div
                  style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}
                >
                  <Icon
                    name="shield"
                    size={40}
                    style={{ color: "#d1d5db", margin: "0 auto 12px" }}
                  />
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    安全管理パネル
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    KY活動記録・安全パトロール・ヒヤリハット
                  </div>
                </div>
              )}

              {activeTab === "daily" && (
                <div
                  style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}
                >
                  <Icon
                    name="file-text"
                    size={40}
                    style={{ color: "#d1d5db", margin: "0 auto 12px" }}
                  />
                  <div style={{ fontSize: 14, fontWeight: 500 }}>作業日報</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    本日の作業日報を作成・確認できます
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.FieldDXPage = FieldDXPage;

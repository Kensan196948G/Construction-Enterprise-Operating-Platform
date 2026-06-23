/* ========================================
   Construction Enterprise OS — Sidebar Component
   3-tier accordion with role-based filtering
   ======================================== */

function Sidebar({ currentPath, onNavigate, collapsed, onToggle, activeRole }) {
  const [openCategories, setOpenCategories] = React.useState(() => {
    const defaults =
      activeRole && ROLE_DEFAULTS[activeRole]
        ? ROLE_DEFAULTS[activeRole]
        : ["dashboard"];
    const map = {};
    defaults.forEach((id) => (map[id] = true));
    // Also open category that contains currentPath
    MENU_STRUCTURE.forEach((cat) => {
      cat.sections.forEach((sec) => {
        sec.pages.forEach((p) => {
          if (p.href === currentPath) map[cat.id] = true;
        });
      });
    });
    return map;
  });

  const [openSections, setOpenSections] = React.useState(() => {
    const map = {};
    MENU_STRUCTURE.forEach((cat) => {
      cat.sections.forEach((sec) => {
        if (sec.defaultOpen) map[sec.id] = true;
        sec.pages.forEach((p) => {
          if (p.href === currentPath) map[sec.id] = true;
        });
      });
    });
    return map;
  });

  React.useEffect(() => {
    if (activeRole && ROLE_DEFAULTS[activeRole]) {
      const newOpen = {};
      ROLE_DEFAULTS[activeRole].forEach((id) => (newOpen[id] = true));
      setOpenCategories((prev) => ({ ...prev, ...newOpen }));
    }
  }, [activeRole]);

  const toggleCat = (id) => setOpenCategories((p) => ({ ...p, [id]: !p[id] }));
  const toggleSec = (id) => setOpenSections((p) => ({ ...p, [id]: !p[id] }));

  const isVisible = (section) => {
    if (!activeRole || activeRole === "admin") return true;
    if (!section.roles) return true;
    return section.roles.includes(activeRole);
  };

  const filteredMenu = MENU_STRUCTURE.filter((cat) => {
    return cat.sections.some((sec) => isVisible(sec));
  });

  const sidebarStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--sidebar-bg, #0f172a)",
    color: "#94a3b8",
    width: collapsed ? 60 : 264,
    transition: "width 0.25s cubic-bezier(.4,0,.2,1)",
    overflow: "hidden",
    flexShrink: 0,
    position: "relative",
    fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    borderRight: "1px solid var(--sidebar-border, rgba(148,163,184,0.12))",
  };

  return (
    <aside style={sidebarStyle}>
      {/* Logo header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: collapsed ? "16px 0" : "16px 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(148,163,184,0.12)",
          minHeight: 56,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #1a56db)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#fff",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          OS
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#e2e8f0",
                letterSpacing: "-0.02em",
              }}
            >
              Construction
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Enterprise OS
            </div>
          </div>
        )}
      </div>

      {/* Role indicator */}
      {!collapsed && activeRole && ROLES[activeRole] && (
        <div
          style={{
            margin: "8px 12px 4px",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            background: ROLES[activeRole].color + "18",
            color: ROLES[activeRole].color,
            border: `1px solid ${ROLES[activeRole].color}30`,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ROLES[activeRole].color,
            }}
          ></span>
          {ROLES[activeRole].label}ビュー
        </div>
      )}

      {/* Menu body */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: collapsed ? "8px 4px" : "8px",
          scrollbarWidth: "thin",
          scrollbarColor: "#334155 transparent",
        }}
      >
        {filteredMenu.map((cat) => {
          const isOpen = openCategories[cat.id];
          const hasActive = cat.sections.some((s) =>
            s.pages.some((p) => p.href === currentPath),
          );

          if (collapsed) {
            return (
              <div key={cat.id} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => {
                    toggleCat(cat.id);
                    // Navigate to first page
                    const firstPage = cat.sections[0]?.pages[0];
                    if (firstPage) onNavigate(firstPage.href);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: "none",
                    background: hasActive ? "#1e3a8a" : "transparent",
                    color: hasActive ? "#93c5fd" : "#64748b",
                    cursor: "pointer",
                    margin: "0 auto",
                    transition: "all 0.15s",
                  }}
                  title={cat.label}
                >
                  <Icon name={cat.icon} size={20} />
                </button>
              </div>
            );
          }

          return (
            <div key={cat.id} style={{ marginBottom: 2 }}>
              <button
                onClick={() => toggleCat(cat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: hasActive ? "#1e293b" : "transparent",
                  color: hasActive ? "#e2e8f0" : "#94a3b8",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.15s",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (!hasActive) e.currentTarget.style.background = "#1e293b";
                }}
                onMouseLeave={(e) => {
                  if (!hasActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon
                  name={cat.icon}
                  size={18}
                  style={{ color: hasActive ? "#60a5fa" : "#64748b" }}
                />
                <span style={{ flex: 1, textAlign: "left" }}>{cat.label}</span>
                {/* Badge count */}
                {cat.sections.some((s) => s.pages.some((p) => p.badge)) && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 10,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {cat.sections
                      .flatMap((s) => s.pages)
                      .filter((p) => p.badge)
                      .reduce((a, p) => {
                        const n = parseInt(p.badge);
                        return a + (isNaN(n) ? 1 : n);
                      }, 0)}
                  </span>
                )}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{
                    transition: "transform 0.2s",
                    transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                    opacity: 0.5,
                  }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Sections (tier 2) */}
              <div
                style={{
                  maxHeight: isOpen ? 2000 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.3s cubic-bezier(.4,0,.2,1)",
                }}
              >
                {cat.sections.filter(isVisible).map((sec) => {
                  const secOpen = openSections[sec.id];
                  const secHasActive = sec.pages.some(
                    (p) => p.href === currentPath,
                  );

                  return (
                    <div key={sec.id} style={{ marginLeft: 12, marginTop: 2 }}>
                      <button
                        onClick={() => toggleSec(sec.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          width: "100%",
                          padding: "5px 8px",
                          borderRadius: 6,
                          border: "none",
                          background: "transparent",
                          color: secHasActive ? "#bfdbfe" : "#64748b",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                          transition: "all 0.15s",
                          textAlign: "left",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#94a3b8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = secHasActive
                            ? "#bfdbfe"
                            : "#64748b")
                        }
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          style={{
                            transition: "transform 0.2s",
                            transform: secOpen ? "rotate(90deg)" : "rotate(0)",
                          }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span>{sec.label}</span>
                      </button>

                      {/* Pages (tier 3) */}
                      <div
                        style={{
                          maxHeight: secOpen ? 1000 : 0,
                          overflow: "hidden",
                          transition:
                            "max-height 0.25s cubic-bezier(.4,0,.2,1)",
                        }}
                      >
                        {sec.pages.map((page) => {
                          const isActive = page.href === currentPath;
                          return (
                            <button
                              key={page.id}
                              onClick={() => onNavigate(page.href)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                width: "100%",
                                padding: "5px 8px 5px 28px",
                                borderRadius: 5,
                                border: "none",
                                background: isActive
                                  ? "#1a56db"
                                  : "transparent",
                                color: isActive ? "#fff" : "#64748b",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: isActive ? 600 : 400,
                                transition: "all 0.12s",
                                textAlign: "left",
                                fontFamily: "inherit",
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = "#1e293b";
                                  e.currentTarget.style.color = "#94a3b8";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background =
                                    "transparent";
                                  e.currentTarget.style.color = "#64748b";
                                }
                              }}
                            >
                              <span
                                style={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: "50%",
                                  background: isActive ? "#93c5fd" : "#475569",
                                  flexShrink: 0,
                                }}
                              ></span>
                              <span style={{ flex: 1 }}>{page.label}</span>
                              {page.badge && (
                                <span
                                  style={{
                                    background:
                                      page.badge === "!"
                                        ? "#f97316"
                                        : "#ef4444",
                                    color: "#fff",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    padding: "0px 5px",
                                    borderRadius: 8,
                                    minWidth: 16,
                                    textAlign: "center",
                                    lineHeight: "16px",
                                  }}
                                >
                                  {page.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        style={{
          position: "absolute",
          top: 62,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#1e293b",
          border: "2px solid #334155",
          color: "#94a3b8",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#334155";
          e.currentTarget.style.color = "#e2e8f0";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#1e293b";
          e.currentTarget.style.color = "#94a3b8";
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          {collapsed ? (
            <polyline points="9 18 15 12 9 6" />
          ) : (
            <polyline points="15 18 9 12 15 6" />
          )}
        </svg>
      </button>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(148,163,184,0.12)",
          padding: collapsed ? "10px 0" : "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#1e3a8a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#93c5fd",
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          TK
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#e2e8f0",
                whiteSpace: "nowrap",
              }}
            >
              田中 健一
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>
              {activeRole && ROLES[activeRole]
                ? ROLES[activeRole].label
                : "現場監督"}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;

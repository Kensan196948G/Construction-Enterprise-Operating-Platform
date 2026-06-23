/* ========================================
   Construction Enterprise OS — Dark Mode Theme Provider
   CSS custom properties for light/dark themes
   ======================================== */

function ThemeProvider({ dark, children }) {
  const vars = dark
    ? {
        "--bg": "#0f172a",
        "--bg-page": "#0f172a",
        "--bg-card": "#1e293b",
        "--bg-card-hover": "#334155",
        "--bg-subtle": "#1e293b",
        "--bg-input": "#334155",
        "--border": "#334155",
        "--border-light": "#1e293b",
        "--text": "#e2e8f0",
        "--text-secondary": "#94a3b8",
        "--text-muted": "#64748b",
        "--text-heading": "#f1f5f9",
        "--accent": "#3b82f6",
        "--accent-light": "#1e3a8a",
        "--shadow": "rgba(0,0,0,0.3)",
        "--sidebar-bg": "#020617",
        "--sidebar-border": "rgba(148,163,184,0.08)",
        "--header-bg": "#1e293b",
      }
    : {
        "--bg": "#f8fafc",
        "--bg-page": "#f8fafc",
        "--bg-card": "#ffffff",
        "--bg-card-hover": "#f8fafc",
        "--bg-subtle": "#f8fafc",
        "--bg-input": "#f8fafc",
        "--border": "#e2e8f0",
        "--border-light": "#f1f5f9",
        "--text": "#0f172a",
        "--text-secondary": "#374151",
        "--text-muted": "#64748b",
        "--text-heading": "#0f172a",
        "--accent": "#1a56db",
        "--accent-light": "#eff6ff",
        "--shadow": "rgba(0,0,0,0.08)",
        "--sidebar-bg": "#0f172a",
        "--sidebar-border": "rgba(148,163,184,0.12)",
        "--header-bg": "#ffffff",
      };

  return <div style={vars}>{children}</div>;
}

window.ThemeProvider = ThemeProvider;

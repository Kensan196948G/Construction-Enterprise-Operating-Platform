import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import TicketsPage from "@/pages/TicketsPage";
import CmdbExplorerPage from "@/pages/CmdbExplorerPage";
import SiemDashboardPage from "@/pages/SiemDashboardPage";
import NetworkMonitorPage from "@/pages/NetworkMonitorPage";
import EntraSigninLogsPage from "@/pages/EntraSigninLogsPage";
import AiHelpDeskPage from "@/pages/AiHelpDeskPage";
import KnowledgePage from "@/pages/KnowledgePage";
import SlaReportPage from "@/pages/SlaReportPage";

const NAV = [
  { to: "/tickets", label: "チケット" },
  { to: "/cmdb", label: "CMDB" },
  { to: "/siem", label: "SIEM" },
  { to: "/network", label: "ネットワーク" },
  { to: "/entra", label: "Entra ログ" },
  { to: "/ai", label: "AI HelpDesk" },
  { to: "/knowledge", label: "ナレッジ" },
  { to: "/sla", label: "SLA" }
];

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    // Skeleton: dev fallback - allow access. In production redirect to SSO.
    if (import.meta.env.DEV) return <>{children}</>;
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-slate-900 text-slate-100 p-4 space-y-1">
        <h1 className="text-lg font-bold mb-4">CDX ITSM</h1>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${isActive ? "bg-brand" : "hover:bg-slate-800"}`
            }
          >
            {n.label}
          </NavLink>
        ))}
      </aside>
      <main className="flex-1 p-6">
        <RequireAuth>
          <Routes>
            <Route path="/" element={<Navigate to="/tickets" replace />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/cmdb" element={<CmdbExplorerPage />} />
            <Route path="/siem" element={<SiemDashboardPage />} />
            <Route path="/network" element={<NetworkMonitorPage />} />
            <Route path="/entra" element={<EntraSigninLogsPage />} />
            <Route path="/ai" element={<AiHelpDeskPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/sla" element={<SlaReportPage />} />
          </Routes>
        </RequireAuth>
      </main>
    </div>
  );
}

import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import DashboardPage from "@/pages/DashboardPage";
import DataSourcesPage from "@/pages/DataSourcesPage";
import EtlPipelinesPage from "@/pages/EtlPipelinesPage";
import LakeBrowserPage from "@/pages/LakeBrowserPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import AiModelsPage from "@/pages/AiModelsPage";
import IotPage from "@/pages/IotPage";
import DigitalTwinPage from "@/pages/DigitalTwinPage";
import SearchPage from "@/pages/SearchPage";

const NAV = [
  { to: "/dashboard", label: "ダッシュボード" },
  { to: "/sources", label: "データソース" },
  { to: "/etl", label: "ETL パイプライン" },
  { to: "/lake", label: "DataLake" },
  { to: "/analytics", label: "分析" },
  { to: "/ai", label: "AI モデル" },
  { to: "/iot", label: "IoT" },
  { to: "/twin", label: "デジタルツイン" },
  { to: "/search", label: "横断検索" }
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
        <h1 className="text-lg font-bold mb-1">CDX Data Lake</h1>
        <p className="text-[10px] text-slate-400 mb-3">Digital Twin Platform</p>
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
      <main className="flex-1 p-6 overflow-auto">
        <RequireAuth>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sources" element={<DataSourcesPage />} />
            <Route path="/etl" element={<EtlPipelinesPage />} />
            <Route path="/lake" element={<LakeBrowserPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai" element={<AiModelsPage />} />
            <Route path="/iot" element={<IotPage />} />
            <Route path="/twin" element={<DigitalTwinPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </RequireAuth>
      </main>
    </div>
  );
}

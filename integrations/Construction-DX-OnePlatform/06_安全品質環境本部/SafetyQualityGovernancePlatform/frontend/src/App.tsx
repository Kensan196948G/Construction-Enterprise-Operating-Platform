import { Link, Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import NearMissPage from "./pages/NearMissPage";
import KyActivityPage from "./pages/KyActivityPage";
import AccidentPage from "./pages/AccidentPage";
import PatrolPage from "./pages/PatrolPage";
import QualityPage from "./pages/QualityPage";
import NonconformityPage from "./pages/NonconformityPage";
import IsoAuditPage from "./pages/IsoAuditPage";
import EnvironmentPage from "./pages/EnvironmentPage";
import AiRiskPage from "./pages/AiRiskPage";
import PhotoCapturePage from "./pages/PhotoCapturePage";
import MobileBottomNav from "./components/MobileBottomNav";

const nav = [
  { to: "/", label: "ダッシュボード" },
  { to: "/near-miss", label: "ヒヤリハット" },
  { to: "/ky", label: "KY活動" },
  { to: "/accident", label: "労災" },
  { to: "/patrol", label: "パトロール" },
  { to: "/quality", label: "品質" },
  { to: "/nonconformity", label: "不適合/CAPA" },
  { to: "/iso", label: "ISO監査" },
  { to: "/environment", label: "環境" },
  { to: "/ai", label: "AI危険予測" },
  { to: "/photo", label: "写真撮影" },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-cdx-quality text-white p-3 flex items-center gap-3 shadow">
        <h1 className="font-bold text-lg">安全品質ガバナンス</h1>
        <span className="text-xs opacity-80 hidden sm:inline">ISO 9001/14001/45001 準拠</span>
      </header>
      <nav
        aria-label="メインナビゲーション"
        className="hidden md:flex bg-white border-b overflow-x-auto whitespace-nowrap px-2 py-2 gap-2"
      >
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-cdx-quality hover:text-white touch-manipulation min-h-tap"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-3 md:p-6 max-w-screen-xl w-full mx-auto pb-20 md:pb-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/near-miss" element={<NearMissPage />} />
          <Route path="/ky" element={<KyActivityPage />} />
          <Route path="/accident" element={<AccidentPage />} />
          <Route path="/patrol" element={<PatrolPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/nonconformity" element={<NonconformityPage />} />
          <Route path="/iso" element={<IsoAuditPage />} />
          <Route path="/environment" element={<EnvironmentPage />} />
          <Route path="/ai" element={<AiRiskPage />} />
          <Route path="/photo" element={<PhotoCapturePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <MobileBottomNav />
    </div>
  );
}

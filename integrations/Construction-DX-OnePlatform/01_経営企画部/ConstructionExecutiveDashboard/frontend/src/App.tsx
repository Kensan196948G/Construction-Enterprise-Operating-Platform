import { Link, Route, Routes, Navigate } from 'react-router-dom';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import KpiAnalysisPage from './pages/KpiAnalysisPage';
import ForecastPage from './pages/ForecastPage';
import AlertsPage from './pages/AlertsPage';
import BcpPage from './pages/BcpPage';
import EsgPage from './pages/EsgPage';
import BoardReportPage from './pages/BoardReportPage';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: '経営ダッシュボード' },
  { to: '/kpi', label: 'KPI 分析' },
  { to: '/forecast', label: 'AI 予測' },
  { to: '/alerts', label: '経営アラート' },
  { to: '/bcp', label: 'BCP' },
  { to: '/esg', label: 'ESG / SDGs' },
  { to: '/board-report', label: '取締役会報告' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-exec-primary text-white px-4 py-3 flex items-center gap-4 shadow">
        <h1 className="text-lg font-bold">Construction Executive Dashboard</h1>
        <nav className="flex flex-wrap gap-3 text-sm">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="hover:underline">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ExecutiveDashboardPage />} />
          <Route path="/kpi" element={<KpiAnalysisPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/bcp" element={<BcpPage />} />
          <Route path="/esg" element={<EsgPage />} />
          <Route path="/board-report" element={<BoardReportPage />} />
        </Routes>
      </main>
      <footer className="border-t bg-white text-xs text-slate-500 px-4 py-2">
        Construction DX One Platform — 経営企画部
      </footer>
    </div>
  );
}

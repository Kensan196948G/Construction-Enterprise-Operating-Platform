import { Link, Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import KnowledgePage from './pages/KnowledgePage';
import KnowledgeDetailPage from './pages/KnowledgeDetailPage';
import BimViewerPage from './pages/BimViewerPage';
import CimViewerPage from './pages/CimViewerPage';
import DrawingsPage from './pages/DrawingsPage';
import SpecsPage from './pages/SpecsPage';
import InquiriesPage from './pages/InquiriesPage';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/knowledge', label: 'ナレッジ' },
  { to: '/bim', label: 'BIM' },
  { to: '/cim', label: 'CIM/点群' },
  { to: '/drawings', label: '標準図' },
  { to: '/specs', label: '仕様書' },
  { to: '/inquiries', label: '技術問合せ' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-tech-primary text-white px-4 py-3 flex items-center gap-4 shadow">
        <h1 className="text-lg font-bold">技術ナレッジ・BIM 基盤</h1>
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/knowledge/:articleId" element={<KnowledgeDetailPage />} />
          <Route path="/bim" element={<BimViewerPage />} />
          <Route path="/bim/:modelId" element={<BimViewerPage />} />
          <Route path="/cim" element={<CimViewerPage />} />
          <Route path="/drawings" element={<DrawingsPage />} />
          <Route path="/specs" element={<SpecsPage />} />
          <Route path="/inquiries" element={<InquiriesPage />} />
        </Routes>
      </main>
    </div>
  );
}

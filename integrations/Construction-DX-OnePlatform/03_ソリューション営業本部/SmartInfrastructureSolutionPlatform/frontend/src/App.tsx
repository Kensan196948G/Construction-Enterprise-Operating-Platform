import { Link, Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import ProposalsPage from './pages/ProposalsPage';
import ProposalEditorPage from './pages/ProposalEditorPage';
import FeasibilityPage from './pages/FeasibilityPage';
import AssetsPage from './pages/AssetsPage';
import PartnersPage from './pages/PartnersPage';
import CasesPage from './pages/CasesPage';
import PfiEvaluatorPage from './pages/PfiEvaluatorPage';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/catalog', label: 'ソリューション' },
  { to: '/proposals', label: '提案案件' },
  { to: '/feasibility', label: 'F/S' },
  { to: '/assets', label: 'インフラ資産' },
  { to: '/partners', label: 'パートナー' },
  { to: '/cases', label: '事例集' },
  { to: '/pfi', label: 'PFI評価' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-sol-primary text-white px-4 py-3 flex flex-wrap items-center gap-4 shadow">
        <h1 className="text-lg font-bold">Smart Infrastructure Solution</h1>
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
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/proposals" element={<ProposalsPage />} />
          <Route path="/proposals/new" element={<ProposalEditorPage />} />
          <Route path="/proposals/:id" element={<ProposalEditorPage />} />
          <Route path="/feasibility" element={<FeasibilityPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/pfi" element={<PfiEvaluatorPage />} />
        </Routes>
      </main>
    </div>
  );
}

import { Link, Route, Routes, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import BidsPage from './pages/BidsPage';
import BidDetailPage from './pages/BidDetailPage';
import QuotationsPage from './pages/QuotationsPage';
import QuotationEditorPage from './pages/QuotationEditorPage';
import ContractsPage from './pages/ContractsPage';
import ActivitiesPage from './pages/ActivitiesPage';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/clients', label: '顧客' },
  { to: '/opportunities', label: '案件パイプライン' },
  { to: '/bids', label: '入札' },
  { to: '/quotations', label: '見積' },
  { to: '/contracts', label: '契約' },
  { to: '/activities', label: '営業活動' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-crm-primary text-white px-4 py-3 flex items-center gap-4 shadow">
        <h1 className="text-lg font-bold">建設CRM・入札管理</h1>
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
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/bids" element={<BidsPage />} />
          <Route path="/bids/:id" element={<BidDetailPage />} />
          <Route path="/quotations" element={<QuotationsPage />} />
          <Route path="/quotations/:id" element={<QuotationEditorPage />} />
          <Route path="/quotations/new" element={<QuotationEditorPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
        </Routes>
      </main>
    </div>
  );
}

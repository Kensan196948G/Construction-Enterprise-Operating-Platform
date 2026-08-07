import { Link, Route, Routes, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import RequestsPage from './pages/RequestsPage';
import OrdersPage from './pages/OrdersPage';
import OrderEditorPage from './pages/OrderEditorPage';
import DeliveriesPage from './pages/DeliveriesPage';
import InventoryPage from './pages/InventoryPage';
import PricesPage from './pages/PricesPage';
import ApprovalsPage from './pages/ApprovalsPage';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/suppliers', label: '協力会社' },
  { to: '/requests', label: '購買依頼' },
  { to: '/approvals', label: '承認' },
  { to: '/orders', label: '発注' },
  { to: '/deliveries', label: '納品検収' },
  { to: '/inventory', label: '在庫' },
  { to: '/prices', label: '価格' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-proc-primary text-white px-4 py-3 flex items-center gap-4 shadow">
        <h1 className="text-lg font-bold">購買・調達プラットフォーム</h1>
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
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/new" element={<OrderEditorPage />} />
          <Route path="/orders/:id" element={<OrderEditorPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/prices" element={<PricesPage />} />
        </Routes>
      </main>
    </div>
  );
}

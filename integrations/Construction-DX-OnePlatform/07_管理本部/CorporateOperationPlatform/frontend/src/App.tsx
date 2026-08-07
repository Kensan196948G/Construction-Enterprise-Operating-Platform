import { Link, Navigate, Route, Routes } from "react-router-dom";
import ArchivesPage from "./pages/ArchivesPage";
import ContractsPage from "./pages/ContractsPage";
import CostAnalysisPage from "./pages/CostAnalysisPage";
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import JournalPage from "./pages/JournalPage";
import LegalPage from "./pages/LegalPage";
import PayablesPage from "./pages/PayablesPage";
import ReceivablesPage from "./pages/ReceivablesPage";
import TrialBalancePage from "./pages/TrialBalancePage";

const nav = [
  { to: "/", label: "ダッシュボード" },
  { to: "/journal", label: "仕訳" },
  { to: "/trial-balance", label: "試算表" },
  { to: "/costs", label: "原価/EVM" },
  { to: "/invoices", label: "請求書" },
  { to: "/payables", label: "買掛" },
  { to: "/receivables", label: "売掛/督促" },
  { to: "/contracts", label: "契約" },
  { to: "/legal", label: "法務" },
  { to: "/archives", label: "電帳法" },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-cdx-corp text-white p-3 flex items-center gap-3 shadow">
        <h1 className="font-bold text-lg">Corporate Operation Platform</h1>
        <span className="text-xs opacity-80 hidden sm:inline">
          電帳法 / インボイス / 建設業法 準拠
        </span>
      </header>
      <nav
        aria-label="メインナビゲーション"
        className="bg-white border-b overflow-x-auto whitespace-nowrap px-2 py-2 flex gap-2"
      >
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-cdx-corp hover:text-white min-h-tap"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-3 md:p-6 max-w-screen-xl w-full mx-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/trial-balance" element={<TrialBalancePage />} />
          <Route path="/costs" element={<CostAnalysisPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/payables" element={<PayablesPage />} />
          <Route path="/receivables" element={<ReceivablesPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/archives" element={<ArchivesPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

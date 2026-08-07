import { Link, Route, Routes, Navigate } from 'react-router-dom';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import DashboardPage from './pages/DashboardPage';
import ScheduleGanttPage from './pages/ScheduleGanttPage';
import ProgressEntryPage from './pages/ProgressEntryPage';
import CostAnalysisPage from './pages/CostAnalysisPage';
import DailyReportPage from './pages/DailyReportPage';
import PhotoCapturePage from './pages/PhotoCapturePage';
import BlackboardPage from './pages/BlackboardPage';
import AttendanceScannerPage from './pages/AttendanceScannerPage';
import EquipmentPage from './pages/EquipmentPage';
import MapPage from './pages/MapPage';
import SyncStatusPage from './pages/SyncStatusPage';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: 'ダッシュボード' },
  { to: '/schedule', label: '工程' },
  { to: '/progress', label: '出来高' },
  { to: '/cost', label: '原価' },
  { to: '/daily-report', label: '作業日報' },
  { to: '/photo', label: '写真' },
  { to: '/blackboard', label: '電子黒板' },
  { to: '/attendance', label: '入退場' },
  { to: '/equipment', label: '重機' },
  { to: '/map', label: '地図' },
  { to: '/sync', label: '同期' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-site-primary text-white px-4 py-3 flex items-center gap-4 shadow">
        <h1 className="text-lg font-bold">施工管理</h1>
        <nav className="flex flex-wrap gap-3 text-sm">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="hover:underline">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <OfflineSyncBanner />
      <main className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/schedule" element={<ScheduleGanttPage />} />
          <Route path="/progress" element={<ProgressEntryPage />} />
          <Route path="/cost" element={<CostAnalysisPage />} />
          <Route path="/daily-report" element={<DailyReportPage />} />
          <Route path="/photo" element={<PhotoCapturePage />} />
          <Route path="/blackboard" element={<BlackboardPage />} />
          <Route path="/attendance" element={<AttendanceScannerPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/sync" element={<SyncStatusPage />} />
        </Routes>
      </main>
    </div>
  );
}

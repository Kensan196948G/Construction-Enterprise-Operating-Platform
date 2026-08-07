import { Link, Navigate, Route, Routes } from 'react-router-dom';
import FleetDashboardPage from './pages/FleetDashboardPage';
import VesselsPage from './pages/VesselsPage';
import VesselDetailPage from './pages/VesselDetailPage';
import VoyagesPage from './pages/VoyagesPage';
import FleetMapPage from './pages/FleetMapPage';
import FuelPage from './pages/FuelPage';
import CrewPage from './pages/CrewPage';
import WeatherPage from './pages/WeatherPage';
import PortCallsPage from './pages/PortCallsPage';
import MarineGanttPage from './pages/MarineGanttPage';

const NAV: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: '船隊ダッシュボード' },
  { to: '/vessels', label: '船舶' },
  { to: '/voyages', label: '運航計画' },
  { to: '/map', label: '海図' },
  { to: '/fuel', label: '燃料' },
  { to: '/crew', label: '乗組員' },
  { to: '/weather', label: '海象' },
  { to: '/port-calls', label: '寄港' },
  { to: '/gantt', label: 'ガント' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-marine-primary text-white px-4 py-3 flex items-center gap-4 shadow">
        <h1 className="text-lg font-bold">船舶運航管理プラットフォーム</h1>
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
          <Route path="/dashboard" element={<FleetDashboardPage />} />
          <Route path="/vessels" element={<VesselsPage />} />
          <Route path="/vessels/:id" element={<VesselDetailPage />} />
          <Route path="/voyages" element={<VoyagesPage />} />
          <Route path="/map" element={<FleetMapPage />} />
          <Route path="/fuel" element={<FuelPage />} />
          <Route path="/crew" element={<CrewPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/port-calls" element={<PortCallsPage />} />
          <Route path="/gantt" element={<MarineGanttPage />} />
        </Routes>
      </main>
    </div>
  );
}

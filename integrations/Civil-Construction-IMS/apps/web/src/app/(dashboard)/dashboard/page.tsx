import type { Metadata } from 'next';
import { DashboardKpiSection } from './kpi-cards';

export const metadata: Metadata = {
  title: 'ダッシュボード',
};

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 統合マネジメントダッシュボード</h1>
        <p className="text-gray-500 mt-1">ISO 9001 / 14001 / 45001 / 55001 / 19650 統合状況</p>
      </div>

      <DashboardKpiSection />
    </div>
  );
}

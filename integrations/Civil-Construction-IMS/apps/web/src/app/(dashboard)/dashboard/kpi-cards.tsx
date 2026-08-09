'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface DashboardKpi {
  corrective_actions: { open: number; in_progress: number; closed_this_month: number };
  workflows: { pending_approval: number; in_progress: number };
  audits: { scheduled: number; in_progress: number };
  documents: { total: number; under_review: number; draft: number };
  quality: { open_nonconformities: number; critical_nonconformities: number };
  environment: { significant_aspects: number; legal_non_compliant: number };
  projects: { active: number };
}

function StatusBadge({ value, warn }: { value: number; warn: boolean }) {
  if (warn && value > 0) {
    return (
      <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
        要対応
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
      正常
    </span>
  );
}

function KpiCard({
  icon,
  title,
  value,
  warn,
}: {
  icon: string;
  title: string;
  value: number;
  warn: boolean;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <StatusBadge value={value} warn={warn} />
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
}

function IsoModuleCard({
  standard,
  name,
  icon,
  metrics,
}: {
  standard: string;
  name: string;
  icon: string;
  metrics: Array<{ label: string; value: string | number; alert: boolean }>;
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-xs text-gray-500">{standard}</p>
        </div>
      </div>
      <div className="space-y-2">
        {metrics.map((m) => (
          <div key={m.label} className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{m.label}</span>
            <span className={`font-medium ${m.alert ? 'text-red-600' : 'text-gray-900'}`}>
              {typeof m.value === 'number' ? `${m.value}件` : m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardKpiSection() {
  const [kpi, setKpi] = useState<DashboardKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<DashboardKpi>('/dashboard/kpi')
      .then(setKpi)
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : '読み込みに失敗しました';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !kpi) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
        ⚠️ KPI データの読み込みに失敗しました。{error}
      </div>
    );
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon="⚠️"
          title="未処置の是正処置"
          value={kpi.corrective_actions.open}
          warn={kpi.corrective_actions.open > 0}
        />
        <KpiCard
          icon="📋"
          title="承認待ちワークフロー"
          value={kpi.workflows.pending_approval}
          warn={kpi.workflows.pending_approval > 5}
        />
        <KpiCard
          icon="🔍"
          title="予定監査"
          value={kpi.audits.scheduled}
          warn={false}
        />
        <KpiCard
          icon="📄"
          title="審査中文書"
          value={kpi.documents.under_review}
          warn={false}
        />
      </div>

      {/* ISO Module Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IsoModuleCard
          standard="ISO 9001"
          name="品質マネジメント"
          icon="✅"
          metrics={[
            { label: '未処置の不適合', value: kpi.quality.open_nonconformities, alert: kpi.quality.open_nonconformities > 0 },
            { label: 'クリティカル不適合', value: kpi.quality.critical_nonconformities, alert: kpi.quality.critical_nonconformities > 0 },
            { label: '審査中文書', value: kpi.documents.under_review, alert: false },
          ]}
        />
        <IsoModuleCard
          standard="ISO 14001"
          name="環境マネジメント"
          icon="🌿"
          metrics={[
            { label: '重要環境側面 (MAJOR)', value: kpi.environment.significant_aspects, alert: false },
            { label: '法令非適合', value: kpi.environment.legal_non_compliant, alert: kpi.environment.legal_non_compliant > 0 },
          ]}
        />
        <IsoModuleCard
          standard="ワークフロー"
          name="承認フロー状況"
          icon="🔄"
          metrics={[
            { label: '承認待ち', value: kpi.workflows.pending_approval, alert: kpi.workflows.pending_approval > 5 },
            { label: '処理中', value: kpi.workflows.in_progress, alert: false },
          ]}
        />
        <IsoModuleCard
          standard="是正処置"
          name="CAR 管理"
          icon="🔧"
          metrics={[
            { label: 'オープン', value: kpi.corrective_actions.open, alert: kpi.corrective_actions.open > 0 },
            { label: '対応中', value: kpi.corrective_actions.in_progress, alert: false },
            { label: '今月完了', value: kpi.corrective_actions.closed_this_month, alert: false },
          ]}
        />
      </div>

      {/* Summary Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-gray-500">アクティブプロジェクト</span>
            <span className="ml-2 font-semibold text-gray-900">{kpi.projects.active}件</span>
          </div>
          <div>
            <span className="text-gray-500">文書総数</span>
            <span className="ml-2 font-semibold text-gray-900">{kpi.documents.total}件</span>
          </div>
          <div>
            <span className="text-gray-500">監査実施中</span>
            <span className="ml-2 font-semibold text-gray-900">{kpi.audits.in_progress}件</span>
          </div>
          <div>
            <span className="text-gray-500">ドラフト文書</span>
            <span className="ml-2 font-semibold text-gray-900">{kpi.documents.draft}件</span>
          </div>
        </div>
      </div>
    </>
  );
}

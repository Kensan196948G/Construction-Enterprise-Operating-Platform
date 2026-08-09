'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';

interface IsoComplianceStatus {
  iso9001: { name: string; score: number; open_nonconformities: number };
  iso14001: { name: string; score: number; non_compliant_legal: number };
  iso45001: { name: string; score: number; open_incidents: number };
  iso55001: { name: string; score: number; poor_condition_assets: number };
  iso19650: { name: string; score: number; wip_containers: number };
}

interface SafetyKpi {
  near_misses: { ytd: number; open: number };
  incidents: { ytd: number; with_lost_days: number };
  education: { sessions_ytd: number };
}

interface QualityKpi {
  nonconformities: { open: number; critical: number };
  documents: { under_review: number; published: number };
  audits: { in_progress: number };
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-green-100 text-green-800' : score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${color}`}>
      {score}点
    </span>
  );
}

function ProgressBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: compliance, isLoading: compLoading, error: compError } = useQuery({
    queryKey: ['analytics', 'iso-compliance'],
    queryFn: () => apiClient.get<IsoComplianceStatus>('/analytics/iso-compliance'),
  });

  const { data: safetyKpi, isLoading: safetyLoading } = useQuery({
    queryKey: ['analytics', 'safety-kpi'],
    queryFn: () => apiClient.get<SafetyKpi>('/analytics/safety-kpi'),
  });

  const { data: qualityKpi, isLoading: qualityLoading } = useQuery({
    queryKey: ['analytics', 'quality-kpi'],
    queryFn: () => apiClient.get<QualityKpi>('/analytics/quality-kpi'),
  });

  const isoStandards = compliance
    ? [
        { key: 'iso9001', ...compliance.iso9001, icon: '✅', sub: `不適合 ${compliance.iso9001.open_nonconformities}件` },
        { key: 'iso14001', ...compliance.iso14001, icon: '🌿', sub: `非適合法令 ${compliance.iso14001.non_compliant_legal}件` },
        { key: 'iso45001', ...compliance.iso45001, icon: '⛑️', sub: `未処置事故 ${compliance.iso45001.open_incidents}件` },
        { key: 'iso55001', ...compliance.iso55001, icon: '🏛️', sub: `劣化資産 ${compliance.iso55001.poor_condition_assets}件` },
        { key: 'iso19650', ...compliance.iso19650, icon: '🏗️', sub: `WIP コンテナ ${compliance.iso19650.wip_containers}件` },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 ISO 適合分析ダッシュボード</h1>
          <p className="text-gray-500 text-sm mt-0.5">全 ISO モジュールの KPI を横断的に確認</p>
        </div>
      </div>

      {/* ISO Compliance Scores */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-600" /> ISO 適合スコア
        </h2>
        {compLoading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
            ))}
          </div>
        )}
        {compError && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ データの読み込みに失敗しました
          </div>
        )}
        {!compLoading && compliance && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {isoStandards.map((std) => (
              <Card key={std.key} className="border-gray-200">
                <CardHeader className="pb-1 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{std.icon}</span>
                    <ScoreBadge score={std.score} />
                  </div>
                  <CardTitle className="text-sm font-semibold mt-1">{std.name}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ProgressBar score={std.score} />
                  <p className="text-xs text-gray-500 mt-1.5">{std.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safety KPI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> 安全衛生 KPI (ISO 45001)
            </CardTitle>
            <CardDescription>年累計の安全衛生指標</CardDescription>
          </CardHeader>
          <CardContent>
            {safetyLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />)}
              </div>
            ) : safetyKpi ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ヒヤリハット（年累計）</span>
                  <Badge className="bg-blue-100 text-blue-800">{safetyKpi.near_misses.ytd}件</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ヒヤリハット（未処置）</span>
                  <Badge className={safetyKpi.near_misses.open > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {safetyKpi.near_misses.open}件
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">事故発生（年累計）</span>
                  <Badge className="bg-orange-100 text-orange-800">{safetyKpi.incidents.ytd}件</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">休業災害</span>
                  <Badge className={safetyKpi.incidents.with_lost_days > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {safetyKpi.incidents.with_lost_days}件
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">安全教育（年累計）</span>
                  <Badge className="bg-purple-100 text-purple-800">{safetyKpi.education.sessions_ytd}回</Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Quality KPI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-blue-500" /> 品質管理 KPI (ISO 9001)
            </CardTitle>
            <CardDescription>品質マネジメント指標</CardDescription>
          </CardHeader>
          <CardContent>
            {qualityLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />)}
              </div>
            ) : qualityKpi ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">未処置の不適合</span>
                  <Badge className={qualityKpi.nonconformities.open > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {qualityKpi.nonconformities.open}件
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">重大不適合</span>
                  <Badge className={qualityKpi.nonconformities.critical > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {qualityKpi.nonconformities.critical}件
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">審査中文書</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{qualityKpi.documents.under_review}件</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">発行済み文書</span>
                  <Badge className="bg-blue-100 text-blue-800">{qualityKpi.documents.published}件</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">実施中の監査</span>
                  <Badge className="bg-purple-100 text-purple-800">{qualityKpi.audits.in_progress}件</Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

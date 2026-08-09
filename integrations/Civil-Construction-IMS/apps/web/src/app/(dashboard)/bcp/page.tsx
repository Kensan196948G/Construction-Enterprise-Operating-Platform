'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, AlertOctagon, CheckCircle, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

interface BcpPlan {
  id: string;
  planNo: string;
  title: string;
  version: number;
  status: string;
  scope?: string;
  rto?: number;
  rpo?: number;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; cls: string; icon: typeof CheckCircle }> = {
  DRAFT: { label: 'ドラフト', cls: 'bg-gray-100 text-gray-700', icon: FileText },
  UNDER_REVIEW: { label: '審査中', cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED: { label: '承認済', cls: 'bg-green-100 text-green-800', icon: CheckCircle },
  PUBLISHED: { label: '発行済', cls: 'bg-blue-100 text-blue-700', icon: Shield },
};

function StatusBadge({ value }: { value: string }) {
  const conf = statusConfig[value] ?? { label: value, cls: 'bg-gray-100 text-gray-700', icon: FileText };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${conf.cls}`}>
      {value}
    </span>
  );
}

function RtoRpo({ hours }: { hours?: number }) {
  if (hours == null) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <span className="text-sm font-medium">
      {hours}h
    </span>
  );
}

export default function BcpPage() {
  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['bcp', 'plans'],
    queryFn: () => apiClient.get<{ items: BcpPlan[]; total: number }>('/bcp/plans'),
  });

  const plans = plansData?.items ?? [];
  const approvedCount = plans.filter((p) => p.status === 'APPROVED' || p.status === 'PUBLISHED').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-red-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛡️ BCP 事業継続計画</h1>
          <p className="text-gray-500 text-sm mt-0.5">Business Continuity Planning — リスクシナリオ・訓練記録管理</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-gray-900">{plans.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">BCP 計画書 総数</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-green-700">{approvedCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">承認済み計画</div>
          </CardContent>
        </Card>
        <Card className={`border-gray-200 ${plans.length - approvedCount > 0 ? 'border-yellow-300' : ''}`}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-yellow-700">{plans.length - approvedCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">未承認計画</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-blue-700">
              {approvedCount > 0 ? Math.round((approvedCount / Math.max(plans.length, 1)) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-0.5">承認率</div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> BCP 計画書一覧
          </CardTitle>
          <CardDescription>
            RTO = 目標復旧時間 / RPO = 目標復旧時点（単位: 時間）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : plansError ? (
            <div className="text-center py-8 text-yellow-700 bg-yellow-50 rounded-lg">
              <AlertOctagon className="h-8 w-8 mx-auto mb-2 opacity-60" />
              <p className="text-sm">データの読み込みに失敗しました</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>BCP 計画書がありません</p>
              <p className="text-xs mt-1">API から計画書を登録してください</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>計画番号</TableHead>
                  <TableHead>タイトル</TableHead>
                  <TableHead>バージョン</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-center">RTO</TableHead>
                  <TableHead className="text-center">RPO</TableHead>
                  <TableHead>承認日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-sm">{plan.planNo}</TableCell>
                    <TableCell className="font-medium">{plan.title}</TableCell>
                    <TableCell className="text-sm text-gray-500">v{plan.version}</TableCell>
                    <TableCell><StatusBadge value={plan.status} /></TableCell>
                    <TableCell className="text-center"><RtoRpo hours={plan.rto} /></TableCell>
                    <TableCell className="text-center"><RtoRpo hours={plan.rpo} /></TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {plan.approvedAt ? formatDate(plan.approvedAt) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

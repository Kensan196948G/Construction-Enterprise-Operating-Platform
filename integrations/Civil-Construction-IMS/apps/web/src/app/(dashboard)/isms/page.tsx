'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, ShieldAlert, Database, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

interface IsmsAsset {
  id: string;
  assetNo: string;
  name: string;
  assetType: string;
  classification: string;
  sensitivity: string;
  owner?: string;
  location?: string;
}

interface IsmsIncident {
  id: string;
  incidentNo: string;
  incidentType: string;
  occurredAt: string;
  description: string;
  severity: string;
  status: string;
  affectedSystems?: string;
}

type Tab = 'assets' | 'incidents';

const classificationConfig: Record<string, { label: string; cls: string }> = {
  public: { label: '公開', cls: 'bg-gray-100 text-gray-700' },
  internal: { label: '社内', cls: 'bg-blue-100 text-blue-700' },
  confidential: { label: '機密', cls: 'bg-orange-100 text-orange-700' },
  'strictly-confidential': { label: '極秘', cls: 'bg-red-100 text-red-800' },
};

const severityConfig: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: '重大', cls: 'bg-red-100 text-red-800' },
  HIGH: { label: '高', cls: 'bg-orange-100 text-orange-700' },
  MEDIUM: { label: '中', cls: 'bg-yellow-100 text-yellow-700' },
  LOW: { label: '低', cls: 'bg-green-100 text-green-700' },
  NEGLIGIBLE: { label: '軽微', cls: 'bg-gray-100 text-gray-600' },
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'オープン', cls: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { label: '対応中', cls: 'bg-yellow-100 text-yellow-700' },
  CLOSED: { label: 'クローズ', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'キャンセル', cls: 'bg-gray-100 text-gray-600' },
};

function ClassificationBadge({ value }: { value: string }) {
  const conf = classificationConfig[value] ?? { label: value, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${conf.cls}`}>{conf.label}</span>;
}

function SeverityBadge({ value }: { value: string }) {
  const conf = severityConfig[value] ?? { label: value, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${conf.cls}`}>{conf.label}</span>;
}

function StatusBadge({ value }: { value: string }) {
  const conf = statusConfig[value] ?? { label: value, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${conf.cls}`}>{conf.label}</span>;
}

export default function IsmsPage() {
  const [tab, setTab] = useState<Tab>('assets');

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['isms', 'assets'],
    queryFn: () => apiClient.get<{ items: IsmsAsset[]; total: number }>('/isms/assets'),
    enabled: tab === 'assets',
  });

  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ['isms', 'incidents'],
    queryFn: () => apiClient.get<{ items: IsmsIncident[]; total: number }>('/isms/incidents'),
    enabled: tab === 'incidents',
  });

  const assets = assetsData?.items ?? [];
  const incidents = incidentsData?.items ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Lock className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔐 ISMS 情報セキュリティ管理</h1>
          <p className="text-gray-500 text-sm mt-0.5">ISO/IEC 27001 準拠 — 情報資産台帳・セキュリティインシデント</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('assets')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'assets' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Database className="inline h-4 w-4 mr-1.5" />情報資産台帳
        </button>
        <button
          onClick={() => setTab('incidents')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'incidents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <ShieldAlert className="inline h-4 w-4 mr-1.5" />インシデント
        </button>
      </div>

      {/* Assets Tab */}
      {tab === 'assets' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">情報資産台帳</CardTitle>
            <CardDescription>CIA（機密性・完全性・可用性）分類に基づく情報資産の一覧</CardDescription>
          </CardHeader>
          <CardContent>
            {assetsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>情報資産が登録されていません</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>資産番号</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>機密区分</TableHead>
                    <TableHead>感度</TableHead>
                    <TableHead>オーナー</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-mono text-sm">{asset.assetNo}</TableCell>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{asset.assetType}</TableCell>
                      <TableCell><ClassificationBadge value={asset.classification} /></TableCell>
                      <TableCell><SeverityBadge value={asset.sensitivity} /></TableCell>
                      <TableCell className="text-sm text-gray-500">{asset.owner ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Incidents Tab */}
      {tab === 'incidents' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">セキュリティインシデント</CardTitle>
            <CardDescription>情報セキュリティインシデントの記録・管理</CardDescription>
          </CardHeader>
          <CardContent>
            {incidentsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />)}
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>インシデントが登録されていません</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>番号</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>発生日時</TableHead>
                    <TableHead>概要</TableHead>
                    <TableHead>重大度</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell className="font-mono text-sm">{inc.incidentNo}</TableCell>
                      <TableCell className="text-sm">{inc.incidentType}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(inc.occurredAt)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{inc.description}</TableCell>
                      <TableCell><SeverityBadge value={inc.severity} /></TableCell>
                      <TableCell><StatusBadge value={inc.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

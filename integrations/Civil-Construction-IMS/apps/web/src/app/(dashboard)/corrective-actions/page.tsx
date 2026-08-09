'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, AlertTriangle, CheckCircle2, Clock, XCircle, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

type CorrectiveActionStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'CLOSED' | 'CANCELLED';
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface CorrectiveAction {
  id: string;
  caNo: string;
  sourceType: string;
  title: string;
  description: string;
  isoStandard?: string;
  severity: Severity;
  status: CorrectiveActionStatus;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  dueDate?: string;
  closedAt?: string;
  createdAt: string;
}

interface CorrectiveActionsResponse {
  items: CorrectiveAction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FormState {
  caNo: string;
  sourceType: string;
  title: string;
  description: string;
  isoStandard: string;
  severity: Severity;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  dueDate: string;
}

const EMPTY_FORM: FormState = {
  caNo: '',
  sourceType: 'nonconformity',
  title: '',
  description: '',
  isoStandard: '9001',
  severity: 'MEDIUM',
  rootCause: '',
  correctiveAction: '',
  preventiveAction: '',
  dueDate: '',
};

const STATUS_CONFIG: Record<CorrectiveActionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN: { label: '未処置', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3.5 w-3.5" /> },
  IN_PROGRESS: { label: '対応中', color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3.5 w-3.5" /> },
  PENDING_VERIFICATION: { label: '確認待ち', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  CLOSED: { label: '完了', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  CANCELLED: { label: 'キャンセル', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="h-3.5 w-3.5" /> },
};

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string }> = {
  CRITICAL: { label: '重大', color: 'bg-red-100 text-red-800' },
  HIGH: { label: '高', color: 'bg-orange-100 text-orange-800' },
  MEDIUM: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
  LOW: { label: '低', color: 'bg-gray-100 text-gray-600' },
};

const SOURCE_TYPE_OPTIONS = [
  { value: 'nonconformity', label: '不適合' },
  { value: 'complaint', label: 'クレーム' },
  { value: 'audit_finding', label: '監査所見' },
  { value: 'near_miss', label: 'ヒヤリハット' },
];

const ISO_STANDARD_OPTIONS = ['9001', '14001', '45001', '55001', '19650'];

function StatusBadge({ status }: { status: CorrectiveActionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function SummaryCard({
  title,
  count,
  color,
  icon,
}: {
  title: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-0.5">{count}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </CardContent>
    </Card>
  );
}

export default function CorrectiveActionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<CorrectiveActionStatus | ''>('');
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CorrectiveAction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CorrectiveAction | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['corrective-actions', statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      return apiClient.get<CorrectiveActionsResponse>(`/corrective-actions?${params}`);
    },
  });

  useEffect(() => {
    if (dialogOpen && editTarget) {
      setForm({
        caNo: editTarget.caNo,
        sourceType: editTarget.sourceType,
        title: editTarget.title,
        description: editTarget.description,
        isoStandard: editTarget.isoStandard ?? '9001',
        severity: editTarget.severity,
        rootCause: editTarget.rootCause ?? '',
        correctiveAction: editTarget.correctiveAction ?? '',
        preventiveAction: editTarget.preventiveAction ?? '',
        dueDate: editTarget.dueDate ? editTarget.dueDate.slice(0, 10) : '',
      });
    } else if (dialogOpen && !editTarget) {
      setForm(EMPTY_FORM);
    }
    setFormError('');
  }, [dialogOpen, editTarget]);

  const createMutation = useMutation({
    mutationFn: (payload: Omit<FormState, 'dueDate'> & { dueDate?: string }) =>
      apiClient.post<CorrectiveAction>('/corrective-actions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corrective-actions'] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<FormState> }) =>
      apiClient.put<CorrectiveAction>(`/corrective-actions/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corrective-actions'] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/corrective-actions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corrective-actions'] });
      setDeleteTarget(null);
    },
  });

  function openCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(item: CorrectiveAction) {
    setEditTarget(item);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.caNo.trim() || !form.title.trim() || !form.description.trim()) {
      setFormError('CA番号・タイトル・説明は必須です。');
      return;
    }
    setFormError('');
    const payload = {
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const items = data?.items ?? [];
  const openCount = items.filter((i) => i.status === 'OPEN').length;
  const inProgressCount = items.filter((i) => i.status === 'IN_PROGRESS').length;
  const pendingCount = items.filter((i) => i.status === 'PENDING_VERIFICATION').length;
  const closedCount = items.filter((i) => i.status === 'CLOSED').length;
  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">是正処置管理</h1>
            <p className="text-gray-500 text-sm mt-0.5">ISO 9001/14001 是正処置・予防処置（箇条10.2）</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* Summary Cards */}
      {!isLoading && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="未処置" count={openCount} color="border-red-500" icon={<XCircle className="h-8 w-8" />} />
          <SummaryCard title="対応中" count={inProgressCount} color="border-blue-500" icon={<Clock className="h-8 w-8" />} />
          <SummaryCard title="確認待ち" count={pendingCount} color="border-yellow-500" icon={<AlertTriangle className="h-8 w-8" />} />
          <SummaryCard title="完了" count={closedCount} color="border-green-500" icon={<CheckCircle2 className="h-8 w-8" />} />
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">ステータス:</span>
        {(['', 'OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'すべて' : STATUS_CONFIG[s as CorrectiveActionStatus].label}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-sm text-gray-500">全 {data.total} 件</span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div aria-busy="true" className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          データの読み込みに失敗しました。APIサーバーの接続を確認してください。
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">是正処置の記録がありません</p>
            <p className="text-gray-400 text-sm mt-1">
              {statusFilter ? `「${STATUS_CONFIG[statusFilter].label}」の是正処置はありません` : '是正処置を登録してください'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isLoading && items.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">是正処置一覧</CardTitle>
            <CardDescription>ISO 9001 箇条10.2 / ISO 14001 箇条10.2 対応</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">CA番号</th>
                    <th className="px-4 py-3 text-left">タイトル</th>
                    <th className="px-4 py-3 text-left">起票元</th>
                    <th className="px-4 py-3 text-left">ISO規格</th>
                    <th className="px-4 py-3 text-left">重大度</th>
                    <th className="px-4 py-3 text-left">ステータス</th>
                    <th className="px-4 py-3 text-left">期限</th>
                    <th className="px-4 py-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{item.caNo}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_TYPE_OPTIONS.find((o) => o.value === item.sourceType)?.label ?? item.sourceType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {item.isoStandard ? `ISO ${item.isoStandard}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={item.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString('ja-JP') : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(item)}>編集</Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteTarget(item)}>削除</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>前へ</Button>
          <span className="text-sm text-gray-600">{page} / {data.totalPages} ページ</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>次へ</Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? '是正処置を編集' : '是正処置を新規登録'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-caNo">CA番号 *</label>
                <input
                  id="ca-caNo"
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CA-2026-001"
                  value={form.caNo}
                  onChange={(e) => setForm((f) => ({ ...f, caNo: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-sourceType">起票元種別 *</label>
                <select
                  id="ca-sourceType"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.sourceType}
                  onChange={(e) => setForm((f) => ({ ...f, sourceType: e.target.value }))}
                >
                  {SOURCE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-title">タイトル *</label>
              <input
                id="ca-title"
                type="text"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="是正処置のタイトル"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-description">問題の説明 *</label>
              <textarea
                id="ca-description"
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="発生した問題・不適合の説明"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-severity">重大度</label>
                <select
                  id="ca-severity"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Severity }))}
                >
                  {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((s) => (
                    <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-isoStandard">ISO規格</label>
                <select
                  id="ca-isoStandard"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.isoStandard}
                  onChange={(e) => setForm((f) => ({ ...f, isoStandard: e.target.value }))}
                >
                  {ISO_STANDARD_OPTIONS.map((s) => (
                    <option key={s} value={s}>ISO {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-dueDate">完了期限</label>
                <input
                  id="ca-dueDate"
                  type="date"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-rootCause">根本原因分析</label>
              <textarea
                id="ca-rootCause"
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="根本原因を記載してください"
                value={form.rootCause}
                onChange={(e) => setForm((f) => ({ ...f, rootCause: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-correctiveAction">是正処置内容</label>
              <textarea
                id="ca-correctiveAction"
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="講じる是正処置を記載してください"
                value={form.correctiveAction}
                onChange={(e) => setForm((f) => ({ ...f, correctiveAction: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1" htmlFor="ca-preventiveAction">予防処置内容</label>
              <textarea
                id="ca-preventiveAction"
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="再発防止のための予防処置を記載してください"
                value={form.preventiveAction}
                onChange={(e) => setForm((f) => ({ ...f, preventiveAction: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? '保存中...' : editTarget ? '更新' : '登録'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>是正処置を削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            「{deleteTarget?.title}」を削除します。この操作は元に戻せません。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>キャンセル</Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

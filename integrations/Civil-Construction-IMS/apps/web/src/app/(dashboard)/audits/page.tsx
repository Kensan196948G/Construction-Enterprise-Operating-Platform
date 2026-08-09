'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ClipboardCheck,
  Inbox,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClient, ApiError } from '@/lib/api-client';
import { cn, formatDate, getStatusBadgeClass } from '@/lib/utils';

/** Prisma AuditStatus enum */
type AuditStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

/** API: GET /audit/plans のレスポンス要素 */
interface AuditPlan {
  id: string;
  planNo: string;
  title: string;
  isoStandard: string;
  status: AuditStatus;
  scheduledAt: string | null;
  scope?: string | null;
}

/** 状態コードの日本語ラベル */
const STATUS_LABELS: Record<AuditStatus, string> = {
  PLANNED: '計画中',
  IN_PROGRESS: '実施中',
  COMPLETED: '完了',
  CANCELLED: 'キャンセル',
};

const STATUS_OPTIONS: [AuditStatus, string][] = [
  ['PLANNED', '計画中'],
  ['IN_PROGRESS', '実施中'],
  ['COMPLETED', '完了'],
  ['CANCELLED', 'キャンセル'],
];

const ISO_STANDARD_OPTIONS = ['9001', '14001', '45001', '55001', '19650'];

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const TABLE_COLUMN_COUNT = 6;

interface FormState {
  planNo: string;
  title: string;
  isoStandard: string;
  scheduledAt: string;
  status: AuditStatus;
  scope: string;
}

const EMPTY_FORM: FormState = {
  planNo: '',
  title: '',
  isoStandard: '9001',
  scheduledAt: '',
  status: 'PLANNED',
  scope: '',
};

export default function AuditsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AuditPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuditPlan | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: plans,
    isLoading,
    isError,
    error,
  } = useQuery<AuditPlan[]>({
    queryKey: ['audit', 'plans'],
    queryFn: () => apiClient.get<AuditPlan[]>('/audit/plans'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<FormState, 'scope'> & { scope?: string }) =>
      apiClient.post<AuditPlan>('/audit/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', 'plans'] });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.message : '作成に失敗しました。',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<FormState>;
    }) => apiClient.patch<AuditPlan>(`/audit/plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', 'plans'] });
      setDialogOpen(false);
      setEditTarget(null);
      setForm(EMPTY_FORM);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError ? err.message : '更新に失敗しました。',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/audit/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', 'plans'] });
      setDeleteTarget(null);
    },
  });

  useEffect(() => {
    if (editTarget) {
      setForm({
        planNo: editTarget.planNo,
        title: editTarget.title,
        isoStandard: editTarget.isoStandard,
        scheduledAt: editTarget.scheduledAt
          ? editTarget.scheduledAt.slice(0, 10)
          : '',
        status: editTarget.status,
        scope: editTarget.scope ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setFormError(null);
  }, [editTarget, dialogOpen]);

  function handleOpenCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(plan: AuditPlan) {
    setEditTarget(plan);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.planNo.trim() || !form.title.trim() || !form.scheduledAt) {
      setFormError('計画番号・タイトル・予定日は必須です。');
      return;
    }
    const payload = {
      planNo: form.planNo.trim(),
      title: form.title.trim(),
      isoStandard: form.isoStandard,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      status: form.status,
      ...(form.scope.trim() ? { scope: form.scope.trim() } : {}),
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : '監査計画の取得中に予期しないエラーが発生しました。';

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            📋 監査・是正
          </h1>
          <p className="text-sm text-muted-foreground">
            内部監査計画の登録状況と是正処置の進捗を管理します。
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>監査計画一覧</CardTitle>
          <CardDescription>
            ISO 9001 / 14001 / 45001 / 55001 / 19650 に基づく監査計画
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>監査番号</TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead>規格</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>予定日</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COLUMN_COUNT}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    読み込み中...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={TABLE_COLUMN_COUNT} className="h-24">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-6 w-6" />
                      <span>{errorMessage}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !plans || plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={TABLE_COLUMN_COUNT} className="h-24">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Inbox className="h-6 w-6" />
                      <span>監査計画はまだ登録されていません。</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium text-foreground">
                      {plan.planNo}
                    </TableCell>
                    <TableCell>{plan.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.isoStandard}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'border-transparent',
                          getStatusBadgeClass(plan.status),
                        )}
                      >
                        {STATUS_LABELS[plan.status] ?? plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.scheduledAt ? formatDate(plan.scheduledAt) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenEdit(plan)}
                          aria-label="編集"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(plan)}
                          aria-label="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 作成 / 編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? '監査計画を編集' : '監査計画を新規作成'}
            </DialogTitle>
            <DialogDescription>
              ISO 規格に基づく内部監査計画を登録します。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="planNo">計画番号 *</Label>
              <Input
                id="planNo"
                placeholder="AP-2025-001"
                value={form.planNo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, planNo: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                placeholder="2025年度 品質管理システム内部監査"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="isoStandard">適用 ISO 規格 *</Label>
              <select
                id="isoStandard"
                className={SELECT_CLASS}
                value={form.isoStandard}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isoStandard: e.target.value }))
                }
              >
                {ISO_STANDARD_OPTIONS.map((iso) => (
                  <option key={iso} value={iso}>
                    ISO {iso}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="scheduledAt">実施予定日 *</Label>
              <Input
                id="scheduledAt"
                type="date"
                value={form.scheduledAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduledAt: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">ステータス</Label>
              <select
                id="status"
                className={SELECT_CLASS}
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as AuditStatus,
                  }))
                }
              >
                {STATUS_OPTIONS.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="scope">監査スコープ</Label>
              <Input
                id="scope"
                placeholder="品質管理部門、設計部門"
                value={form.scope}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scope: e.target.value }))
                }
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isMutating}
            >
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={isMutating}>
              {isMutating ? '保存中...' : editTarget ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>監査計画を削除しますか？</DialogTitle>
            <DialogDescription>
              「{deleteTarget?.planNo} — {deleteTarget?.title}
              」を削除します。この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

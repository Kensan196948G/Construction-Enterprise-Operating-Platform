'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileCheck2, Pencil, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiClient } from '@/lib/api-client';
import { cn, formatDate, getStatusBadgeClass } from '@/lib/utils';

type QualityPlanStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'CLOSED';

interface QualityPlan {
  id: string;
  planNo: string;
  title: string;
  status: QualityPlanStatus;
  version: number | string;
  projectId?: string;
  updatedAt?: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '下書き',
  IN_PROGRESS: '進行中',
  APPROVED: '承認済',
  PUBLISHED: '公開',
  REJECTED: '差戻し',
  CLOSED: '完了',
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// ----------------------------------------------------------------
// 新規作成ダイアログ
// ----------------------------------------------------------------

interface CreateDialogProps {
  open: boolean;
  projects: Project[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateQualityPlanDialog({ open, projects, onOpenChange, onSuccess }: CreateDialogProps) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setProjectId('');
      setReason('');
      setFormError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post('/quality/plans', { title: title.trim(), projectId, reason: reason.trim() || undefined }),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: ApiError) => {
      setFormError(err.message ?? '作成に失敗しました');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projectId) {
      setFormError('タイトルと対象案件は必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>品質計画 新規作成</DialogTitle>
          <DialogDescription>
            ISO 9001 品質計画書を作成します。計画番号はシステムが自動採番します。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="qp-project">対象案件 *</Label>
            <select
              id="qp-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">案件を選択してください</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qp-title">タイトル *</Label>
            <Input
              id="qp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: コンクリート工事品質計画書"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qp-reason">作成理由（任意）</Label>
            <Textarea
              id="qp-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: 新規橋梁工事に伴い作成"
              rows={2}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={mutation.isPending || !projectId}>
              {mutation.isPending ? '作成中…' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// 編集ダイアログ
// ----------------------------------------------------------------

interface EditDialogProps {
  plan: QualityPlan | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditQualityPlanDialog({ plan, onOpenChange, onSuccess }: EditDialogProps) {
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setReason('');
      setFormError(null);
    }
  }, [plan]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/quality/plans/${plan!.id}`, { title: title.trim(), reason: reason.trim() || undefined }),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: ApiError) => {
      setFormError(err.message ?? '更新に失敗しました');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('タイトルは必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={!!plan} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>品質計画 編集</DialogTitle>
          <DialogDescription>
            {plan?.planNo} の内容を変更します。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="qp-edit-title">タイトル *</Label>
            <Input
              id="qp-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qp-edit-reason">変更理由（任意）</Label>
            <Textarea
              id="qp-edit-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例: タイトル表記を統一"
              rows={2}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '更新中…' : '更新'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// 削除ダイアログ
// ----------------------------------------------------------------

interface DeleteDialogProps {
  plan: QualityPlan | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteQualityPlanDialog({ plan, onOpenChange, onSuccess }: DeleteDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => apiClient.delete(`/quality/plans/${plan!.id}`),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: ApiError) => {
      setFormError(err.message ?? '削除に失敗しました');
    },
  });

  return (
    <Dialog open={!!plan} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>品質計画を削除</DialogTitle>
          <DialogDescription>
            <strong>{plan?.planNo} — {plan?.title}</strong> を削除します。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        {formError && (
          <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? '削除中…' : '削除する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// メインページ
// ----------------------------------------------------------------

export default function QualityPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QualityPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QualityPlan | null>(null);

  const { data: plans, isLoading, isError, error } = useQuery<QualityPlan[], ApiError>({
    queryKey: ['quality', 'plans'],
    queryFn: () => apiClient.get<QualityPlan[]>('/quality/plans'),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient.get<Project[]>('/projects'),
  });

  function invalidatePlans() {
    queryClient.invalidateQueries({ queryKey: ['quality', 'plans'] });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">✅ 品質管理 (ISO 9001)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            品質計画書の作成・承認・版管理を行います。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          新規作成
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>品質計画一覧</CardTitle>
          <CardDescription>登録済みの品質計画書を一覧表示します。</CardDescription>
        </CardHeader>
        <CardContent>
          <QualityPlanTable
            plans={plans}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </CardContent>
      </Card>

      <CreateQualityPlanDialog
        open={createOpen}
        projects={projects}
        onOpenChange={setCreateOpen}
        onSuccess={invalidatePlans}
      />
      <EditQualityPlanDialog
        plan={editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        onSuccess={invalidatePlans}
      />
      <DeleteQualityPlanDialog
        plan={deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onSuccess={invalidatePlans}
      />
    </div>
  );
}

// ----------------------------------------------------------------
// テーブルコンポーネント
// ----------------------------------------------------------------

interface QualityPlanTableProps {
  plans: QualityPlan[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  onEdit: (plan: QualityPlan) => void;
  onDelete: (plan: QualityPlan) => void;
}

function QualityPlanTable({ plans, isLoading, isError, error, onEdit, onDelete }: QualityPlanTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 py-12 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">データの取得に失敗しました</p>
        <p className="text-xs text-muted-foreground">{error?.message ?? '時間をおいて再度お試しください。'}</p>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-12 text-center">
        <FileCheck2 className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">品質計画がまだありません</p>
        <p className="text-xs text-muted-foreground">「新規作成」から最初の品質計画を登録してください。</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">計画番号</TableHead>
          <TableHead>タイトル</TableHead>
          <TableHead className="w-[120px]">状態</TableHead>
          <TableHead className="w-[80px] text-right">版</TableHead>
          <TableHead className="w-[140px]">更新日</TableHead>
          <TableHead className="w-[100px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="font-mono text-sm font-medium">{plan.planNo}</TableCell>
            <TableCell className="font-medium">{plan.title}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn('border-transparent', getStatusBadgeClass(plan.status))}
              >
                {statusLabel(plan.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">v{plan.version}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {plan.updatedAt ? formatDate(plan.updatedAt) : '—'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(plan)}
                  aria-label={`${plan.title}を編集`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(plan)}
                  aria-label={`${plan.title}を削除`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

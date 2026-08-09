'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';

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
import { apiClient, ApiError } from '@/lib/api-client';
import { cn, formatDate, getStatusBadgeClass } from '@/lib/utils';

/**
 * BIM Execution Plan (BEP) — ISO 19650 に基づく情報マネジメント計画。
 * バックエンド `/bim/beps` のレスポンス 1 件分。
 */
interface BimExecutionPlan {
  id: string;
  title: string;
  version: string;
  status: string;
  namingConvention: string;
  projectId: string;
  updatedAt?: string;
}

/** 一覧 API のレスポンス。配列直返し / { data: [...] } どちらも許容する。 */
type BimExecutionPlanListResponse =
  | BimExecutionPlan[]
  | { data: BimExecutionPlan[] };

interface Project {
  id: string;
  name: string;
}

/** 状態ラベル (日本語表示)。未知のキーはそのまま表示する。 */
const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草案',
  IN_PROGRESS: '作成中',
  IN_REVIEW: 'レビュー中',
  APPROVED: '承認済み',
  PUBLISHED: '発行済み',
  REJECTED: '却下',
  ARCHIVED: 'アーカイブ',
};

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

interface FormState {
  projectId: string;
  title: string;
  namingConvention: string;
}

const EMPTY_FORM: FormState = {
  projectId: '',
  title: '',
  namingConvention: '',
};

function normalizePlans(
  response: BimExecutionPlanListResponse,
): BimExecutionPlan[] {
  return Array.isArray(response) ? response : response.data;
}

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export default function BimPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BimExecutionPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BimExecutionPlan | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery<BimExecutionPlan[]>({
    queryKey: ['bim', 'beps'],
    queryFn: async () => {
      const response =
        await apiClient.get<BimExecutionPlanListResponse>('/bim/beps');
      return normalizePlans(response);
    },
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient.get<Project[]>('/projects'),
  });

  const plans = data ?? [];

  const createMutation = useMutation({
    mutationFn: (payload: FormState) =>
      apiClient.post<BimExecutionPlan>('/bim/beps', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim', 'beps'] });
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
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) =>
      apiClient.put<BimExecutionPlan>(`/bim/beps/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim', 'beps'] });
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
    mutationFn: (id: string) => apiClient.delete(`/bim/beps/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bim', 'beps'] });
      setDeleteTarget(null);
    },
  });

  useEffect(() => {
    if (editTarget) {
      setForm({
        projectId: editTarget.projectId,
        title: editTarget.title,
        namingConvention: editTarget.namingConvention ?? '',
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

  function handleOpenEdit(plan: BimExecutionPlan) {
    setEditTarget(plan);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.projectId || !form.title.trim()) {
      setFormError('プロジェクトとタイトルは必須です。');
      return;
    }
    const payload: FormState = {
      projectId: form.projectId,
      title: form.title.trim(),
      namingConvention: form.namingConvention.trim(),
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      {/* ページヘッダー */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            🏗️ BIM情報 (ISO 19650)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            BIM実行計画 (BEP) と情報マネジメント計画を ISO 19650 準拠で管理します。
          </p>
        </div>
        <Button type="button" onClick={handleOpenCreate}>
          <Plus aria-hidden="true" />
          新規作成
        </Button>
      </div>

      {/* 一覧カード */}
      <Card>
        <CardHeader>
          <CardTitle>BIM実行計画 (BEP) 一覧</CardTitle>
          <CardDescription>
            登録済みの BIM 実行計画とそのバージョン・命名規則を表示します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} />
          ) : plans.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>版</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>命名規則</TableHead>
                  <TableHead>更新日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium text-foreground">
                      {plan.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.version}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'border-transparent',
                          getStatusBadgeClass(plan.status),
                        )}
                      >
                        {getStatusLabel(plan.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {plan.namingConvention}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.updatedAt ? formatDate(plan.updatedAt) : '—'}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 作成 / 編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? 'BEP を編集' : 'BIM実行計画を新規作成'}
            </DialogTitle>
            <DialogDescription>
              ISO 19650 に基づく BIM 実行計画 (BEP) を登録します。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="projectId">プロジェクト *</Label>
              <select
                id="projectId"
                className={SELECT_CLASS}
                value={form.projectId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, projectId: e.target.value }))
                }
              >
                <option value="">-- プロジェクトを選択 --</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bepTitle">タイトル *</Label>
              <Input
                id="bepTitle"
                placeholder="○○橋梁工事 BIM実行計画書 v1"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="namingConvention">命名規則</Label>
              <Input
                id="namingConvention"
                placeholder="[Proj]-[Disc]-[Type]-[Zone]-[Level]"
                value={form.namingConvention}
                onChange={(e) =>
                  setForm((f) => ({ ...f, namingConvention: e.target.value }))
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
            <DialogTitle>BEP を削除しますか？</DialogTitle>
            <DialogDescription>
              「{deleteTarget?.title}
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
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending ? '削除中...' : '削除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** データ取得中のプレースホルダー表示。 */
function LoadingState() {
  return (
    <div
      className="space-y-3 py-2"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">読み込み中</span>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-12 w-full animate-pulse rounded-md bg-muted"
        />
      ))}
    </div>
  );
}

/** 取得失敗時のエラー表示。 */
function ErrorState({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'BIM情報の取得中に予期しないエラーが発生しました。';

  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 py-12 text-center">
      <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      <p className="text-sm font-medium text-destructive">
        データの取得に失敗しました
      </p>
      <p className="max-w-md text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

/** データが 0 件のときの表示。 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="text-3xl" aria-hidden="true">
        🏗️
      </span>
      <p className="text-sm font-medium text-foreground">
        BIM実行計画がまだ登録されていません
      </p>
      <p className="max-w-md text-xs text-muted-foreground">
        「新規作成」から最初の BIM 実行計画 (BEP) を登録してください。
      </p>
    </div>
  );
}

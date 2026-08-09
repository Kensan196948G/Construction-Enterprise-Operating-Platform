'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';

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

type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'DRAFT' | string;

interface Project {
  id: string;
  code: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  startDate?: string | null;
}

interface CurrentUser {
  id: string;
  organizationId: string;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: '受注',
  IN_PROGRESS: '施工中',
  CLOSED: '完了',
  DRAFT: '計画中',
};

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: '計画中' },
  { value: 'OPEN', label: '受注' },
  { value: 'IN_PROGRESS', label: '施工中' },
  { value: 'CLOSED', label: '完了' },
];

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// ----------------------------------------------------------------
// CreateProjectDialog
// ----------------------------------------------------------------

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | undefined;
}

function CreateProjectDialog({ open, onOpenChange, organizationId }: CreateProjectDialogProps) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCode('');
      setName('');
      setClientName('');
      setStartDate('');
      setFormError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post<Project>('/projects', {
        code,
        name,
        clientName: clientName || undefined,
        startDate: startDate || undefined,
        organizationId: organizationId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCode('');
      setName('');
      setClientName('');
      setStartDate('');
      setFormError(null);
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : '作成に失敗しました');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setFormError('案件コードと案件名は必須です');
      return;
    }
    if (!organizationId) {
      setFormError('組織情報が取得できません。再読み込みしてください。');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>工事案件 新規作成</DialogTitle>
          <DialogDescription>新しい工事案件の情報を入力してください。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="create-code">
              案件コード <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <Input
              id="create-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="例: P-2026-001"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-name">
              案件名 <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ○○橋梁補修工事"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-client">発注者</Label>
            <Input
              id="create-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="例: ○○市役所"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-start">着工予定日</Label>
            <Input
              id="create-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={mutation.isPending || !organizationId}>
              {mutation.isPending ? '作成中…' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------
// EditProjectDialog
// ----------------------------------------------------------------

interface EditProjectDialogProps {
  project: Project | null;
  onClose: () => void;
}

function EditProjectDialog({ project, onClose }: EditProjectDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setClientName(project.clientName ?? '');
      setStartDate(project.startDate ? project.startDate.slice(0, 10) : '');
      setStatus(project.status);
      setFormError(null);
    }
  }, [project]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.put<Project>(`/projects/${project!.id}`, {
        name: name || undefined,
        clientName: clientName || undefined,
        startDate: startDate || undefined,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setFormError(null);
      onClose();
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : '更新に失敗しました');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('案件名は必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={!!project} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>工事案件 編集</DialogTitle>
          <DialogDescription>
            {project?.code} の情報を更新します。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">
              案件名 <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-client">発注者</Label>
            <Input
              id="edit-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-start">着工予定日</Label>
            <Input
              id="edit-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-status">ステータス</Label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
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
// DeleteConfirmDialog
// ----------------------------------------------------------------

interface DeleteConfirmDialogProps {
  project: Project | null;
  onClose: () => void;
}

function DeleteConfirmDialog({ project, onClose }: DeleteConfirmDialogProps) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) setFormError(null);
  }, [project]);

  const mutation = useMutation({
    mutationFn: () => apiClient.delete<void>(`/projects/${project!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setFormError(null);
      onClose();
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : '削除に失敗しました');
    },
  });

  return (
    <Dialog open={!!project} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>工事案件を削除</DialogTitle>
          <DialogDescription>
            「{project?.name}」を削除します。この操作は元に戻せません。
          </DialogDescription>
        </DialogHeader>
        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            キャンセル
          </Button>
          <Button
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
// ProjectsPage (main)
// ----------------------------------------------------------------

export default function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const {
    data: projects,
    isPending,
    isError,
    error,
  } = useQuery<Project[], ApiError>({
    queryKey: ['projects'],
    queryFn: () => apiClient.get<Project[]>('/projects'),
  });

  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ['currentUser'],
    queryFn: () => apiClient.get<CurrentUser>('/users/me'),
  });

  return (
    <div className="space-y-6 p-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🏢 工事案件管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            登録済みの工事案件を一覧で確認・管理します。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          新規作成
        </Button>
      </div>

      {/* 一覧カード */}
      <Card>
        <CardHeader>
          <CardTitle>工事案件一覧</CardTitle>
          <CardDescription>
            案件コード・案件名・発注者・状態・開始日を表示します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectsContent
            projects={projects}
            isPending={isPending}
            isError={isError}
            error={error}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        organizationId={currentUser?.organizationId}
      />
      <EditProjectDialog
        project={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeleteConfirmDialog
        project={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ----------------------------------------------------------------
// ProjectsContent
// ----------------------------------------------------------------

interface ProjectsContentProps {
  projects: Project[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: ApiError | null;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function ProjectsContent({
  projects,
  isPending,
  isError,
  error,
  onEdit,
  onDelete,
}: ProjectsContentProps) {
  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="読み込み中">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-12 w-full animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiError
        ? error.message
        : '工事案件の取得中にエラーが発生しました。';
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm font-medium text-destructive">
          データの取得に失敗しました
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <FolderOpen className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">工事案件がまだありません</p>
        <p className="text-sm text-muted-foreground">
          「新規作成」から最初の工事案件を登録してください。
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>案件コード</TableHead>
          <TableHead>案件名</TableHead>
          <TableHead>発注者</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>開始日</TableHead>
          <TableHead className="w-20 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {project.code}
            </TableCell>
            <TableCell className="font-medium">{project.name}</TableCell>
            <TableCell>{project.clientName}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn('border-transparent', getStatusBadgeClass(project.status))}
              >
                {getStatusLabel(project.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {project.startDate ? formatDate(project.startDate) : '—'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${project.name}を編集`}
                  onClick={() => onEdit(project)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`${project.name}を削除`}
                  onClick={() => onDelete(project)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

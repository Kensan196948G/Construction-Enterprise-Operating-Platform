'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileText, Inbox, Pencil, Plus, Trash2 } from 'lucide-react';

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

type DocumentStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'PUBLISHED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED'
  | string;

interface DocumentRecord {
  id: string;
  documentNo: string;
  title: string;
  status: DocumentStatus;
  currentVersion: string;
  createdAt: string;
}

interface DocumentCategory {
  id: string;
  code: string;
  name: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

type DocumentsResponse = DocumentRecord[] | { data: DocumentRecord[] };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '下書き',
  IN_PROGRESS: '審査中',
  PUBLISHED: '公開済み',
  APPROVED: '承認済み',
  REJECTED: '却下',
  CLOSED: '完了',
  OPEN: '受付中',
};

function getStatusLabel(status: DocumentStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function normalizeDocuments(payload: DocumentsResponse): DocumentRecord[] {
  return Array.isArray(payload) ? payload : payload.data;
}

// ----------------------------------------------------------------
// 新規作成ダイアログ
// ----------------------------------------------------------------

interface CreateDialogProps {
  open: boolean;
  categories: DocumentCategory[];
  projects: Project[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateDocumentDialog({ open, categories, projects, onOpenChange, onSuccess }: CreateDialogProps) {
  const [documentNo, setDocumentNo] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDocumentNo('');
      setTitle('');
      setCategoryId('');
      setProjectId('');
      setChangeNote('');
      setFormError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post('/documents', {
        documentNo: documentNo.trim(),
        title: title.trim(),
        categoryId,
        projectId: projectId || undefined,
        changeNote: changeNote.trim() || undefined,
      }),
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
    if (!documentNo.trim() || !title.trim() || !categoryId) {
      setFormError('文書番号・タイトル・カテゴリは必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>文書 新規作成</DialogTitle>
          <DialogDescription>
            工事関連文書を登録します。文書番号は一意である必要があります。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="doc-no">文書番号 *</Label>
            <Input
              id="doc-no"
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              placeholder="例: DOC-2026-001"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-title">タイトル *</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: コンクリート打設手順書"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-category">カテゴリ *</Label>
            <select
              id="doc-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">カテゴリを選択してください</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-project">対象案件（任意）</Label>
            <select
              id="doc-project"
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
            <Label htmlFor="doc-change-note">作成理由（任意）</Label>
            <Textarea
              id="doc-change-note"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="例: 施工標準化対応"
              rows={2}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={mutation.isPending || !categoryId || !documentNo.trim() || !title.trim()}>
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
  doc: DocumentRecord | null;
  categories: DocumentCategory[];
  projects: Project[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditDocumentDialog({ doc, categories, projects, onOpenChange, onSuccess }: EditDialogProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
      setCategoryId('');
      setProjectId('');
      setFormError(null);
    }
  }, [doc]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/documents/${doc!.id}`, {
        title: title.trim() || undefined,
        categoryId: categoryId || undefined,
        projectId: projectId || undefined,
      }),
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
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>文書 編集</DialogTitle>
          <DialogDescription>
            {doc?.documentNo} の内容を変更します。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="doc-edit-title">タイトル *</Label>
            <Input
              id="doc-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-edit-category">カテゴリ変更（任意）</Label>
            <select
              id="doc-edit-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">変更しない</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-edit-project">対象案件変更（任意）</Label>
            <select
              id="doc-edit-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">変更しない</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
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
  doc: DocumentRecord | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteDocumentDialog({ doc, onOpenChange, onSuccess }: DeleteDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => apiClient.delete(`/documents/${doc!.id}`),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: ApiError) => {
      setFormError(err.message ?? '削除に失敗しました');
    },
  });

  return (
    <Dialog open={!!doc} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>文書を削除</DialogTitle>
          <DialogDescription>
            <strong>{doc?.documentNo} — {doc?.title}</strong> を削除します。この操作は取り消せません。
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

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DocumentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async (): Promise<DocumentRecord[]> => {
      const payload = await apiClient.get<DocumentsResponse>('/documents');
      return normalizeDocuments(payload);
    },
  });

  const { data: categories = [] } = useQuery<DocumentCategory[]>({
    queryKey: ['documents', 'categories'],
    queryFn: () => apiClient.get<DocumentCategory[]>('/documents/categories/all'),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient.get<Project[]>('/projects'),
  });

  const documents = data ?? [];

  function invalidateDocuments() {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              📄 文書管理
            </h1>
            <p className="text-sm text-muted-foreground">
              工事関連文書の登録・版管理・承認状況を一元管理します。
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          新規作成
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文書一覧</CardTitle>
          <CardDescription>
            {isLoading
              ? '読み込み中…'
              : `登録済みの文書 ${documents.length} 件`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} />
          ) : documents.length === 0 ? (
            <EmptyState />
          ) : (
            <DocumentsTable
              documents={documents}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          )}
        </CardContent>
      </Card>

      <CreateDocumentDialog
        open={createOpen}
        categories={categories}
        projects={projects}
        onOpenChange={setCreateOpen}
        onSuccess={invalidateDocuments}
      />
      <EditDocumentDialog
        doc={editTarget}
        categories={categories}
        projects={projects}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        onSuccess={invalidateDocuments}
      />
      <DeleteDocumentDialog
        doc={deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onSuccess={invalidateDocuments}
      />
    </div>
  );
}

// ----------------------------------------------------------------
// テーブルコンポーネント
// ----------------------------------------------------------------

interface DocumentsTableProps {
  documents: DocumentRecord[];
  onEdit: (doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
}

function DocumentsTable({ documents, onEdit, onDelete }: DocumentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[160px]">文書番号</TableHead>
          <TableHead>タイトル</TableHead>
          <TableHead className="w-[120px]">状態</TableHead>
          <TableHead className="w-[80px] text-center">版</TableHead>
          <TableHead className="w-[120px]">作成日</TableHead>
          <TableHead className="w-[100px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {doc.documentNo}
            </TableCell>
            <TableCell className="font-medium text-foreground">
              {doc.title}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn('border-transparent', getStatusBadgeClass(doc.status))}
              >
                {getStatusLabel(doc.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-center tabular-nums">
              v{doc.currentVersion}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(doc.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(doc)}
                  aria-label={`${doc.title}を編集`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(doc)}
                  aria-label={`${doc.title}を削除`}
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

function LoadingState() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-12 w-full animate-pulse rounded-md bg-muted"
        />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : '文書の取得中に不明なエラーが発生しました。';

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          文書を読み込めませんでした
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          文書がまだ登録されていません
        </p>
        <p className="text-sm text-muted-foreground">
          「新規作成」から最初の文書を登録してください。
        </p>
      </div>
    </div>
  );
}

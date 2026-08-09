'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Leaf, Plus, AlertCircle, Inbox, Pencil, Trash2 } from 'lucide-react';

import { apiClient, ApiError } from '@/lib/api-client';
import { cn, formatDate, getStatusBadgeClass } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';

/**
 * 環境側面の重要度。
 * Prisma の `enum Significance { MAJOR MODERATE MINOR }` を単一の真実とする。
 */
type Significance = 'MAJOR' | 'MODERATE' | 'MINOR';

/** ISO 14001 環境側面 (Environmental Aspect) */
interface EnvironmentAspect {
  id: string;
  /** 環境側面 (例: 建設廃棄物の排出, 騒音, 排ガス) */
  aspectName: string;
  /** 関連する活動 (例: 解体作業, 重機運転) */
  activity?: string | null;
  /** 環境影響の内容 */
  environmentalImpact?: string | null;
  /** 重要度評価 */
  significance: Significance;
  /** 管理・対策措置 */
  controlMeasure?: string | null;
  /** 法令該当の有無 */
  isLegallyRequired: boolean;
  /** レビュー実施日 (ISO 8601 文字列) */
  reviewedAt?: string | null;
}

/** 重要度ラベル (日本語) — Prisma enum に一致 */
const SIGNIFICANCE_LABEL: Record<Significance, string> = {
  MAJOR: '著しい',
  MODERATE: '中程度',
  MINOR: '軽微',
};

/** 重要度選択肢 (Significance enum — 正規3値) */
const SIGNIFICANCE_OPTIONS: [Significance, string][] = [
  ['MAJOR', '著しい'],
  ['MODERATE', '中程度'],
  ['MINOR', '軽微'],
];

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** ISO datetime 文字列を <input type="date"> 用の 'YYYY-MM-DD' へ変換 */
function toDateInputValue(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

async function fetchAspects(): Promise<EnvironmentAspect[]> {
  const data = await apiClient.get<EnvironmentAspect[]>('/environment/aspects');
  return data ?? [];
}

// ----------------------------------------------------------------
// 新規作成ダイアログ
// ----------------------------------------------------------------

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateAspectDialog({ open, onOpenChange, onSuccess }: CreateDialogProps) {
  const [aspectName, setAspectName] = useState('');
  const [activity, setActivity] = useState('');
  const [significance, setSignificance] = useState<Significance>('MINOR');
  const [environmentalImpact, setEnvironmentalImpact] = useState('');
  const [controlMeasure, setControlMeasure] = useState('');
  const [isLegallyRequired, setIsLegallyRequired] = useState(false);
  const [reviewedAt, setReviewedAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAspectName('');
      setActivity('');
      setSignificance('MINOR');
      setEnvironmentalImpact('');
      setControlMeasure('');
      setIsLegallyRequired(false);
      setReviewedAt('');
      setFormError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post('/environment/aspects', {
        aspectName: aspectName.trim(),
        activity: activity.trim() || undefined,
        significance,
        environmentalImpact: environmentalImpact.trim() || undefined,
        controlMeasure: controlMeasure.trim() || undefined,
        isLegallyRequired,
        reviewedAt: reviewedAt || undefined,
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
    if (!aspectName.trim()) {
      setFormError('環境側面名称は必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>環境側面 新規作成</DialogTitle>
          <DialogDescription>
            ISO 14001 に準拠して環境側面を登録します。著しい環境側面は重要度「著しい」を選択してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="aspect-name">環境側面名称 *</Label>
            <Input
              id="aspect-name"
              value={aspectName}
              onChange={(e) => setAspectName(e.target.value)}
              placeholder="例: 建設廃棄物の排出"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspect-activity">関連活動・工程（任意）</Label>
            <Input
              id="aspect-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="例: 解体作業"
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="aspect-significance">重要度 *</Label>
              <select
                id="aspect-significance"
                value={significance}
                onChange={(e) => setSignificance(e.target.value as Significance)}
                className={SELECT_CLASS}
              >
                {SIGNIFICANCE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aspect-reviewed-at">レビュー日（任意）</Label>
              <Input
                id="aspect-reviewed-at"
                type="date"
                value={reviewedAt}
                onChange={(e) => setReviewedAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspect-impact">環境影響の内容（任意）</Label>
            <Input
              id="aspect-impact"
              value={environmentalImpact}
              onChange={(e) => setEnvironmentalImpact(e.target.value)}
              placeholder="例: 最終処分場の負荷増加"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspect-control">管理・対策措置（任意）</Label>
            <Input
              id="aspect-control"
              value={controlMeasure}
              onChange={(e) => setControlMeasure(e.target.value)}
              placeholder="例: 分別徹底・マニフェスト管理"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="aspect-legal"
              type="checkbox"
              checked={isLegallyRequired}
              onChange={(e) => setIsLegallyRequired(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="aspect-legal">法令・規制の該当あり</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
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
  aspect: EnvironmentAspect | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditAspectDialog({ aspect, onOpenChange, onSuccess }: EditDialogProps) {
  const [aspectName, setAspectName] = useState('');
  const [activity, setActivity] = useState('');
  const [significance, setSignificance] = useState<Significance>('MINOR');
  const [environmentalImpact, setEnvironmentalImpact] = useState('');
  const [controlMeasure, setControlMeasure] = useState('');
  const [isLegallyRequired, setIsLegallyRequired] = useState(false);
  const [reviewedAt, setReviewedAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (aspect) {
      setAspectName(aspect.aspectName);
      setActivity(aspect.activity ?? '');
      setSignificance(aspect.significance);
      setEnvironmentalImpact(aspect.environmentalImpact ?? '');
      setControlMeasure(aspect.controlMeasure ?? '');
      setIsLegallyRequired(aspect.isLegallyRequired);
      setReviewedAt(toDateInputValue(aspect.reviewedAt));
      setFormError(null);
    }
  }, [aspect]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/environment/aspects/${aspect!.id}`, {
        aspectName: aspectName.trim(),
        activity: activity.trim() || undefined,
        significance,
        environmentalImpact: environmentalImpact.trim() || undefined,
        controlMeasure: controlMeasure.trim() || undefined,
        isLegallyRequired,
        reviewedAt: reviewedAt || undefined,
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
    if (!aspectName.trim()) {
      setFormError('環境側面名称は必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={!!aspect} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>環境側面 編集</DialogTitle>
          <DialogDescription>環境側面の評価内容を変更します。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="aspect-edit-name">環境側面名称 *</Label>
            <Input
              id="aspect-edit-name"
              value={aspectName}
              onChange={(e) => setAspectName(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspect-edit-activity">関連活動・工程（任意）</Label>
            <Input
              id="aspect-edit-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="aspect-edit-significance">重要度</Label>
              <select
                id="aspect-edit-significance"
                value={significance}
                onChange={(e) => setSignificance(e.target.value as Significance)}
                className={SELECT_CLASS}
              >
                {SIGNIFICANCE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aspect-edit-reviewed-at">レビュー日（任意）</Label>
              <Input
                id="aspect-edit-reviewed-at"
                type="date"
                value={reviewedAt}
                onChange={(e) => setReviewedAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspect-edit-impact">環境影響の内容（任意）</Label>
            <Input
              id="aspect-edit-impact"
              value={environmentalImpact}
              onChange={(e) => setEnvironmentalImpact(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aspect-edit-control">管理・対策措置（任意）</Label>
            <Input
              id="aspect-edit-control"
              value={controlMeasure}
              onChange={(e) => setControlMeasure(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="aspect-edit-legal"
              type="checkbox"
              checked={isLegallyRequired}
              onChange={(e) => setIsLegallyRequired(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="aspect-edit-legal">法令・規制の該当あり</Label>
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
  aspect: EnvironmentAspect | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteAspectDialog({ aspect, onOpenChange, onSuccess }: DeleteDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (aspect) {
      setFormError(null);
    }
  }, [aspect]);

  const mutation = useMutation({
    mutationFn: () => apiClient.delete(`/environment/aspects/${aspect!.id}`),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: ApiError) => {
      setFormError(err.message ?? '削除に失敗しました');
    },
  });

  return (
    <Dialog open={!!aspect} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>環境側面を削除</DialogTitle>
          <DialogDescription>
            <strong>{aspect?.aspectName}</strong> を削除します。この操作は取り消せません。
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

export default function EnvironmentPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EnvironmentAspect | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnvironmentAspect | null>(null);

  const {
    data: aspects,
    isLoading,
    isError,
    error,
  } = useQuery<EnvironmentAspect[], ApiError>({
    queryKey: ['environment', 'aspects'],
    queryFn: fetchAspects,
  });

  function invalidateAspects() {
    queryClient.invalidateQueries({ queryKey: ['environment', 'aspects'] });
  }

  return (
    <div className="space-y-6 p-6">
      {/* ページヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Leaf className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              🌿 環境管理 (ISO 14001)
            </h1>
            <p className="text-sm text-muted-foreground">
              環境側面の評価・著しい環境側面の特定と法令順守状況の管理
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          新規作成
        </Button>
      </div>

      {/* 環境側面一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>環境側面一覧</CardTitle>
          <CardDescription>
            事業活動に伴う環境側面とその重要度・法令該当状況
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AspectsTable
            aspects={aspects}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </CardContent>
      </Card>

      <CreateAspectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={invalidateAspects}
      />
      <EditAspectDialog
        aspect={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSuccess={invalidateAspects}
      />
      <DeleteAspectDialog
        aspect={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onSuccess={invalidateAspects}
      />
    </div>
  );
}

interface AspectsTableProps {
  aspects: EnvironmentAspect[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  onEdit: (aspect: EnvironmentAspect) => void;
  onDelete: (aspect: EnvironmentAspect) => void;
}

function AspectsTable({
  aspects,
  isLoading,
  isError,
  error,
  onEdit,
  onDelete,
}: AspectsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2" aria-busy="true" aria-live="polite">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-10 w-full animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 py-12 text-center"
        role="alert"
      >
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          環境側面データの取得に失敗しました
        </p>
        <p className="text-sm text-muted-foreground">
          {error?.message ?? '時間をおいて再度お試しください。'}
        </p>
      </div>
    );
  }

  if (!aspects || aspects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          登録された環境側面がありません
        </p>
        <p className="text-sm text-muted-foreground">
          「新規作成」から最初の環境側面を登録してください。
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>環境側面</TableHead>
          <TableHead>活動</TableHead>
          <TableHead>重要度</TableHead>
          <TableHead>法令該当</TableHead>
          <TableHead>レビュー日</TableHead>
          <TableHead className="w-[100px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aspects.map((aspect) => (
          <TableRow key={aspect.id}>
            <TableCell className="font-medium text-foreground">
              {aspect.aspectName}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {aspect.activity || '—'}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  'border-transparent',
                  getStatusBadgeClass(aspect.significance),
                )}
              >
                {SIGNIFICANCE_LABEL[aspect.significance] ?? aspect.significance}
              </Badge>
            </TableCell>
            <TableCell>
              {aspect.isLegallyRequired ? (
                <Badge variant="warning">該当</Badge>
              ) : (
                <Badge variant="outline">非該当</Badge>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {aspect.reviewedAt ? formatDate(aspect.reviewedAt) : '—'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(aspect)}
                  aria-label={`${aspect.aspectName}を編集`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(aspect)}
                  aria-label={`${aspect.aspectName}を削除`}
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

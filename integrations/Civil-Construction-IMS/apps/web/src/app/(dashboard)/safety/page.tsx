'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';

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

type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface Hazard {
  id: string;
  workActivity: string;
  hazardType: string;
  hazardDescription?: string;
  riskLevel: RiskLevel | string;
  residualRisk: RiskLevel | string;
  dueDate?: string | null;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

type HazardsResponse = Hazard[] | { data?: Hazard[]; items?: Hazard[] };

const COLUMN_COUNT = 6;

const RISK_LABEL: Record<string, string> = {
  CRITICAL: '重大',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

const RISK_LEVELS: RiskLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function normalizeHazards(response: HazardsResponse): Hazard[] {
  if (Array.isArray(response)) return response;
  return response.data ?? response.items ?? [];
}

function riskLabel(value: string): string {
  return RISK_LABEL[value] ?? value;
}

function RiskBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={cn('border-transparent', getStatusBadgeClass(value))}>
      {riskLabel(value)}
    </Badge>
  );
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

function CreateHazardDialog({ open, projects, onOpenChange, onSuccess }: CreateDialogProps) {
  const [workActivity, setWorkActivity] = useState('');
  const [hazardType, setHazardType] = useState('');
  const [hazardDescription, setHazardDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('MEDIUM');
  const [residualRisk, setResidualRisk] = useState<RiskLevel | ''>('LOW');
  const [projectId, setProjectId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setWorkActivity('');
      setHazardType('');
      setHazardDescription('');
      setRiskLevel('MEDIUM');
      setResidualRisk('LOW');
      setProjectId('');
      setFormError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post('/safety/hazards', {
        workActivity: workActivity.trim(),
        hazardType: hazardType.trim(),
        hazardDescription: hazardDescription.trim(),
        riskLevel: riskLevel || undefined,
        residualRisk: residualRisk || undefined,
        projectId: projectId || undefined,
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
    if (!workActivity.trim() || !hazardType.trim() || !hazardDescription.trim()) {
      setFormError('作業・危険源種別・詳細説明は必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ハザード 新規登録</DialogTitle>
          <DialogDescription>
            ISO 45001 §6.1.2 に基づく危険源特定レコードを作成します。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="hz-project">対象案件（任意）</Label>
            <select
              id="hz-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">案件を選択（任意）</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hz-work-activity">作業活動 *</Label>
            <Input
              id="hz-work-activity"
              value={workActivity}
              onChange={(e) => setWorkActivity(e.target.value)}
              placeholder="例: 足場組立・解体作業"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hz-hazard-type">危険源種別 *</Label>
            <Input
              id="hz-hazard-type"
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              placeholder="例: 墜落・転落"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hz-description">危険源の詳細説明 *</Label>
            <Textarea
              id="hz-description"
              value={hazardDescription}
              onChange={(e) => setHazardDescription(e.target.value)}
              placeholder="例: 高所作業での手すりなし箇所からの墜落リスク"
              rows={3}
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hz-risk-level">リスクレベル</Label>
              <select
                id="hz-risk-level"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>{riskLabel(r)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hz-residual-risk">残留リスク</Label>
              <select
                id="hz-residual-risk"
                value={residualRisk}
                onChange={(e) => setResidualRisk(e.target.value as RiskLevel)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>{riskLabel(r)}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '登録中…' : '登録'}
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
  hazard: Hazard | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditHazardDialog({ hazard, onOpenChange, onSuccess }: EditDialogProps) {
  const [workActivity, setWorkActivity] = useState('');
  const [hazardType, setHazardType] = useState('');
  const [hazardDescription, setHazardDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('MEDIUM');
  const [residualRisk, setResidualRisk] = useState<RiskLevel | ''>('LOW');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (hazard) {
      setWorkActivity(hazard.workActivity);
      setHazardType(hazard.hazardType);
      setHazardDescription(hazard.hazardDescription ?? '');
      setRiskLevel((hazard.riskLevel as RiskLevel) || 'MEDIUM');
      setResidualRisk((hazard.residualRisk as RiskLevel) || 'LOW');
      setFormError(null);
    }
  }, [hazard]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/safety/hazards/${hazard!.id}`, {
        workActivity: workActivity.trim(),
        hazardType: hazardType.trim(),
        hazardDescription: hazardDescription.trim() || undefined,
        riskLevel: riskLevel || undefined,
        residualRisk: residualRisk || undefined,
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
    if (!workActivity.trim() || !hazardType.trim()) {
      setFormError('作業活動と危険源種別は必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={!!hazard} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ハザード 編集</DialogTitle>
          <DialogDescription>危険源情報を更新します。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="hz-edit-work-activity">作業活動 *</Label>
            <Input
              id="hz-edit-work-activity"
              value={workActivity}
              onChange={(e) => setWorkActivity(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hz-edit-hazard-type">危険源種別 *</Label>
            <Input
              id="hz-edit-hazard-type"
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hz-edit-description">危険源の詳細説明</Label>
            <Textarea
              id="hz-edit-description"
              value={hazardDescription}
              onChange={(e) => setHazardDescription(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hz-edit-risk-level">リスクレベル</Label>
              <select
                id="hz-edit-risk-level"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>{riskLabel(r)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hz-edit-residual-risk">残留リスク</Label>
              <select
                id="hz-edit-residual-risk"
                value={residualRisk}
                onChange={(e) => setResidualRisk(e.target.value as RiskLevel)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>{riskLabel(r)}</option>
                ))}
              </select>
            </div>
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
  hazard: Hazard | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteHazardDialog({ hazard, onOpenChange, onSuccess }: DeleteDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => apiClient.delete(`/safety/hazards/${hazard!.id}`),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: ApiError) => {
      setFormError(err.message ?? '削除に失敗しました');
    },
  });

  return (
    <Dialog open={!!hazard} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ハザードを削除</DialogTitle>
          <DialogDescription>
            <strong>{hazard?.workActivity} — {hazard?.hazardType}</strong> を削除します。この操作は取り消せません。
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

export default function SafetyPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Hazard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hazard | null>(null);

  const { data, isLoading, isError, error } = useQuery<Hazard[], ApiError>({
    queryKey: ['safety', 'hazards'],
    queryFn: async () => {
      const response = await apiClient.get<HazardsResponse>('/safety/hazards');
      return normalizeHazards(response);
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiClient.get<Project[]>('/projects'),
  });

  function invalidateHazards() {
    queryClient.invalidateQueries({ queryKey: ['safety', 'hazards'] });
  }

  const hazards = data ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>⛑️ 安全衛生 (ISO 45001)</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            労働安全衛生マネジメントに基づくハザード特定とリスクアセスメント
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>リスクアセスメント一覧</CardTitle>
          <CardDescription>
            作業ごとの危険源とリスクレベル・残留リスクを管理します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HazardTable
            hazards={hazards}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </CardContent>
      </Card>

      <CreateHazardDialog
        open={createOpen}
        projects={projects}
        onOpenChange={setCreateOpen}
        onSuccess={invalidateHazards}
      />
      <EditHazardDialog
        hazard={editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        onSuccess={invalidateHazards}
      />
      <DeleteHazardDialog
        hazard={deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onSuccess={invalidateHazards}
      />
    </div>
  );
}

// ----------------------------------------------------------------
// テーブルコンポーネント
// ----------------------------------------------------------------

interface HazardTableProps {
  hazards: Hazard[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  onEdit: (hazard: Hazard) => void;
  onDelete: (hazard: Hazard) => void;
}

function HazardTable({ hazards, isLoading, isError, error, onEdit, onDelete }: HazardTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>作業</TableHead>
          <TableHead>危険源種別</TableHead>
          <TableHead>リスクレベル</TableHead>
          <TableHead>残留リスク</TableHead>
          <TableHead>対策期限</TableHead>
          <TableHead className="w-[100px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell
              colSpan={COLUMN_COUNT}
              role="status"
              aria-busy="true"
              aria-live="polite"
              className="py-10 text-center text-sm text-muted-foreground"
            >
              読み込み中...
            </TableCell>
          </TableRow>
        ) : isError ? (
          <TableRow>
            <TableCell colSpan={COLUMN_COUNT} className="py-10">
              <div className="flex flex-col items-center gap-2 text-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <p className="text-sm font-medium text-destructive">データの取得に失敗しました</p>
                <p className="text-xs text-muted-foreground">
                  {error?.message ?? '不明なエラーが発生しました'}
                </p>
              </div>
            </TableCell>
          </TableRow>
        ) : hazards.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-sm text-muted-foreground">
              登録されたハザードはありません
            </TableCell>
          </TableRow>
        ) : (
          hazards.map((hazard) => (
            <TableRow key={hazard.id}>
              <TableCell className="font-medium text-foreground">{hazard.workActivity}</TableCell>
              <TableCell className="text-muted-foreground">{hazard.hazardType}</TableCell>
              <TableCell>
                <RiskBadge value={hazard.riskLevel} />
              </TableCell>
              <TableCell>
                <RiskBadge value={hazard.residualRisk} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {hazard.dueDate ? formatDate(hazard.dueDate) : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(hazard)}
                    aria-label={`${hazard.workActivity}を編集`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(hazard)}
                    aria-label={`${hazard.workActivity}を削除`}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

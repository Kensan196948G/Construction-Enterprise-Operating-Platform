'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertCircle, Inbox, Pencil, Trash2 } from 'lucide-react';

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
import { ApiError, apiClient } from '@/lib/api-client';
import { cn, getStatusBadgeClass } from '@/lib/utils';

/** 資産 (ISO 55001) のドメインモデル */
interface Asset {
  id: string;
  assetNo: string;
  name: string;
  assetType: string;
  currentCondition: string;
  status: string;
  category?: string | null;
  location?: string | null;
}

/** 資産種別の日本語ラベル */
const ASSET_TYPE_LABELS: Record<string, string> = {
  EQUIPMENT: '設備・機械',
  STRUCTURE: '構造物',
  VEHICLE: '車両',
  FACILITY: '施設',
  TOOL: '工具',
  IT: 'IT機器',
};

/** 資産状態 (AssetCondition enum) の日本語ラベル */
const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: '優良',
  GOOD: '良好',
  FAIR: '普通',
  POOR: '不良',
  CRITICAL: '危険',
};

/**
 * ステータス (AssetStatus enum) の日本語ラベル。
 * 正規の enum 値は ACTIVE / INACTIVE / UNDER_MAINTENANCE / DISPOSED。
 * 旧値は後方互換の表示用に残す（labelOf が未知値をそのまま返すため壊れない）。
 */
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '稼働中',
  INACTIVE: '休止',
  UNDER_MAINTENANCE: '保守中',
  DISPOSED: '処分済',
  // --- 後方互換（旧シードデータ等） ---
  IN_USE: '稼働中',
  IN_PROGRESS: '稼働中',
  IDLE: '休止',
  OPEN: '運用中',
  MAINTENANCE: '保守中',
  RETIRED: '廃棄',
  CLOSED: '廃棄',
  DRAFT: '登録準備',
};

/** 種別選択肢（CreateAssetDto.assetType は文字列フィールド） */
const ASSET_TYPE_OPTIONS = Object.entries(ASSET_TYPE_LABELS);
/** 状態選択肢（AssetCondition enum） */
const CONDITION_OPTIONS: [string, string][] = [
  ['EXCELLENT', '優良'],
  ['GOOD', '良好'],
  ['FAIR', '普通'],
  ['POOR', '不良'],
  ['CRITICAL', '危険'],
];
/** ステータス選択肢（AssetStatus enum — 正規4値のみ） */
const STATUS_OPTIONS: [string, string][] = [
  ['ACTIVE', '稼働中'],
  ['INACTIVE', '休止'],
  ['UNDER_MAINTENANCE', '保守中'],
  ['DISPOSED', '処分済'],
];

function labelOf(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

// ----------------------------------------------------------------
// 新規作成ダイアログ
// ----------------------------------------------------------------

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateAssetDialog({ open, onOpenChange, onSuccess }: CreateDialogProps) {
  const [assetNo, setAssetNo] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAssetNo('');
      setName('');
      setAssetType('');
      setCategory('');
      setLocation('');
      setManufacturer('');
      setModel('');
      setSerialNo('');
      setFormError(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.post('/assets', {
        assetNo: assetNo.trim(),
        name: name.trim(),
        assetType,
        category: category.trim() || undefined,
        location: location.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        model: model.trim() || undefined,
        serialNo: serialNo.trim() || undefined,
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
    if (!assetNo.trim() || !name.trim() || !assetType) {
      setFormError('資産番号・名称・種別は必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>資産 新規作成</DialogTitle>
          <DialogDescription>
            ISO 55001 に準拠してアセットを登録します。資産番号は組織内で一意にしてください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="asset-no">資産番号 *</Label>
            <Input
              id="asset-no"
              value={assetNo}
              onChange={(e) => setAssetNo(e.target.value)}
              placeholder="例: AST-2026-001"
              maxLength={64}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-name">名称 *</Label>
            <Input
              id="asset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 油圧ショベル ZX200"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-type">種別 *</Label>
            <select
              id="asset-type"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">種別を選択してください</option>
              {ASSET_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-location">設置場所（任意）</Label>
            <Input
              id="asset-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: 第一資材置場"
              maxLength={255}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="asset-manufacturer">メーカー（任意）</Label>
              <Input
                id="asset-manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                maxLength={128}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-model">型式（任意）</Label>
              <Input
                id="asset-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                maxLength={128}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="asset-category">分類（任意）</Label>
              <Input
                id="asset-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={128}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-serial">製造番号（任意）</Label>
              <Input
                id="asset-serial"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                maxLength={128}
              />
            </div>
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
  asset: Asset | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function EditAssetDialog({ asset, onOpenChange, onSuccess }: EditDialogProps) {
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [currentCondition, setCurrentCondition] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setAssetType(asset.assetType);
      setCurrentCondition(asset.currentCondition);
      setStatus(asset.status);
      setLocation(asset.location ?? '');
      setFormError(null);
    }
  }, [asset]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.put(`/assets/${asset!.id}`, {
        name: name.trim(),
        assetType,
        currentCondition,
        status,
        location: location.trim() || undefined,
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
    if (!name.trim()) {
      setFormError('名称は必須です');
      return;
    }
    setFormError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>資産 編集</DialogTitle>
          <DialogDescription>{asset?.assetNo} の内容を変更します。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="asset-edit-name">名称 *</Label>
            <Input
              id="asset-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-edit-type">種別</Label>
            <select
              id="asset-edit-type"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className={SELECT_CLASS}
            >
              {ASSET_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="asset-edit-condition">状態</Label>
              <select
                id="asset-edit-condition"
                value={currentCondition}
                onChange={(e) => setCurrentCondition(e.target.value)}
                className={SELECT_CLASS}
              >
                {CONDITION_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-edit-status">ステータス</Label>
              <select
                id="asset-edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={SELECT_CLASS}
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset-edit-location">設置場所（任意）</Label>
            <Input
              id="asset-edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={255}
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
  asset: Asset | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DeleteAssetDialog({ asset, onOpenChange, onSuccess }: DeleteDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setFormError(null);
    }
  }, [asset]);

  const mutation = useMutation({
    mutationFn: () => apiClient.delete(`/assets/${asset!.id}`),
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: ApiError) => {
      setFormError(err.message ?? '削除に失敗しました');
    },
  });

  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>資産を削除</DialogTitle>
          <DialogDescription>
            <strong>
              {asset?.assetNo} — {asset?.name}
            </strong>{' '}
            を削除します。この操作は取り消せません。
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

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  const {
    data: assets,
    isLoading,
    isError,
    error,
  } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: () => apiClient.get<Asset[]>('/assets'),
  });

  function invalidateAssets() {
    queryClient.invalidateQueries({ queryKey: ['assets'] });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            🏛️ 資産管理 (ISO 55001)
          </h1>
          <p className="text-sm text-muted-foreground">
            アセットの登録・状態・ライフサイクルを ISO 55001 に準拠して管理します。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          新規作成
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>資産一覧</CardTitle>
          <CardDescription>
            登録済みのアセット一覧です。種別・状態・ステータスで管理状況を確認できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <AssetsLoadingState />
          ) : isError ? (
            <AssetsErrorState message={resolveErrorMessage(error)} />
          ) : !assets || assets.length === 0 ? (
            <AssetsEmptyState />
          ) : (
            <AssetsTable assets={assets} onEdit={setEditTarget} onDelete={setDeleteTarget} />
          )}
        </CardContent>
      </Card>

      <CreateAssetDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={invalidateAssets}
      />
      <EditAssetDialog
        asset={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSuccess={invalidateAssets}
      />
      <DeleteAssetDialog
        asset={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onSuccess={invalidateAssets}
      />
    </div>
  );
}

interface AssetsTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

function AssetsTable({ assets, onEdit, onDelete }: AssetsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>資産番号</TableHead>
          <TableHead>名称</TableHead>
          <TableHead>種別</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead className="w-[100px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.id}>
            <TableCell className="font-medium">{asset.assetNo}</TableCell>
            <TableCell>{asset.name}</TableCell>
            <TableCell>{labelOf(ASSET_TYPE_LABELS, asset.assetType)}</TableCell>
            <TableCell>
              <Badge
                className={cn(
                  'border-transparent',
                  getStatusBadgeClass(asset.currentCondition),
                )}
              >
                {labelOf(CONDITION_LABELS, asset.currentCondition)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                className={cn('border-transparent', getStatusBadgeClass(asset.status))}
              >
                {labelOf(STATUS_LABELS, asset.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(asset)}
                  aria-label={`${asset.name}を編集`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(asset)}
                  aria-label={`${asset.name}を削除`}
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

function AssetsLoadingState() {
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

function AssetsErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">
        資産データの取得に失敗しました
      </p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function AssetsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">資産が登録されていません</p>
      <p className="text-sm text-muted-foreground">
        「新規作成」から最初のアセットを登録してください。
      </p>
    </div>
  );
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '不明なエラーが発生しました。時間をおいて再度お試しください。';
}

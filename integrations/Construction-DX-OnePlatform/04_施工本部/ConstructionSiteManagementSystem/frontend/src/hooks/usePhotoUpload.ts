/**
 * 写真 Blob のサーバー (MinIO/S3) 送信フック.
 *
 * - 主経路: multipart/form-data で POST /photos/upload
 *   進捗率は axios の onUploadProgress から 0-100% で返す
 * - オフライン時: db.syncQueue に push し、onLine 復帰時に自動送信
 * - 成功時は IndexedDB の photos.syncStatus を 'synced' に、serverId を反映
 *
 * 使い方:
 *   const { upload, progress, status, error } = usePhotoUpload();
 *   await upload({ projectId, blob, capturedAt, sha256, category });
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AxiosProgressEvent } from 'axios';
import { apiClient } from '@/api/client';
import { db, type PhotoRow } from '@/db/dexie';

export type PhotoUploadStatus = 'idle' | 'queued' | 'uploading' | 'synced' | 'error';

export interface PhotoUploadInput {
  /** プロジェクト ID */
  projectId: number;
  /** 撮影 Blob */
  blob: Blob;
  /** 撮影日時 (ISO) */
  capturedAt: string;
  /** SHA-256 (任意) */
  sha256?: string;
  /** カテゴリ (任意) */
  category?: string;
  /** ファイル名 (任意) */
  filename?: string;
  /** ローカル DB の id (任意 — 渡せば同期状態を更新) */
  localId?: number;
}

export interface PhotoUploadResult {
  serverId?: number;
  s3Key?: string;
  queued: boolean;
}

interface UploadResponseBody {
  id: number;
  s3_key?: string | null;
}

export function usePhotoUpload() {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<PhotoUploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** オフラインキューに積む。Background Sync が拾う想定。 */
  const enqueue = useCallback(async (input: PhotoUploadInput): Promise<void> => {
    let localId = input.localId;
    if (localId === undefined) {
      // ローカル写真として保存
      const row: PhotoRow = {
        projectId: input.projectId,
        capturedAt: input.capturedAt,
        blob: input.blob,
        sha256: input.sha256,
        category: input.category,
        syncStatus: 'pending',
      };
      localId = await db.photos.add(row);
    }
    await db.syncQueue.add({
      entityType: 'photo',
      operation: 'create',
      entityLocalId: localId,
      payload: {
        projectId: input.projectId,
        capturedAt: input.capturedAt,
        sha256: input.sha256,
        category: input.category,
        filename: input.filename,
      },
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    // Background Sync 登録 (利用可能な環境のみ)
    try {
      const reg =
        'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null;
      // SyncManager は標準型に未含。型ガードで安全に呼ぶ。
      const sync = (reg as unknown as { sync?: { register: (tag: string) => Promise<void> } })
        ?.sync;
      if (sync?.register) {
        await sync.register('photo-upload');
      }
    } catch {
      /* noop */
    }
  }, []);

  /** 実アップロード。成功時 server レコードへ反映、失敗時はキュー化。 */
  const upload = useCallback(
    async (input: PhotoUploadInput): Promise<PhotoUploadResult> => {
      setError(null);
      setProgress(0);

      // オフラインなら即キュー化
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('queued');
        await enqueue(input);
        return { queued: true };
      }

      setStatus('uploading');
      const form = new FormData();
      form.append('project_id', String(input.projectId));
      form.append(
        'file',
        new File([input.blob], input.filename ?? `photo-${Date.now()}.jpg`, {
          type: input.blob.type || 'image/jpeg',
        }),
      );
      if (input.category) form.append('category', input.category);

      try {
        const res = await apiClient.post<UploadResponseBody>('/photos/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e: AxiosProgressEvent) => {
            const total = e.total ?? input.blob.size ?? 0;
            if (total > 0 && mountedRef.current) {
              setProgress(Math.min(100, Math.round((e.loaded / total) * 100)));
            }
          },
        });
        if (mountedRef.current) {
          setProgress(100);
          setStatus('synced');
        }
        if (input.localId !== undefined) {
          await db.photos.update(input.localId, {
            serverId: res.data.id,
            syncStatus: 'synced',
          });
        }
        return { serverId: res.data.id, s3Key: res.data.s3_key ?? undefined, queued: false };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'upload failed';
        if (mountedRef.current) {
          setStatus('queued');
          setError(msg);
        }
        await enqueue(input);
        return { queued: true };
      }
    },
    [enqueue],
  );

  /** キューを能動的に flush (online 復帰時に呼ぶ)。 */
  const flushQueue = useCallback(async (): Promise<number> => {
    const queued = await db.syncQueue.where('entityType').equals('photo').toArray();
    let sent = 0;
    for (const q of queued) {
      const row = await db.photos.get(q.entityLocalId);
      if (!row) {
        await db.syncQueue.delete(q.id!);
        continue;
      }
      const result = await upload({
        projectId: row.projectId,
        blob: row.blob,
        capturedAt: row.capturedAt,
        sha256: row.sha256,
        category: row.category,
        localId: row.id,
      });
      if (!result.queued) {
        await db.syncQueue.delete(q.id!);
        sent += 1;
      } else {
        // 再失敗 → attempts インクリメント
        await db.syncQueue.update(q.id!, { attempts: (q.attempts ?? 0) + 1 });
      }
    }
    return sent;
  }, [upload]);

  // online 復帰時に自動 flush
  useEffect(() => {
    const onOnline = () => {
      void flushQueue();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flushQueue]);

  return { upload, flushQueue, progress, status, error };
}

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export interface UploadedFileInfo {
  file: File;
  previewUrl?: string;
  /** アップロード進捗 (0-100)。外部から進捗を反映する用 */
  progress?: number;
  error?: string;
}

export interface FileUploaderProps {
  /** 複数選択を許可 */
  multiple?: boolean;
  /** 1ファイルあたりの最大サイズ (バイト) */
  maxSize?: number;
  /** 受け付ける MIME / 拡張子 (例: 'image/*,.pdf') */
  accept?: string;
  /** ファイルが変更されたとき */
  onChange?: (files: UploadedFileInfo[]) => void;
  /** 個別アップロード処理。進捗を扱いたい場合に使用 */
  onUpload?: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  /** プレースホルダ */
  label?: string;
  /** 追加クラス */
  className?: string;
  /** disabled */
  disabled?: boolean;
}

const isImage = (file: File) => file.type.startsWith('image/');

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * D&D + クリック対応のファイルアップローダ。
 * - 複数ファイル / 画像プレビュー / 最大サイズ制限 / 進捗表示。
 */
export const FileUploader = forwardRef<HTMLDivElement, FileUploaderProps>(
  (
    {
      multiple = false,
      maxSize,
      accept,
      onChange,
      onUpload,
      label = 'ファイルをドラッグ&ドロップ または クリックして選択',
      className,
      disabled = false,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const inputId = useId();
    const [files, setFiles] = useState<UploadedFileInfo[]>([]);
    const filesRef = useRef<UploadedFileInfo[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
      filesRef.current = files;
    }, [files]);

    const emit = useCallback(
      (next: UploadedFileInfo[]) => {
        filesRef.current = next;
        setFiles(next);
        onChange?.(next);
      },
      [onChange],
    );

    const updateFile = useCallback(
      (target: File, patch: Partial<UploadedFileInfo>) => {
        const next = filesRef.current.map((f) =>
          f.file === target ? { ...f, ...patch } : f,
        );
        emit(next);
      },
      [emit],
    );

    const addFiles = useCallback(
      async (newFiles: FileList | File[]) => {
        const arr = Array.from(newFiles);
        const processed: UploadedFileInfo[] = arr.map((file) => {
          if (maxSize && file.size > maxSize) {
            return {
              file,
              error: `サイズ超過 (上限 ${formatBytes(maxSize)})`,
            };
          }
          return {
            file,
            previewUrl: isImage(file) ? URL.createObjectURL(file) : undefined,
            progress: onUpload ? 0 : 100,
          };
        });

        const next = multiple ? [...filesRef.current, ...processed] : processed;
        emit(next);

        if (onUpload) {
          for (const info of processed) {
            if (info.error) continue;
            try {
              await onUpload(info.file, (pct) => {
                updateFile(info.file, { progress: pct });
              });
              updateFile(info.file, { progress: 100 });
            } catch (e) {
              updateFile(info.file, {
                error: e instanceof Error ? e.message : 'アップロード失敗',
              });
            }
          }
        }
      },
      [maxSize, multiple, onUpload, emit, updateFile],
    );

    const onDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      if (e.dataTransfer.files?.length) {
        void addFiles(e.dataTransfer.files);
      }
    };

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        void addFiles(e.target.files);
        e.target.value = '';
      }
    };

    const removeAt = (idx: number) => {
      const next = files.filter((_, i) => i !== idx);
      const removed = files[idx];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      emit(next);
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-disabled={disabled}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-6 rounded-cdx border-2 border-dashed cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary-50'
              : 'border-slate-300 bg-white hover:bg-slate-50',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <Upload size={28} className="text-primary" aria-hidden="true" />
          <p className="text-sm text-slate-600 text-center">{label}</p>
          {maxSize && (
            <p className="text-xs text-slate-400">最大 {formatBytes(maxSize)} / ファイル</p>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={onInputChange}
            disabled={disabled}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-3 space-y-2" aria-label="選択済みファイル一覧">
            {files.map((info, idx) => (
              <li
                key={`${info.file.name}-${idx}`}
                className="flex items-center gap-3 p-2 cdx-card"
              >
                {info.previewUrl ? (
                   
                  <img
                    src={info.previewUrl}
                    alt={`プレビュー: ${info.file.name}`}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : isImage(info.file) ? (
                  <ImageIcon size={28} className="text-slate-400" aria-hidden="true" />
                ) : (
                  <FileText size={28} className="text-slate-400" aria-hidden="true" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{info.file.name}</div>
                  <div className="text-xs text-slate-500">{formatBytes(info.file.size)}</div>
                  {info.error ? (
                    <div className="text-xs text-danger" role="alert">
                      {info.error}
                    </div>
                  ) : typeof info.progress === 'number' && info.progress < 100 ? (
                    <div
                      className="h-1.5 bg-slate-200 rounded overflow-hidden mt-1"
                      role="progressbar"
                      aria-valuenow={info.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${info.progress}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500"
                  aria-label={`${info.file.name} を削除`}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
FileUploader.displayName = 'FileUploader';

import { forwardRef, type HTMLAttributes } from 'react';
import { MapPin, Camera, Tag } from 'lucide-react';
import { cn } from '../utils/cn';

export interface PhotoCardTag {
  /** AI分類タグの表示文言 */
  label: string;
  /** 信頼度 0-1 (任意) */
  confidence?: number;
  /** 色キー */
  color?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success';
}

export interface PhotoCardProps extends HTMLAttributes<HTMLDivElement> {
  /** 画像 URL */
  src: string;
  /** alt テキスト */
  alt: string;
  /** 撮影日時 */
  takenAt?: Date | string;
  /** 撮影位置 (lat, lng) または住所 */
  location?: { lat: number; lng: number } | string;
  /** AI 分類タグ */
  tags?: PhotoCardTag[];
  /** タイトル */
  title?: string;
  /** カードクリック */
  onSelect?: () => void;
}

const TAG_STYLE: Record<NonNullable<PhotoCardTag['color']>, string> = {
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-secondary-100 text-secondary-800',
  accent: 'bg-accent-100 text-accent-800',
  danger: 'bg-danger-50 text-danger-700',
  success: 'bg-success-50 text-success-700',
};

const formatDate = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatLocation = (loc: { lat: number; lng: number } | string): string =>
  typeof loc === 'string' ? loc : `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;

/**
 * 現場写真カード。撮影日時 / 位置 / AI分類タグを表示。
 */
export const PhotoCard = forwardRef<HTMLDivElement, PhotoCardProps>(
  ({ src, alt, takenAt, location, tags, title, onSelect, className, ...rest }, ref) => {
    const interactive = !!onSelect;

    return (
      <div
        ref={ref}
        role={interactive ? 'button' : 'article'}
        tabIndex={interactive ? 0 : undefined}
        onClick={onSelect}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.();
                }
              }
            : undefined
        }
        className={cn(
          'cdx-card overflow-hidden flex flex-col',
          interactive && 'cursor-pointer hover:shadow-cdx-md transition-shadow',
          className,
        )}
        {...rest}
      >
        <div className="aspect-video bg-slate-100 relative">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="p-3 flex flex-col gap-1.5">
          {title && (
            <h3 className="font-semibold text-sm text-slate-800 truncate">{title}</h3>
          )}

          {takenAt && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <Camera size={12} aria-hidden="true" />
              <time dateTime={typeof takenAt === 'string' ? takenAt : takenAt.toISOString()}>
                {formatDate(takenAt)}
              </time>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <MapPin size={12} aria-hidden="true" />
              <span className="truncate">{formatLocation(location)}</span>
            </div>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1" aria-label="AI 分類タグ">
              {tags.map((tag, i) => (
                <span
                  key={`${tag.label}-${i}`}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                    TAG_STYLE[tag.color ?? 'primary'],
                  )}
                >
                  <Tag size={10} aria-hidden="true" />
                  <span>{tag.label}</span>
                  {typeof tag.confidence === 'number' && (
                    <span className="opacity-70">
                      {Math.round(tag.confidence * 100)}%
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);
PhotoCard.displayName = 'PhotoCard';

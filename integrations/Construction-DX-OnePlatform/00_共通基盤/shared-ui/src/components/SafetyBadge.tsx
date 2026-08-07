import { forwardRef, type HTMLAttributes } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, OctagonAlert } from 'lucide-react';
import { cn } from '../utils/cn';

export type SafetyLevel = 'safe' | 'caution' | 'warning' | 'danger';

/** i-Construction の 4M 区分 */
export type FourM = 'man' | 'machine' | 'material' | 'method';

export interface SafetyBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** 安全レベル */
  level: SafetyLevel;
  /** 4M 区分 (任意。指定すると左に色付き縁取りラベル) */
  category?: FourM;
  /** 表示ラベル (省略でレベルに応じた既定文言) */
  label?: string;
  /** アイコン非表示 */
  hideIcon?: boolean;
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
}

const LEVEL_STYLE: Record<SafetyLevel, { bg: string; text: string; label: string }> = {
  safe: { bg: 'bg-success', text: 'text-white', label: '安全' },
  caution: { bg: 'bg-accent', text: 'text-slate-900', label: '注意' },
  warning: { bg: 'bg-orange-500', text: 'text-white', label: '警告' },
  danger: { bg: 'bg-danger', text: 'text-white', label: '危険' },
};

const CATEGORY_STYLE: Record<FourM, { color: string; label: string }> = {
  man: { color: 'border-4m-man', label: '人 (Man)' },
  machine: { color: 'border-4m-machine', label: '機械 (Machine)' },
  material: { color: 'border-4m-material', label: '材料 (Material)' },
  method: { color: 'border-4m-method', label: '方法 (Method)' },
};

const SIZE_STYLE: Record<NonNullable<SafetyBadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const ICONS: Record<SafetyLevel, typeof ShieldCheck> = {
  safe: ShieldCheck,
  caution: AlertTriangle,
  warning: ShieldAlert,
  danger: OctagonAlert,
};

/**
 * 安全レベル表示バッジ (i-Construction 準拠 4M 色対応)。
 */
export const SafetyBadge = forwardRef<HTMLSpanElement, SafetyBadgeProps>(
  ({ level, category, label, hideIcon = false, size = 'md', className, ...rest }, ref) => {
    const style = LEVEL_STYLE[level];
    const Icon = ICONS[level];
    const text = label ?? style.label;
    const accessibleLabel = category
      ? `${CATEGORY_STYLE[category].label} - ${text}`
      : text;

    return (
      <span
        ref={ref}
        role="status"
        aria-label={accessibleLabel}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap',
          style.bg,
          style.text,
          SIZE_STYLE[size],
          category && cn('border-l-4 rounded-l-sm', CATEGORY_STYLE[category].color),
          className,
        )}
        {...rest}
      >
        {!hideIcon && <Icon size={size === 'lg' ? 18 : size === 'sm' ? 12 : 14} aria-hidden="true" />}
        <span>{text}</span>
      </span>
    );
  },
);
SafetyBadge.displayName = 'SafetyBadge';

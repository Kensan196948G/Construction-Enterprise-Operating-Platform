import { forwardRef, type HTMLAttributes } from 'react';
import { Info, AlertTriangle, OctagonAlert } from 'lucide-react';
import { cn } from '../utils/cn';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertSeverityChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** 重要度 */
  severity: AlertSeverity;
  /** 表示文言 (省略時は既定) */
  label?: string;
  /** アイコン非表示 */
  hideIcon?: boolean;
  /** 点滅 (critical 強調) */
  pulse?: boolean;
}

const SEVERITY_META: Record<
  AlertSeverity,
  { bg: string; text: string; label: string; icon: typeof Info }
> = {
  info: { bg: 'bg-secondary-100', text: 'text-secondary-800', label: '情報', icon: Info },
  warning: { bg: 'bg-accent-100', text: 'text-accent-800', label: '警告', icon: AlertTriangle },
  critical: { bg: 'bg-danger', text: 'text-white', label: '重大', icon: OctagonAlert },
};

/**
 * アラート重要度を示す chip。
 */
export const AlertSeverityChip = forwardRef<HTMLSpanElement, AlertSeverityChipProps>(
  ({ severity, label, hideIcon = false, pulse = false, className, ...rest }, ref) => {
    const meta = SEVERITY_META[severity];
    const Icon = meta.icon;
    const text = label ?? meta.label;
    return (
      <span
        ref={ref}
        role="status"
        aria-label={`アラート重要度: ${text}`}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
          meta.bg,
          meta.text,
          pulse && severity === 'critical' && 'animate-pulse',
          className,
        )}
        {...rest}
      >
        {!hideIcon && <Icon size={12} aria-hidden="true" />}
        <span>{text}</span>
      </span>
    );
  },
);
AlertSeverityChip.displayName = 'AlertSeverityChip';

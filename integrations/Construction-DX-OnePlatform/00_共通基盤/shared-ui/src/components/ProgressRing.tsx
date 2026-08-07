import { forwardRef, type SVGAttributes } from 'react';
import { cn } from '../utils/cn';

export interface ProgressRingProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  /** 進捗率 0-100 */
  value: number;
  /** リングサイズ (px) */
  size?: number;
  /** リング線の太さ (px) */
  strokeWidth?: number;
  /** 中央ラベル (省略で `XX%` 表示) */
  label?: string;
  /** カラーキー */
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'accent';
  /** トラック色クラス */
  trackClassName?: string;
}

const COLOR_CLASS: Record<NonNullable<ProgressRingProps['color']>, string> = {
  primary: 'stroke-primary',
  secondary: 'stroke-secondary',
  success: 'stroke-success',
  danger: 'stroke-danger',
  accent: 'stroke-accent',
};

/**
 * 進捗率の円リング表示。
 */
export const ProgressRing = forwardRef<SVGSVGElement, ProgressRingProps>(
  (
    {
      value,
      size = 96,
      strokeWidth = 10,
      label,
      color = 'primary',
      trackClassName,
      className,
      ...rest
    },
    ref,
  ) => {
    const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clamped / 100);
    const center = size / 2;
    const display = label ?? `${Math.round(clamped)}%`;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`進捗率 ${Math.round(clamped)}%`}
        className={cn('inline-block', className)}
        {...rest}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('stroke-slate-200', trackClassName)}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          className={cn(COLOR_CLASS[color], 'transition-[stroke-dashoffset] duration-500')}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-slate-800 font-semibold"
          style={{ fontSize: size * 0.22 }}
        >
          {display}
        </text>
      </svg>
    );
  },
);
ProgressRing.displayName = 'ProgressRing';

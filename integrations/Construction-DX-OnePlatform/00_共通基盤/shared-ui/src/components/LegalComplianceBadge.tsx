import { forwardRef, type HTMLAttributes } from 'react';
import { ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * 主要な建設業界関連法令・規格。
 * - iso9001 / iso14001 / iso45001
 * - 建設業法 (constructionBusiness)
 * - 品確法 (quality)
 * - i-Construction
 * - CCUS (建設キャリアアップシステム)
 */
export type LegalStandard =
  | 'iso9001'
  | 'iso14001'
  | 'iso45001'
  | 'constructionBusiness'
  | 'quality'
  | 'iConstruction'
  | 'ccus';

export type ComplianceStatus = 'compliant' | 'pending' | 'nonCompliant';

export interface LegalComplianceBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** 規格・法令キー */
  standard: LegalStandard;
  /** 準拠状態 */
  status?: ComplianceStatus;
  /** ラベル上書き */
  label?: string;
  /** サイズ */
  size?: 'sm' | 'md';
}

const STANDARD_LABEL: Record<LegalStandard, string> = {
  iso9001: 'ISO 9001',
  iso14001: 'ISO 14001',
  iso45001: 'ISO 45001',
  constructionBusiness: '建設業法',
  quality: '品確法',
  iConstruction: 'i-Construction',
  ccus: 'CCUS',
};

const STATUS_STYLE: Record<
  ComplianceStatus,
  { bg: string; text: string; icon: typeof ShieldCheck; label: string }
> = {
  compliant: { bg: 'bg-success-50 border-success-600', text: 'text-success-800', icon: ShieldCheck, label: '準拠' },
  pending: { bg: 'bg-accent-50 border-accent-600', text: 'text-accent-800', icon: ShieldAlert, label: '審査中' },
  nonCompliant: { bg: 'bg-danger-50 border-danger-600', text: 'text-danger-700', icon: ShieldX, label: '不適合' },
};

const SIZE_STYLE: Record<NonNullable<LegalComplianceBadgeProps['size']>, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
};

/**
 * 法令・規格準拠バッジ (ISO / 建設業法 / 品確法 / i-Construction 等)。
 */
export const LegalComplianceBadge = forwardRef<HTMLSpanElement, LegalComplianceBadgeProps>(
  ({ standard, status = 'compliant', label, size = 'md', className, ...rest }, ref) => {
    const std = STANDARD_LABEL[standard];
    const sty = STATUS_STYLE[status];
    const Icon = sty.icon;
    const text = label ?? std;
    return (
      <span
        ref={ref}
        role="status"
        aria-label={`${std} ${sty.label}`}
        className={cn(
          'inline-flex items-center rounded border font-medium whitespace-nowrap',
          sty.bg,
          sty.text,
          SIZE_STYLE[size],
          className,
        )}
        {...rest}
      >
        <Icon size={size === 'sm' ? 10 : 12} aria-hidden="true" />
        <span>{text}</span>
      </span>
    );
  },
);
LegalComplianceBadge.displayName = 'LegalComplianceBadge';

/**
 * 日本ロケール向けフォーマッタ群。
 * 表示用ユーティリティのみ。副作用なし。
 */

/**
 * 円通貨フォーマット。
 * @example formatCurrencyJpy(12345) // '¥12,345'
 */
export function formatCurrencyJpy(num: number): string {
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * パーセント表示。値はそのまま % を付与 (0-100 想定)。
 * @example formatPercent(12.345) // '12.3%'
 * @example formatPercent(12.345, 2) // '12.35%'
 */
export function formatPercent(num: number, fractionDigits = 1): string {
  if (!Number.isFinite(num)) return '—';
  return `${num.toFixed(fractionDigits)}%`;
}

/**
 * 日本式大数表記。万 / 億 / 兆 単位に丸める。
 * @example formatLargeNumber(12345) // '1.2万'
 * @example formatLargeNumber(123456789) // '1.2億'
 */
export function formatLargeNumber(num: number, fractionDigits = 1): string {
  if (!Number.isFinite(num)) return '—';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const round = (v: number): string => {
    const fixed = v.toFixed(fractionDigits);
    // 末尾の .0 を削る
    return fixed.replace(/\.?0+$/, '');
  };
  if (abs >= 1e12) return `${sign}${round(abs / 1e12)}兆`;
  if (abs >= 1e8) return `${sign}${round(abs / 1e8)}億`;
  if (abs >= 1e4) return `${sign}${round(abs / 1e4)}万`;
  return `${sign}${Math.round(abs)}`;
}

/**
 * 日本式日付フォーマット (YYYY/MM/DD)。
 * @example formatJaDate(new Date('2026-05-22')) // '2026/05/22'
 */
export function formatJaDate(d: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

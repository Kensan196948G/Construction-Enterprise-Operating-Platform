import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * clsx + tailwind-merge を合成したクラス名ヘルパ。
 * 競合する Tailwind クラスは後勝ち優先で解決される。
 *
 * @example
 *   cn('p-2', condition && 'p-4', 'text-sm')
 *   // -> 'p-4 text-sm'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

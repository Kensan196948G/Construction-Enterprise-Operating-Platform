import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('クラス名を結合する', () => {
    expect(cn('a', 'b', false && 'c', 'd')).toBe('a b d');
  });

  it('競合する Tailwind クラスを後勝ちで解決する', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

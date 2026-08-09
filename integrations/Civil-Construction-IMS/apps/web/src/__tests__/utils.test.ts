import { formatDate, getStatusBadgeClass, cn } from '@/lib/utils';

describe('utils', () => {
  describe('formatDate', () => {
    it('日付を日本語フォーマット (YYYY/MM/DD) に変換する', () => {
      const result = formatDate('2026-05-31');
      expect(result).toMatch(/2026/);
      expect(result).toMatch(/05/);
      expect(result).toMatch(/31/);
    });

    it('Date オブジェクトを受け付ける', () => {
      const result = formatDate(new Date('2026-01-01'));
      expect(result).toMatch(/2026/);
    });
  });

  describe('getStatusBadgeClass', () => {
    it('OPEN ステータスに黄色クラスを返す', () => {
      expect(getStatusBadgeClass('OPEN')).toBe('bg-yellow-100 text-yellow-800');
    });

    it('APPROVED ステータスに緑クラスを返す', () => {
      expect(getStatusBadgeClass('APPROVED')).toBe('bg-green-100 text-green-800');
    });

    it('未知のステータスにグレークラスを返す', () => {
      expect(getStatusBadgeClass('UNKNOWN')).toBe('bg-gray-100 text-gray-800');
    });

    it('CRITICAL ステータスに赤クラスを返す', () => {
      expect(getStatusBadgeClass('CRITICAL')).toBe('bg-red-100 text-red-800');
    });
  });

  describe('cn', () => {
    it('クラス名をマージする', () => {
      const result = cn('bg-blue-100', 'text-blue-800');
      expect(result).toContain('bg-blue-100');
      expect(result).toContain('text-blue-800');
    });

    it('空文字列を無視する', () => {
      const result = cn('bg-blue-100', '', undefined);
      expect(result).toBe('bg-blue-100');
    });
  });
});

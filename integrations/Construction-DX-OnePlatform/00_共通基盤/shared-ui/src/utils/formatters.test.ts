import { describe, it, expect } from 'vitest';
import {
  formatCurrencyJpy,
  formatPercent,
  formatLargeNumber,
  formatJaDate,
} from './formatters';

describe('formatCurrencyJpy', () => {
  it('円通貨を3桁区切りで返す', () => {
    expect(formatCurrencyJpy(12345)).toMatch(/12,345/);
    expect(formatCurrencyJpy(12345)).toMatch(/[¥￥]/);
  });
  it('NaN は — を返す', () => {
    expect(formatCurrencyJpy(NaN)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('既定で小数1桁', () => {
    expect(formatPercent(12.345)).toBe('12.3%');
  });
  it('桁数を指定できる', () => {
    expect(formatPercent(12.345, 2)).toBe('12.35%');
  });
});

describe('formatLargeNumber', () => {
  it('1.2万 に丸める', () => {
    expect(formatLargeNumber(12345)).toBe('1.2万');
  });
  it('億単位に丸める', () => {
    expect(formatLargeNumber(123456789)).toBe('1.2億');
  });
  it('1万未満はそのまま', () => {
    expect(formatLargeNumber(1234)).toBe('1234');
  });
  it('負の値も扱える', () => {
    expect(formatLargeNumber(-12345)).toBe('-1.2万');
  });
});

describe('formatJaDate', () => {
  it('YYYY/MM/DD 形式で返す', () => {
    expect(formatJaDate(new Date('2026-05-22T00:00:00'))).toBe('2026/05/22');
  });
  it('不正値は —', () => {
    expect(formatJaDate('not-a-date')).toBe('—');
  });
});

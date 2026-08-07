import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from '../ProgressRing';

describe('ProgressRing', () => {
  it('進捗率と aria-label を表示する', () => {
    render(<ProgressRing value={72} />);
    const svg = screen.getByRole('img', { name: '進捗率 72%' });
    expect(svg).toBeInTheDocument();
    expect(svg.textContent).toContain('72%');
  });

  it('範囲外の値を 0-100 にクランプする', () => {
    render(<ProgressRing value={150} />);
    expect(screen.getByRole('img', { name: '進捗率 100%' })).toBeInTheDocument();
  });
});

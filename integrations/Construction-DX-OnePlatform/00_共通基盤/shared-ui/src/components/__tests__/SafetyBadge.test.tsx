import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafetyBadge } from '../SafetyBadge';

describe('SafetyBadge', () => {
  it('レベルに応じた既定ラベルを表示する', () => {
    render(<SafetyBadge level="danger" />);
    expect(screen.getByRole('status', { name: '危険' })).toBeInTheDocument();
  });

  it('4M カテゴリを aria-label に含める', () => {
    render(<SafetyBadge level="caution" category="machine" label="重機接近" />);
    const el = screen.getByRole('status');
    expect(el.getAttribute('aria-label')).toContain('機械 (Machine)');
    expect(el.getAttribute('aria-label')).toContain('重機接近');
  });
});

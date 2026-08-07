import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertSeverityChip } from '../AlertSeverityChip';

describe('AlertSeverityChip', () => {
  it('既定ラベルを表示する', () => {
    render(<AlertSeverityChip severity="critical" />);
    expect(screen.getByRole('status', { name: 'アラート重要度: 重大' })).toBeInTheDocument();
  });

  it('ラベル上書きが効く', () => {
    render(<AlertSeverityChip severity="warning" label="温度超過" />);
    expect(screen.getByRole('status', { name: 'アラート重要度: 温度超過' })).toBeInTheDocument();
  });
});

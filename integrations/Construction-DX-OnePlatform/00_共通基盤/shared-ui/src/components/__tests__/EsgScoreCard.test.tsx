import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EsgScoreCard } from '../EsgScoreCard';

describe('EsgScoreCard', () => {
  it('3軸スコアと総合グレードを表示する', () => {
    render(
      <EsgScoreCard
        scores={{ environment: 85, social: 75, governance: 80 }}
        period="2025年度"
      />,
    );
    expect(screen.getByLabelText(/ESG スコア \(2025年度\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/環境 \(E\)/)).toHaveAttribute('aria-valuenow', '85');
    expect(screen.getByLabelText(/総合評価 A/)).toBeInTheDocument();
  });

  it('範囲外のスコアをクランプする', () => {
    render(<EsgScoreCard scores={{ environment: 150, social: -10, governance: 50 }} />);
    expect(screen.getByLabelText(/環境 \(E\)/)).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByLabelText(/社会 \(S\)/)).toHaveAttribute('aria-valuenow', '0');
  });
});

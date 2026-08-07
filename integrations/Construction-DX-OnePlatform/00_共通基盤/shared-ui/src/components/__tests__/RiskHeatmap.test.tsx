import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RiskHeatmap } from '../RiskHeatmap';

describe('RiskHeatmap', () => {
  it('セル件数を表示し、クリックでハンドラを呼ぶ', async () => {
    const onClick = vi.fn();
    render(
      <RiskHeatmap
        cells={[
          { probability: 5, impact: 5, count: 3, id: 'r1' },
          { probability: 1, impact: 1, count: 1 },
        ]}
        onCellClick={onClick}
      />,
    );
    const cell = screen.getByRole('cell', { name: /発生確率 5 \/ 影響度 5: 3件/ });
    expect(cell).toHaveTextContent('3');
    await userEvent.click(cell);
    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ probability: 5, impact: 5, count: 3, id: 'r1' }),
    );
  });
});

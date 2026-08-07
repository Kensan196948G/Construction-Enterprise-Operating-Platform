/**
 * PipelineKanban basic render test.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PipelineKanban, type KanbanOpportunity } from '../PipelineKanban';

describe('PipelineKanban', () => {
  it('renders all 6 stage columns and the opportunity title', () => {
    const items: KanbanOpportunity[] = [
      {
        id: 1,
        title: 'テスト案件A',
        client_name: 'クライアント1',
        stage: 'proposal',
        win_probability: 70,
        expected_amount: 10000000,
      },
    ];
    const { container, getByText } = render(<PipelineKanban opportunities={items} />);
    // 6 stages
    expect(container.querySelectorAll('section').length).toBe(6);
    expect(getByText('テスト案件A')).toBeTruthy();
  });
});

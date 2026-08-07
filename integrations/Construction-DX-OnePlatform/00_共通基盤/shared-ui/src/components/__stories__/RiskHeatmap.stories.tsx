import type { Meta, StoryObj } from '@storybook/react';
import { RiskHeatmap } from '../RiskHeatmap';

const meta: Meta<typeof RiskHeatmap> = {
  title: 'KPI/RiskHeatmap',
  component: RiskHeatmap,
};
export default meta;

type Story = StoryObj<typeof RiskHeatmap>;

export const Default: Story = {
  args: {
    cells: [
      { probability: 5, impact: 5, count: 2, id: 'high-1' },
      { probability: 4, impact: 5, count: 1 },
      { probability: 3, impact: 4, count: 3 },
      { probability: 3, impact: 3, count: 4 },
      { probability: 2, impact: 2, count: 6 },
      { probability: 1, impact: 1, count: 8 },
      { probability: 2, impact: 4, count: 2 },
      { probability: 4, impact: 2, count: 1 },
    ],
    onCellClick: (c) => alert(`P=${c.probability} / I=${c.impact} → ${c.count}件`),
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { EsgScoreCard } from '../EsgScoreCard';

const meta: Meta<typeof EsgScoreCard> = {
  title: 'ESG/EsgScoreCard',
  component: EsgScoreCard,
};
export default meta;

type Story = StoryObj<typeof EsgScoreCard>;

export const High: Story = {
  args: {
    scores: { environment: 85, social: 78, governance: 82 },
    title: '当社 ESG スコア',
    period: '2025年度',
  },
};

export const Low: Story = {
  args: {
    scores: { environment: 35, social: 28, governance: 42 },
    title: 'サプライヤーX ESG スコア',
    period: '2024年度',
  },
};

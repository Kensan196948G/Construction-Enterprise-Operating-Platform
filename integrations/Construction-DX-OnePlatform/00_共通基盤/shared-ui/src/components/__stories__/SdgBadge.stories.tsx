import type { Meta, StoryObj } from '@storybook/react';
import { SdgBadge, type SdgGoal } from '../SdgBadge';

const meta: Meta<typeof SdgBadge> = {
  title: 'ESG/SdgBadge',
  component: SdgBadge,
};
export default meta;

type Story = StoryObj<typeof SdgBadge>;

export const Default: Story = {
  args: { goal: 13, showTitle: true },
};

export const All17: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 max-w-xl">
      {(Array.from({ length: 17 }, (_, i) => (i + 1) as SdgGoal)).map((g) => (
        <SdgBadge key={g} goal={g} size="lg" />
      ))}
    </div>
  ),
};

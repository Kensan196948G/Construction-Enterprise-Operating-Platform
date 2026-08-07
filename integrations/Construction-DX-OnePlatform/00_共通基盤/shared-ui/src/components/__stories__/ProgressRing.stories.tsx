import type { Meta, StoryObj } from '@storybook/react';
import { ProgressRing } from '../ProgressRing';

const meta: Meta<typeof ProgressRing> = {
  title: 'KPI/ProgressRing',
  component: ProgressRing,
};
export default meta;

type Story = StoryObj<typeof ProgressRing>;

export const Default: Story = {
  args: { value: 72, size: 120, color: 'primary' },
};

export const Palette: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <ProgressRing value={25} color="danger" />
      <ProgressRing value={55} color="accent" />
      <ProgressRing value={80} color="secondary" />
      <ProgressRing value={95} color="success" />
    </div>
  ),
};

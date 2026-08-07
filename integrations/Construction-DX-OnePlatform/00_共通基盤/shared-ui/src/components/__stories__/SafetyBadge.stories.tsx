import type { Meta, StoryObj } from '@storybook/react';
import { SafetyBadge } from '../SafetyBadge';

const meta: Meta<typeof SafetyBadge> = {
  title: 'Field/SafetyBadge',
  component: SafetyBadge,
};
export default meta;

type Story = StoryObj<typeof SafetyBadge>;

export const Safe: Story = {
  args: { level: 'safe' },
};

export const Caution: Story = {
  args: { level: 'caution', category: 'machine', label: '重機接近' },
};

export const Danger: Story = {
  args: { level: 'danger', category: 'man', label: 'ヘルメット未着用', size: 'lg' },
};

export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <SafetyBadge level="safe" />
      <SafetyBadge level="caution" />
      <SafetyBadge level="warning" />
      <SafetyBadge level="danger" />
    </div>
  ),
};

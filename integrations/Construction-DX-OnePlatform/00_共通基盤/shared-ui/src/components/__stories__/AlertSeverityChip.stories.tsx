import type { Meta, StoryObj } from '@storybook/react';
import { AlertSeverityChip } from '../AlertSeverityChip';

const meta: Meta<typeof AlertSeverityChip> = {
  title: 'Status/AlertSeverityChip',
  component: AlertSeverityChip,
};
export default meta;

type Story = StoryObj<typeof AlertSeverityChip>;

export const All: Story = {
  render: () => (
    <div className="flex gap-2 items-center">
      <AlertSeverityChip severity="info" />
      <AlertSeverityChip severity="warning" />
      <AlertSeverityChip severity="critical" pulse />
      <AlertSeverityChip severity="critical" label="火災検出" />
    </div>
  ),
};

export const Critical: Story = {
  args: { severity: 'critical', label: '土砂崩落センサー反応', pulse: true },
};

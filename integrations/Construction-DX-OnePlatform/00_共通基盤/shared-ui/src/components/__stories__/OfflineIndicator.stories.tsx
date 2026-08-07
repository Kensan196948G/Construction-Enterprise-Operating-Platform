import type { Meta, StoryObj } from '@storybook/react';
import { OfflineIndicator } from '../OfflineIndicator';

const meta: Meta<typeof OfflineIndicator> = {
  title: 'Status/OfflineIndicator',
  component: OfflineIndicator,
  parameters: {
    docs: {
      description: {
        component:
          '`navigator.onLine` を監視するため、Storybook の DevTools から Network を Offline にすると赤バナーが現れます。',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof OfflineIndicator>;

export const Default: Story = {
  args: {
    reconnectToastMs: 3000,
  },
};

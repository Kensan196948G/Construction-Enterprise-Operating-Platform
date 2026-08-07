import type { Meta, StoryObj } from '@storybook/react';
import { SyncStatusBar } from '../SyncStatusBar';

const meta: Meta<typeof SyncStatusBar> = {
  title: 'Status/SyncStatusBar',
  component: SyncStatusBar,
};
export default meta;

type Story = StoryObj<typeof SyncStatusBar>;

export const Idle: Story = {
  args: {
    pendingCount: 0,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 3),
    state: 'idle',
    onSync: () => {},
  },
};

export const Syncing: Story = {
  args: {
    pendingCount: 7,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 15),
    state: 'syncing',
    onSync: () => {},
  },
};

export const Error: Story = {
  args: {
    pendingCount: 12,
    lastSyncedAt: new Date(Date.now() - 1000 * 60 * 60),
    state: 'error',
    errorMessage: '通信タイムアウト',
    onSync: () => {},
  },
};

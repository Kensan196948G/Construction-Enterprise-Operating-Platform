import type { Meta, StoryObj } from '@storybook/react';
import { TimelineLog } from '../TimelineLog';

const meta: Meta<typeof TimelineLog> = {
  title: 'KPI/TimelineLog',
  component: TimelineLog,
};
export default meta;

type Story = StoryObj<typeof TimelineLog>;

const now = Date.now();

export const Default: Story = {
  args: {
    entries: [
      {
        id: '1',
        timestamp: new Date(now),
        title: '配筋検査を完了',
        description: 'A棟 B1F 鉄筋径・ピッチ OK',
        actor: '佐藤 (品管)',
        severity: 'success',
      },
      {
        id: '2',
        timestamp: new Date(now - 1000 * 60 * 60),
        title: 'KY活動を記録',
        actor: '田中 (職長)',
        severity: 'info',
      },
      {
        id: '3',
        timestamp: new Date(now - 1000 * 60 * 60 * 3),
        title: 'ヒヤリハットを起票',
        description: '重機接近を AI 検出',
        actor: 'AI監視',
        severity: 'warning',
      },
      {
        id: '4',
        timestamp: new Date(now - 1000 * 60 * 60 * 8),
        title: '工程遅延アラート',
        description: '計画より2日遅延',
        severity: 'danger',
      },
    ],
  },
};

export const Empty: Story = {
  args: { entries: [] },
};

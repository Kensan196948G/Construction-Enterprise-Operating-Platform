import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from '../Layout';

const meta: Meta<typeof Layout> = {
  title: 'Foundation/Layout',
  component: Layout,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Layout>;

export const Default: Story = {
  args: {
    logo: <span className="font-bold">CDX</span>,
    sidebar: (
      <ul className="px-3 space-y-1 text-sm">
        <li className="py-2">ダッシュボード</li>
        <li className="py-2">現場一覧</li>
        <li className="py-2">資材管理</li>
        <li className="py-2">安全管理</li>
      </ul>
    ),
    header: <h1 className="text-base font-semibold">○○建設 - 本社</h1>,
    children: (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">メインコンテンツ</h2>
        <p className="text-slate-600">ここにルーティングされたページが入ります。</p>
      </div>
    ),
  },
};

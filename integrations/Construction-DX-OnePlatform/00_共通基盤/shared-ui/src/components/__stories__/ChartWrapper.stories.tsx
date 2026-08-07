import type { Meta, StoryObj } from '@storybook/react';
import { ChartWrapper } from '../ChartWrapper';

const meta: Meta<typeof ChartWrapper> = {
  title: 'Foundation/ChartWrapper',
  component: ChartWrapper,
};
export default meta;

type Story = StoryObj<typeof ChartWrapper>;

export const Line: Story = {
  args: {
    type: 'line',
    title: '出来高推移 (百万円)',
    xKey: 'month',
    data: [
      { month: '4月', planned: 80, actual: 75 },
      { month: '5月', planned: 100, actual: 105 },
      { month: '6月', planned: 120, actual: 118 },
      { month: '7月', planned: 140, actual: 145 },
    ],
    series: [
      { dataKey: 'planned', name: '計画' },
      { dataKey: 'actual', name: '実績' },
    ],
    height: 300,
  },
};

export const Bar: Story = {
  args: {
    ...Line.args!,
    type: 'bar',
    title: '月次出来高 (棒)',
  },
};

export const Pie: Story = {
  args: {
    type: 'pie',
    title: '工種別構成比',
    xKey: 'name',
    data: [
      { name: '土木', value: 45 },
      { name: '建築', value: 35 },
      { name: '電気', value: 20 },
    ],
    series: [{ dataKey: 'value', name: '構成比' }],
    height: 300,
  },
};

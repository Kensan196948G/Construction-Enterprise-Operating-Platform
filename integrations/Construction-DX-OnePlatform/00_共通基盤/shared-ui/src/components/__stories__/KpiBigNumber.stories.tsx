import type { Meta, StoryObj } from '@storybook/react';
import { TrendingUp } from 'lucide-react';
import { KpiBigNumber } from '../KpiBigNumber';

const meta: Meta<typeof KpiBigNumber> = {
  title: 'KPI/KpiBigNumber',
  component: KpiBigNumber,
};
export default meta;

type Story = StoryObj<typeof KpiBigNumber>;

export const Revenue: Story = {
  args: {
    label: '当期売上',
    value: '1.2億',
    unit: '円',
    deltaPercent: 8.4,
    caption: '前年同期比',
    icon: <TrendingUp size={16} />,
  },
};

export const SafetyIncidents: Story = {
  args: {
    label: '安全事故件数',
    value: 3,
    unit: '件',
    deltaPercent: -25,
    caption: '前月比',
    invertDeltaColor: true,
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-2xl">
      <KpiBigNumber label="売上" value="1.2億" unit="円" deltaPercent={8.4} />
      <KpiBigNumber label="粗利率" value="22.4" unit="%" deltaPercent={1.2} />
      <KpiBigNumber label="稼働現場" value={48} unit="件" deltaPercent={0} />
    </div>
  ),
};

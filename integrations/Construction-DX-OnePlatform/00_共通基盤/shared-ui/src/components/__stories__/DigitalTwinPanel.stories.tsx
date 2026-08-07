import type { Meta, StoryObj } from '@storybook/react';
import { DigitalTwinPanel } from '../DigitalTwinPanel';

const meta: Meta<typeof DigitalTwinPanel> = {
  title: 'BIM/DigitalTwin/DigitalTwinPanel',
  component: DigitalTwinPanel,
};
export default meta;

type Story = StoryObj<typeof DigitalTwinPanel>;

export const Bridge: Story = {
  args: {
    name: '○○橋 デジタルツイン',
    kind: 'bridge',
    twinId: 'DT-2026-0001',
    location: { lat: 35.6762, lng: 139.6503 },
    relatedProjectId: 'P-2026-014',
    relatedProjectName: '○○橋 補修工事',
    bimFormat: 'IFC',
    onOpenViewer: () => {},
    onOpenProject: () => {},
  },
};

export const Building: Story = {
  args: {
    name: 'B棟 オフィスビル',
    kind: 'building',
    twinId: 'DT-2026-0042',
    location: '東京都千代田区丸の内 1-1-1',
    relatedProjectName: 'B棟 新築工事',
    bimFormat: 'RVT',
  },
};

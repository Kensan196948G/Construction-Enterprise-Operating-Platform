import type { Meta, StoryObj } from '@storybook/react';
import { MapViewer } from '../MapViewer';

const meta: Meta<typeof MapViewer> = {
  title: 'Field/MapViewer',
  component: MapViewer,
  parameters: {
    docs: {
      description: {
        component:
          'Leaflet を遅延読み込みする現場マップ。利用側で `leaflet/dist/leaflet.css` を読み込んでください。',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MapViewer>;

export const TokyoSites: Story = {
  args: {
    engine: 'leaflet',
    center: [35.6762, 139.6503],
    zoom: 11,
    height: 480,
    markers: [
      { id: 1, lat: 35.6762, lng: 139.6503, label: '東京駅前現場' },
      { id: 2, lat: 35.6895, lng: 139.6917, label: '新宿西口現場' },
      { id: 3, lat: 35.6586, lng: 139.7454, label: '六本木現場' },
    ],
  },
};

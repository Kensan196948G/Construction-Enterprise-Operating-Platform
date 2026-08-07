import type { Meta, StoryObj } from '@storybook/react';
import { BimViewerThumb } from '../BimViewerThumb';

const meta: Meta<typeof BimViewerThumb> = {
  title: 'BIM/DigitalTwin/BimViewerThumb',
  component: BimViewerThumb,
};
export default meta;

type Story = StoryObj<typeof BimViewerThumb>;

export const Placeholder: Story = {
  args: {
    modelName: 'A棟 構造モデル',
    format: 'IFC',
    elementCount: 12450,
    onOpenViewer: () => alert('3D ビューアを起動'),
  },
};

export const WithThumbnail: Story = {
  args: {
    modelName: '○○橋 全体モデル',
    thumbnailSrc: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=480',
    format: 'glTF',
    elementCount: 8420,
    size: 'lg',
    onOpenViewer: () => {},
  },
};

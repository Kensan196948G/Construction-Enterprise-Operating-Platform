import type { Meta, StoryObj } from '@storybook/react';
import { PhotoCard } from '../PhotoCard';

const meta: Meta<typeof PhotoCard> = {
  title: 'Field/PhotoCard',
  component: PhotoCard,
};
export default meta;

type Story = StoryObj<typeof PhotoCard>;

export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=640',
    alt: '基礎工事 配筋検査',
    title: '配筋検査 (A棟 B1F)',
    takenAt: new Date(),
    location: { lat: 35.6762, lng: 139.6503 },
    tags: [
      { label: 'ヘルメット未着用', color: 'danger', confidence: 0.92 },
      { label: '配筋', color: 'secondary' },
      { label: 'AI検出', color: 'primary' },
    ],
  },
};

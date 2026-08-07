import type { Meta, StoryObj } from '@storybook/react';
import { FileUploader } from '../FileUploader';

const meta: Meta<typeof FileUploader> = {
  title: 'Foundation/FileUploader',
  component: FileUploader,
};
export default meta;

type Story = StoryObj<typeof FileUploader>;

export const Default: Story = {
  args: {
    multiple: true,
    maxSize: 20 * 1024 * 1024,
    accept: 'image/*,.pdf',
    label: 'ファイルをドラッグ&ドロップまたはクリックで選択',
  },
};

export const SingleImage: Story = {
  args: {
    multiple: false,
    accept: 'image/*',
    label: '現場写真をアップロード',
  },
};

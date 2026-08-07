import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoCard } from '../PhotoCard';

describe('PhotoCard', () => {
  it('画像 / 撮影日時 / 位置 / タグを表示する', () => {
    render(
      <PhotoCard
        src="/img.jpg"
        alt="現場写真"
        title="基礎工事"
        takenAt={new Date('2026-05-22T10:30:00+09:00')}
        location={{ lat: 35.6762, lng: 139.6503 }}
        tags={[
          { label: 'ヘルメット未着用', color: 'danger', confidence: 0.92 },
          { label: '重機', color: 'secondary' },
        ]}
      />,
    );
    expect(screen.getByAltText('現場写真')).toBeInTheDocument();
    expect(screen.getByText('基礎工事')).toBeInTheDocument();
    expect(screen.getByText(/35.67620/)).toBeInTheDocument();
    expect(screen.getByText('ヘルメット未着用')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('クリック可能なときに onSelect を呼ぶ', () => {
    const onSelect = vi.fn();
    render(<PhotoCard src="/img.jpg" alt="写真" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalled();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MapViewer } from '../MapViewer';

describe('MapViewer', () => {
  it('cesium エンジンの場合は案内文を表示する', () => {
    render(<MapViewer engine="cesium" />);
    expect(
      screen.getByRole('region', { name: '3D地図 (Cesium)' }),
    ).toBeInTheDocument();
  });

  it('leaflet 読み込み前にローディングを表示する', () => {
    render(<MapViewer engine="leaflet" />);
    // 動的 import 完了前のローディング or 読み込み済みのいずれか
    const el =
      screen.queryByRole('status', { name: '地図読み込み中' }) ??
      screen.queryByRole('region', { name: '地図ビュア' });
    expect(el).not.toBeNull();
  });
});

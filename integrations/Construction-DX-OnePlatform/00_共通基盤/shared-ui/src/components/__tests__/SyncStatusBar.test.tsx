import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncStatusBar } from '../SyncStatusBar';

describe('SyncStatusBar', () => {
  it('pending 件数と最終同期時刻を表示する', () => {
    const last = new Date(Date.now() - 60_000);
    render(<SyncStatusBar pendingCount={5} lastSyncedAt={last} />);
    expect(screen.getByText(/未同期 5 件/)).toBeInTheDocument();
    expect(screen.getByText(/最終同期:/)).toBeInTheDocument();
  });

  it('手動同期ボタンを呼び出す', () => {
    const onSync = vi.fn();
    render(<SyncStatusBar pendingCount={1} onSync={onSync} />);
    fireEvent.click(screen.getByRole('button', { name: '手動で同期' }));
    expect(onSync).toHaveBeenCalled();
  });
});

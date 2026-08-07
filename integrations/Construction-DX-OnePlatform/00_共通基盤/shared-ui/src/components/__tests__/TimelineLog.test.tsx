import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineLog } from '../TimelineLog';

describe('TimelineLog', () => {
  it('複数エントリと実行者を表示する', () => {
    render(
      <TimelineLog
        entries={[
          {
            id: '1',
            timestamp: new Date('2026-05-22T10:00:00'),
            title: '工事計画を承認',
            actor: '田中',
            severity: 'success',
          },
          {
            id: '2',
            timestamp: new Date('2026-05-22T09:00:00'),
            title: '資材発注',
            severity: 'info',
          },
        ]}
      />,
    );
    expect(screen.getByText('工事計画を承認')).toBeInTheDocument();
    expect(screen.getByText('by 田中')).toBeInTheDocument();
    expect(screen.getByText('資材発注')).toBeInTheDocument();
  });

  it('空配列のときに既定文言を出す', () => {
    render(<TimelineLog entries={[]} />);
    expect(screen.getByText('ログはありません')).toBeInTheDocument();
  });
});

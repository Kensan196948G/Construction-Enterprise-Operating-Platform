import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartWrapper } from '../ChartWrapper';

describe('ChartWrapper', () => {
  it('タイトルと figure ロールが描画される', () => {
    render(
      <ChartWrapper
        type="bar"
        title="月別出来高"
        xKey="month"
        data={[
          { month: '4月', amount: 100 },
          { month: '5月', amount: 120 },
        ]}
        series={[{ dataKey: 'amount', name: '出来高 (百万円)' }]}
        height={200}
      />,
    );
    expect(screen.getByText('月別出来高')).toBeInTheDocument();
    expect(screen.getByRole('figure', { name: '月別出来高' })).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiBigNumber } from '../KpiBigNumber';

describe('KpiBigNumber', () => {
  it('値・単位・前期比を表示する', () => {
    render(
      <KpiBigNumber label="売上" value="1.2億" unit="円" deltaPercent={5.4} caption="前年比" />,
    );
    expect(screen.getByRole('group', { name: /売上/ })).toBeInTheDocument();
    expect(screen.getByText('1.2億')).toBeInTheDocument();
    expect(screen.getByText('円')).toBeInTheDocument();
    expect(screen.getByLabelText(/前期比 \+5\.4%/)).toBeInTheDocument();
  });
});

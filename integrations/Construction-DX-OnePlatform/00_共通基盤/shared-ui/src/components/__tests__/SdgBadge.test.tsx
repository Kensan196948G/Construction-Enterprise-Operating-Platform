import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SdgBadge } from '../SdgBadge';

describe('SdgBadge', () => {
  it('ゴール番号とタイトルを aria-label に含む', () => {
    render(<SdgBadge goal={13} showTitle />);
    expect(
      screen.getByRole('img', { name: /SDGs 13: 気候変動に具体的な対策を/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('気候変動に具体的な対策を')).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalComplianceBadge } from '../LegalComplianceBadge';

describe('LegalComplianceBadge', () => {
  it('規格名と準拠状態を aria-label に出す', () => {
    render(<LegalComplianceBadge standard="iso9001" />);
    expect(screen.getByRole('status', { name: 'ISO 9001 準拠' })).toBeInTheDocument();
  });

  it('不適合状態を反映する', () => {
    render(<LegalComplianceBadge standard="iConstruction" status="nonCompliant" />);
    expect(
      screen.getByRole('status', { name: 'i-Construction 不適合' }),
    ).toBeInTheDocument();
  });
});

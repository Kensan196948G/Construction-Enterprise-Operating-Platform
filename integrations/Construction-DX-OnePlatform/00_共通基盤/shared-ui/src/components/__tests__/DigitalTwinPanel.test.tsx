import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DigitalTwinPanel } from '../DigitalTwinPanel';

describe('DigitalTwinPanel', () => {
  it('種別ラベル・Twin ID・関連工事を表示する', () => {
    render(
      <DigitalTwinPanel
        name="○○橋 デジタルツイン"
        kind="bridge"
        twinId="DT-2026-0001"
        location={{ lat: 35.6762, lng: 139.6503 }}
        relatedProjectId="P-001"
        relatedProjectName="○○橋 補修工事"
      />,
    );
    expect(screen.getByLabelText('DigitalTwin ○○橋 デジタルツイン')).toBeInTheDocument();
    expect(screen.getByText('橋梁')).toBeInTheDocument();
    expect(screen.getByText('DT-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('○○橋 補修工事')).toBeInTheDocument();
  });
});

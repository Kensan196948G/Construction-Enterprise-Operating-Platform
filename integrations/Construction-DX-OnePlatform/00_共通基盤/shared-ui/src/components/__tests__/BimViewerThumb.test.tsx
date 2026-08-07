import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BimViewerThumb } from '../BimViewerThumb';

describe('BimViewerThumb', () => {
  it('モデル名・要素数・フォーマットを表示する', () => {
    render(
      <BimViewerThumb
        modelName="A棟 構造モデル"
        format="IFC"
        elementCount={1234}
      />,
    );
    expect(screen.getByText('A棟 構造モデル')).toBeInTheDocument();
    expect(screen.getByText('IFC')).toBeInTheDocument();
    expect(screen.getByText(/1,234/)).toBeInTheDocument();
  });

  it('onOpenViewer が button として動作する', async () => {
    const fn = vi.fn();
    render(<BimViewerThumb modelName="B棟" onOpenViewer={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /B棟/ }));
    expect(fn).toHaveBeenCalledOnce();
  });
});

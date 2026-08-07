import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploader } from '../FileUploader';

// jsdom 用 URL.createObjectURL モック
if (typeof URL.createObjectURL === 'undefined') {
  // @ts-expect-error: jsdom polyfill
  URL.createObjectURL = () => 'blob:mock';
}
if (typeof URL.revokeObjectURL === 'undefined') {
  // @ts-expect-error: jsdom polyfill
  URL.revokeObjectURL = () => {};
}

describe('FileUploader', () => {
  it('既定のラベルが表示される', () => {
    render(<FileUploader />);
    expect(
      screen.getByText(/ファイルをドラッグ&ドロップ/),
    ).toBeInTheDocument();
  });

  it('サイズ超過エラーを表示する', () => {
    const onChange = vi.fn();
    const { container } = render(
      <FileUploader maxSize={10} onChange={onChange} />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const big = new File(['a'.repeat(100)], 'big.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [big] } });
    expect(screen.getByText(/サイズ超過/)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { FormBuilder, type FormField } from '../FormBuilder';

const schema = z.object({
  siteName: z.string().min(1, '現場名は必須です'),
  workers: z.number().min(0, '0以上の数値'),
});

const fields: FormField[] = [
  { name: 'siteName', label: '現場名', type: 'text', required: true },
  { name: 'workers', label: '作業員数', type: 'number' },
];

describe('FormBuilder', () => {
  it('ラベルが描画される', () => {
    render(<FormBuilder schema={schema} fields={fields} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/現場名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/作業員数/)).toBeInTheDocument();
  });

  it('バリデーションエラーを表示する', async () => {
    const onSubmit = vi.fn();
    render(<FormBuilder schema={schema} fields={fields} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: '送信' }));
    await waitFor(() => {
      expect(screen.getByText('現場名は必須です')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

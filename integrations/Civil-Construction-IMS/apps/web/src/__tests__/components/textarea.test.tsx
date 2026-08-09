import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('テキストエリアをレンダリングする', () => {
    render(<Textarea placeholder="テキストを入力" />);
    const textarea = screen.getByPlaceholderText('テキストを入力');
    expect(textarea).toBeTruthy();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('カスタムクラスを適用する', () => {
    render(<Textarea className="custom-class" data-testid="ta" />);
    const textarea = screen.getByTestId('ta');
    expect(textarea.className).toContain('custom-class');
    // shadcn/ui のデフォルトスタイルも保持
    expect(textarea.className).toContain('rounded-md');
  });

  it('入力値の変更を受け付ける', () => {
    render(<Textarea data-testid="ta" defaultValue="" />);
    const textarea = screen.getByTestId('ta') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '入力テスト' } });
    expect(textarea.value).toBe('入力テスト');
  });

  it('disabled 属性を設定できる', () => {
    render(<Textarea disabled data-testid="ta" />);
    const textarea = screen.getByTestId('ta') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });
});

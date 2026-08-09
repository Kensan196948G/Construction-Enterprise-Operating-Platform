import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('テキストを正しくレンダリングする', () => {
    render(<Label>テストラベル</Label>);
    expect(screen.getByText('テストラベル')).toBeTruthy();
  });

  it('htmlFor 属性を設定する', () => {
    render(<Label htmlFor="my-input">入力ラベル</Label>);
    const label = screen.getByText('入力ラベル');
    expect(label.getAttribute('for')).toBe('my-input');
  });

  it('カスタムクラスを適用する', () => {
    render(<Label className="custom-label">ラベル</Label>);
    const label = screen.getByText('ラベル');
    expect(label.className).toContain('custom-label');
    // shadcn/ui のデフォルトクラスも持つ
    expect(label.className).toContain('text-sm');
  });

  it('label タグとしてレンダリングされる', () => {
    render(<Label>ラベルタグ確認</Label>);
    const label = screen.getByText('ラベルタグ確認');
    expect(label.tagName.toLowerCase()).toBe('label');
  });
});

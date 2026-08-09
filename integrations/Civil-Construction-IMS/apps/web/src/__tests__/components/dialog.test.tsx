import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  it('初期状態ではダイアログコンテンツが非表示', () => {
    render(
      <Dialog>
        <DialogTrigger>開く</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ダイアログタイトル</DialogTitle>
            <DialogDescription>説明文</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText('ダイアログタイトル')).toBeNull();
  });

  it('トリガーをクリックするとダイアログが開く', () => {
    render(
      <Dialog>
        <DialogTrigger>開く</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>テストダイアログ</DialogTitle>
            <DialogDescription>ダイアログの説明</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    fireEvent.click(screen.getByText('開く'));
    expect(screen.getByText('テストダイアログ')).toBeTruthy();
    expect(screen.getByText('ダイアログの説明')).toBeTruthy();
  });

  it('open=true で直接開いた状態にできる', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>常時表示ダイアログ</DialogTitle>
            <DialogDescription>open prop で制御</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('常時表示ダイアログ')).toBeTruthy();
  });

  it('DialogFooter が子要素を描画する', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フッター確認</DialogTitle>
            <DialogDescription>フッターテスト</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button>キャンセル</button>
            <button>確認</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('キャンセル')).toBeTruthy();
    expect(screen.getByText('確認')).toBeTruthy();
  });

  it('閉じるボタン (X) がレンダリングされる', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>閉じるボタン確認</DialogTitle>
            <DialogDescription>X ボタンのテスト</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    // DialogContent は内部に「閉じる」スクリーンリーダーテキストを持つ
    const closeText = screen.getByText('閉じる');
    expect(closeText.classList.contains('sr-only')).toBe(true);
  });
});

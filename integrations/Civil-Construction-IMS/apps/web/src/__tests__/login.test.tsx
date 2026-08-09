import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// next-auth/react のモック (signIn 関数のみ)
const mockSignIn = jest.fn();
jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

// MOCK_MODE フラグのモック (既定は false)
let mockModeValue = false;
jest.mock('@/lib/mock/flag', () => ({
  get MOCK_MODE() {
    return mockModeValue;
  },
}));

// lucide-react はアイコン SVG を返すだけ — テストでは軽量スタブを使う
jest.mock('lucide-react', () => ({
  __esModule: true,
}));

import LoginPage from '@/app/(auth)/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockModeValue = false;
  });

  describe('共通要素', () => {
    it('サービス名ヘッダが表示される', () => {
      render(<LoginPage />);
      expect(screen.getByText(/Civil Construction IMS/)).toBeTruthy();
    });

    it('Microsoft アカウントログインボタンが表示される', () => {
      render(<LoginPage />);
      expect(screen.getByRole('button', { name: /Microsoft アカウントでログイン/ })).toBeTruthy();
    });

    it('Microsoft ログインボタンをクリックすると signIn("microsoft-entra-id") が呼ばれる', async () => {
      mockSignIn.mockResolvedValue(undefined);
      render(<LoginPage />);
      fireEvent.click(screen.getByRole('button', { name: /Microsoft アカウントでログイン/ }));
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('microsoft-entra-id', { callbackUrl: '/dashboard' });
      });
    });
  });

  describe('開発環境 (NODE_ENV=test, MOCK_MODE=false)', () => {
    it('メールアドレスフォームが表示される (開発環境はフォームを常に表示)', () => {
      render(<LoginPage />);
      // NODE_ENV=test → isDev=true → フォームを表示
      expect(screen.getByLabelText('メールアドレス')).toBeTruthy();
      expect(screen.getByLabelText('パスワード')).toBeTruthy();
    });

    it('初期状態ではフォームが空', () => {
      render(<LoginPage />);
      const emailInput = screen.getByLabelText('メールアドレス') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('パスワード') as HTMLInputElement;
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });

    it('ログインボタンをクリックすると signIn("credentials", ...) が呼ばれる', async () => {
      mockSignIn.mockResolvedValue({ error: null });
      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText('メールアドレス'), {
        target: { value: 'admin@civil-ims.local' },
      });
      fireEvent.change(screen.getByLabelText('パスワード'), {
        target: { value: 'Admin1234!' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'admin@civil-ims.local',
          password: 'Admin1234!',
          redirect: false,
        });
      });
    });

    it('signIn がエラーを返した場合はエラーメッセージを表示する', async () => {
      mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' });
      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText('メールアドレス'), {
        target: { value: 'bad@test.com' },
      });
      fireEvent.change(screen.getByLabelText('パスワード'), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

      await waitFor(() => {
        expect(screen.getByText('メールアドレスまたはパスワードが正しくありません')).toBeTruthy();
      });
    });
  });

  describe('MOCK_MODE=true (デモ環境)', () => {
    beforeEach(() => {
      mockModeValue = true;
    });

    it('デモ用資格情報が初期入力される', () => {
      render(<LoginPage />);
      const emailInput = screen.getByLabelText('メールアドレス') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('パスワード') as HTMLInputElement;
      expect(emailInput.value).toBe('admin@civil-ims.local');
      expect(passwordInput.value).toBe('demo');
    });

    it('デモ環境メッセージが表示される', () => {
      render(<LoginPage />);
      expect(screen.getByText(/デモ環境/)).toBeTruthy();
    });
  });
});

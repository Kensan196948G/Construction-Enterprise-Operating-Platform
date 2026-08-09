import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AssetsPage from '@/app/(dashboard)/assets/page';
import { apiClient } from '@/lib/api-client';

// apiClient をモック化（資産ページは /users/me を呼ばないため単純）
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn().mockResolvedValue({ id: 'new-1', assetNo: 'AST-999', name: '新規資産' }),
    put: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(undefined),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const MOCK_ASSET = {
  id: 'asset-1',
  assetNo: 'AST-2026-001',
  name: '油圧ショベル ZX200',
  assetType: 'EQUIPMENT',
  currentCondition: 'GOOD',
  status: 'ACTIVE',
};

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AssetsPage — CRUD ダイアログ', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue([]);
    mockPost.mockReset();
    mockPost.mockResolvedValue({ id: 'new-1', assetNo: 'AST-999', name: '新規資産' });
    mockPut.mockReset();
    mockPut.mockResolvedValue({});
    mockDelete.mockReset();
    mockDelete.mockResolvedValue(undefined);
  });

  describe('ページ見出し', () => {
    it('ページタイトルが表示される', () => {
      renderWithQueryClient(<AssetsPage />);
      expect(screen.getByText(/資産管理/)).toBeTruthy();
    });

    it('資産一覧カードが表示される', () => {
      renderWithQueryClient(<AssetsPage />);
      expect(screen.getByText('資産一覧')).toBeTruthy();
    });
  });

  describe('データなし状態', () => {
    it('ローディング中はスケルトンを表示する', () => {
      renderWithQueryClient(<AssetsPage />);
      const busy = document.querySelector('[aria-busy="true"]');
      expect(busy).toBeTruthy();
    });
  });

  describe('新規作成ダイアログ', () => {
    it('「新規作成」ボタンがレンダリングされる', () => {
      renderWithQueryClient(<AssetsPage />);
      expect(screen.getByText('新規作成')).toBeTruthy();
    });

    it('「新規作成」ボタンをクリックするとダイアログが開く', async () => {
      renderWithQueryClient(<AssetsPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('資産 新規作成')).toBeTruthy();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<AssetsPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('資産 新規作成')).toBeTruthy();
      });

      // 空のまま送信
      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText('資産番号・名称・種別は必須です')).toBeTruthy();
      });

      // バリデーション失敗時は API を呼ばない
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('資産番号のみ入力して送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<AssetsPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('資産 新規作成')).toBeTruthy();
      });

      fireEvent.change(screen.getByPlaceholderText('例: AST-2026-001'), {
        target: { value: 'AST-2026-099' },
      });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(screen.getByText('資産番号・名称・種別は必須です')).toBeTruthy();
      });
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('新規作成 — 成功パス', () => {
    it('フォームを正しく入力して送信すると apiClient.post が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<AssetsPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('資産 新規作成')).toBeTruthy());

      fireEvent.change(screen.getByPlaceholderText('例: AST-2026-001'), {
        target: { value: 'AST-2026-099' },
      });
      fireEvent.change(screen.getByPlaceholderText('例: 油圧ショベル ZX200'), {
        target: { value: '新規クレーン' },
      });
      // 種別 (select) を選択
      fireEvent.change(screen.getByLabelText('種別 *'), {
        target: { value: 'EQUIPMENT' },
      });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith(
          '/assets',
          expect.objectContaining({
            assetNo: 'AST-2026-099',
            name: '新規クレーン',
            assetType: 'EQUIPMENT',
          }),
        );
      });
    });
  });

  describe('編集 / 削除 — 成功パス', () => {
    beforeEach(() => {
      mockGet.mockImplementation((path: string) => {
        if (path === '/assets') return Promise.resolve([MOCK_ASSET]);
        return Promise.resolve([]);
      });
    });

    it('編集ダイアログで名称を変更して送信すると apiClient.put が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<AssetsPage />);

      // 資産一覧が表示されるまで待つ
      await waitFor(() => expect(screen.getByText('油圧ショベル ZX200')).toBeTruthy());

      // 編集ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: '油圧ショベル ZX200を編集' }));
      await waitFor(() => expect(screen.getByText('資産 編集')).toBeTruthy());

      // 名称を変更
      const nameInput = screen.getByLabelText(/名称/);
      fireEvent.change(nameInput, { target: { value: '油圧ショベル ZX240' } });

      fireEvent.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(mockPut).toHaveBeenCalledWith(
          `/assets/${MOCK_ASSET.id}`,
          expect.objectContaining({ name: '油圧ショベル ZX240' }),
        );
      });
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      renderWithQueryClient(<AssetsPage />);

      await waitFor(() => expect(screen.getByText('油圧ショベル ZX200')).toBeTruthy());

      // 削除ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: '油圧ショベル ZX200を削除' }));
      await waitFor(() => expect(screen.getByText('資産を削除')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(`/assets/${MOCK_ASSET.id}`);
      });
    });
  });
});

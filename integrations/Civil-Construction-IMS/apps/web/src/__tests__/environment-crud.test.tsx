import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EnvironmentPage from '@/app/(dashboard)/environment/page';
import { apiClient } from '@/lib/api-client';

// apiClient をモック化
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(() => Promise.resolve([])),
    post: jest
      .fn()
      .mockResolvedValue({ id: 'new-1', aspectName: '新規側面', significance: 'MINOR' }),
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

const MOCK_ASPECT = {
  id: 'aspect-1',
  aspectName: '建設廃棄物の排出',
  activity: '解体作業',
  significance: 'MAJOR',
  isLegallyRequired: true,
  reviewedAt: '2026-05-01T00:00:00.000Z',
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

describe('EnvironmentPage — CRUD ダイアログ', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue([]);
    mockPost.mockClear();
    mockPost.mockResolvedValue({ id: 'new-1', aspectName: '新規側面', significance: 'MINOR' });
    mockPut.mockClear();
    mockPut.mockResolvedValue({});
    mockDelete.mockClear();
    mockDelete.mockResolvedValue(undefined);
  });

  describe('ページ見出し', () => {
    it('ページタイトルが表示される', () => {
      renderWithQueryClient(<EnvironmentPage />);
      expect(screen.getByText(/環境管理/)).toBeTruthy();
    });

    it('環境側面一覧カードが表示される', () => {
      renderWithQueryClient(<EnvironmentPage />);
      expect(screen.getByText('環境側面一覧')).toBeTruthy();
    });
  });

  describe('データなし状態', () => {
    it('ローディング中はスケルトンを表示する', () => {
      renderWithQueryClient(<EnvironmentPage />);
      const busy = document.querySelector('[aria-busy="true"]');
      expect(busy).toBeTruthy();
    });
  });

  describe('新規作成ダイアログ', () => {
    it('「新規作成」ボタンがレンダリングされる', () => {
      renderWithQueryClient(<EnvironmentPage />);
      expect(screen.getByText('新規作成')).toBeTruthy();
    });

    it('「新規作成」ボタンをクリックするとダイアログが開く', async () => {
      renderWithQueryClient(<EnvironmentPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('環境側面 新規作成')).toBeTruthy();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<EnvironmentPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('環境側面 新規作成')).toBeTruthy();
      });

      // 空のまま送信
      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText('環境側面名称は必須です')).toBeTruthy();
      });
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('新規作成 — 成功パス', () => {
    it('フォームを正しく入力して送信すると apiClient.post が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<EnvironmentPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('環境側面 新規作成')).toBeTruthy());

      fireEvent.change(screen.getByPlaceholderText('例: 建設廃棄物の排出'), {
        target: { value: '騒音・振動' },
      });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith(
          '/environment/aspects',
          expect.objectContaining({
            aspectName: '騒音・振動',
            significance: 'MINOR',
            isLegallyRequired: false,
          }),
        );
      });
    });
  });

  describe('編集 / 削除 — 成功パス', () => {
    beforeEach(() => {
      mockGet.mockImplementation((path: string) => {
        if (path === '/environment/aspects') return Promise.resolve([MOCK_ASPECT]);
        return Promise.resolve([]);
      });
    });

    it('編集ダイアログで環境側面名称を変更して送信すると apiClient.put が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<EnvironmentPage />);

      // 一覧が表示されるまで待つ
      await waitFor(() => expect(screen.getByText('建設廃棄物の排出')).toBeTruthy());

      // 編集ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: '建設廃棄物の排出を編集' }));
      await waitFor(() => expect(screen.getByText('環境側面 編集')).toBeTruthy());

      // 環境側面名称を変更
      const nameInput = screen.getByLabelText(/環境側面名称/);
      fireEvent.change(nameInput, { target: { value: '産業廃棄物の排出' } });

      fireEvent.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(mockPut).toHaveBeenCalledWith(
          `/environment/aspects/${MOCK_ASPECT.id}`,
          expect.objectContaining({ aspectName: '産業廃棄物の排出' }),
        );
      });
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      renderWithQueryClient(<EnvironmentPage />);

      await waitFor(() => expect(screen.getByText('建設廃棄物の排出')).toBeTruthy());

      // 削除ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: '建設廃棄物の排出を削除' }));
      await waitFor(() => expect(screen.getByText('環境側面を削除')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(`/environment/aspects/${MOCK_ASPECT.id}`);
      });
    });
  });
});

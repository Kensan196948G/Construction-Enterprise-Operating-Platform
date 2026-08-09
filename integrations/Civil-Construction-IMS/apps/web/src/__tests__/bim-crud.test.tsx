import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BimPage from '@/app/(dashboard)/bim/page';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(() => Promise.resolve([])),
    post: jest.fn().mockResolvedValue({
      id: 'new-1',
      title: '○○橋梁工事 BIM実行計画書 v1',
      version: '1.0',
      status: 'DRAFT',
      namingConvention: '[Proj]-[Disc]-[Type]',
      projectId: 'proj-1',
    }),
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

const MOCK_PLAN = {
  id: 'bep-1',
  title: '○○橋梁工事 BIM実行計画書 v1',
  version: '1.0',
  status: 'DRAFT',
  namingConvention: '[Proj]-[Disc]-[Type]-[Zone]-[Level]',
  projectId: 'proj-1',
  updatedAt: '2025-10-01T00:00:00.000Z',
};

const MOCK_PROJECT = { id: 'proj-1', name: '○○橋梁工事' };

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('BimPage — CRUD ダイアログ', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation((path: string) => {
      if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
      return Promise.resolve([]);
    });
    mockPost.mockClear();
    mockPost.mockResolvedValue({ id: 'new-1', title: '新規BEP', version: '1.0', status: 'DRAFT', namingConvention: '', projectId: 'proj-1' });
    mockPut.mockClear();
    mockPut.mockResolvedValue({});
    mockDelete.mockClear();
    mockDelete.mockResolvedValue(undefined);
  });

  describe('ページ見出し', () => {
    it('ページタイトルが表示される', () => {
      renderWithQueryClient(<BimPage />);
      expect(screen.getByText(/BIM情報/)).toBeTruthy();
    });

    it('BEP一覧カードが表示される', () => {
      renderWithQueryClient(<BimPage />);
      expect(screen.getByText('BIM実行計画 (BEP) 一覧')).toBeTruthy();
    });

    it('「新規作成」ボタンがレンダリングされる', () => {
      renderWithQueryClient(<BimPage />);
      expect(screen.getByText('新規作成')).toBeTruthy();
    });
  });

  describe('データなし状態', () => {
    it('ローディング中はスケルトンを表示する', () => {
      renderWithQueryClient(<BimPage />);
      const busy = document.querySelector('[aria-busy="true"]');
      expect(busy).toBeTruthy();
    });

    it('データが空のときは空状態メッセージを表示する', async () => {
      renderWithQueryClient(<BimPage />);
      await waitFor(() => {
        expect(screen.getByText('BIM実行計画がまだ登録されていません')).toBeTruthy();
      });
    });
  });

  describe('新規作成ダイアログ', () => {
    it('「新規作成」ボタンをクリックするとダイアログが開く', async () => {
      renderWithQueryClient(<BimPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('BIM実行計画を新規作成')).toBeTruthy();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<BimPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('BIM実行計画を新規作成')).toBeTruthy();
      });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(screen.getByText('プロジェクトとタイトルは必須です。')).toBeTruthy();
      });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('フォームを正しく入力して送信すると apiClient.post が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<BimPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('BIM実行計画を新規作成')).toBeTruthy());

      // プロジェクト選択待ち (プロジェクト一覧がロードされる)
      await waitFor(() => {
        const select = screen.getByLabelText('プロジェクト *');
        expect(select).toBeTruthy();
      });

      fireEvent.change(screen.getByLabelText('プロジェクト *'), {
        target: { value: 'proj-1' },
      });
      fireEvent.change(screen.getByPlaceholderText('○○橋梁工事 BIM実行計画書 v1'), {
        target: { value: '新規BEP' },
      });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith(
          '/bim/beps',
          expect.objectContaining({
            projectId: 'proj-1',
            title: '新規BEP',
          }),
        );
      });
    });
  });

  describe('編集 / 削除 — 成功パス', () => {
    beforeEach(() => {
      mockGet.mockImplementation((path: string) => {
        if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
        if (path === '/bim/beps') return Promise.resolve([MOCK_PLAN]);
        return Promise.resolve([]);
      });
    });

    it('一覧が表示される', async () => {
      renderWithQueryClient(<BimPage />);
      await waitFor(() => expect(screen.getByText('○○橋梁工事 BIM実行計画書 v1')).toBeTruthy());
    });

    it('編集ダイアログを開いて送信すると apiClient.put が呼ばれる', async () => {
      renderWithQueryClient(<BimPage />);
      await waitFor(() => expect(screen.getByText('○○橋梁工事 BIM実行計画書 v1')).toBeTruthy());

      const editBtns = screen.getAllByRole('button', { name: '編集' });
      fireEvent.click(editBtns[0]);

      await waitFor(() => expect(screen.getByText('BEP を編集')).toBeTruthy());

      const titleInput = screen.getByPlaceholderText('○○橋梁工事 BIM実行計画書 v1');
      fireEvent.change(titleInput, { target: { value: '更新後BEPタイトル' } });

      fireEvent.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(mockPut).toHaveBeenCalledWith(
          `/bim/beps/${MOCK_PLAN.id}`,
          expect.objectContaining({ title: '更新後BEPタイトル' }),
        );
      });
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      renderWithQueryClient(<BimPage />);
      await waitFor(() => expect(screen.getByText('○○橋梁工事 BIM実行計画書 v1')).toBeTruthy());

      const deleteBtns = screen.getAllByRole('button', { name: '削除' });
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => expect(screen.getByText('BEP を削除しますか？')).toBeTruthy());

      const allDeleteBtns = screen.getAllByRole('button', { name: '削除' });
      fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(`/bim/beps/${MOCK_PLAN.id}`);
      });
    });
  });
});

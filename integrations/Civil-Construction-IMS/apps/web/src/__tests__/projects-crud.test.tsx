import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectsPage from '@/app/(dashboard)/projects/page';
import { apiClient } from '@/lib/api-client';

// apiClient をモック化
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn((path) => {
      if (path === '/users/me') {
        return Promise.resolve({ id: 'user-1', organizationId: 'org-1' });
      }
      return Promise.resolve([]);
    }),
    post: jest.fn().mockResolvedValue({ id: 'new-1', code: 'P-001', name: 'テスト案件', status: 'DRAFT' }),
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

const MOCK_PROJECT = {
  id: 'proj-1',
  code: 'P-001',
  name: 'テスト橋梁工事',
  clientName: '○○市役所',
  status: 'OPEN',
  startDate: '2026-01-15T00:00:00.000Z',
};

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('ProjectsPage — CRUD ダイアログ', () => {
  describe('新規作成ダイアログ', () => {
    it('「新規作成」ボタンがレンダリングされる', () => {
      renderWithQueryClient(<ProjectsPage />);
      expect(screen.getByText('新規作成')).toBeTruthy();
    });

    it('「新規作成」ボタンをクリックするとダイアログが開く', async () => {
      renderWithQueryClient(<ProjectsPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('工事案件 新規作成')).toBeTruthy();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<ProjectsPage />);

      // ダイアログを開く
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('工事案件 新規作成')).toBeTruthy();
      });

      // organizationId がロードされ submit ボタンが有効になるまで待つ
      await waitFor(() => expect(screen.getByRole('button', { name: '作成' })).not.toBeDisabled());

      // 空のまま送信
      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText('案件コードと案件名は必須です')).toBeTruthy();
      });
    });

    it('案件コードのみ入力して送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<ProjectsPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('工事案件 新規作成')).toBeTruthy();
      });

      // organizationId がロードされ submit ボタンが有効になるまで待つ
      await waitFor(() => expect(screen.getByRole('button', { name: '作成' })).not.toBeDisabled());

      // 案件コードだけ入力
      const codeInput = screen.getByPlaceholderText('例: P-2026-001');
      fireEvent.change(codeInput, { target: { value: 'P-001' } });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(screen.getByText('案件コードと案件名は必須です')).toBeTruthy();
      });
    });
  });

  describe('ページ見出し', () => {
    it('ページタイトルが表示される', () => {
      renderWithQueryClient(<ProjectsPage />);
      expect(screen.getByText(/工事案件管理/)).toBeTruthy();
    });

    it('工事案件一覧カードが表示される', () => {
      renderWithQueryClient(<ProjectsPage />);
      expect(screen.getByText('工事案件一覧')).toBeTruthy();
    });
  });

  describe('データなし状態', () => {
    it('ローディング中はスケルトンを表示する', () => {
      renderWithQueryClient(<ProjectsPage />);
      // isPending=true の初期状態
      const busy = document.querySelector('[aria-busy="true"]');
      expect(busy).toBeTruthy();
    });
  });

  describe('新規作成 — 成功パス', () => {
    beforeEach(() => {
      mockPost.mockClear();
      mockPost.mockResolvedValue({ id: 'new-1', code: 'P-999', name: '新規案件', status: 'DRAFT' });
    });

    it('フォームを正しく入力して送信すると apiClient.post が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<ProjectsPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('工事案件 新規作成')).toBeTruthy());

      // organizationId がロードされるまで submit ボタンが有効になるのを待つ
      await waitFor(() => expect(screen.getByRole('button', { name: '作成' })).not.toBeDisabled());

      fireEvent.change(screen.getByPlaceholderText('例: P-2026-001'), { target: { value: 'P-999' } });
      fireEvent.change(screen.getByPlaceholderText('例: ○○橋梁補修工事'), { target: { value: '新規案件' } });
      fireEvent.change(screen.getByPlaceholderText('例: ○○市役所'), { target: { value: '発注者名' } });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith('/projects', expect.objectContaining({
          code: 'P-999',
          name: '新規案件',
          clientName: '発注者名',
          organizationId: 'org-1',
        }));
      });
    });
  });

  describe('編集 / 削除 — 成功パス', () => {
    beforeEach(() => {
      mockGet.mockImplementation((path) => {
        if (path === '/users/me') return Promise.resolve({ id: 'user-1', organizationId: 'org-1' });
        if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
        return Promise.resolve([]);
      });
      mockPut.mockClear();
      mockPut.mockResolvedValue({});
      mockDelete.mockClear();
      mockDelete.mockResolvedValue(undefined);
    });

    afterEach(() => {
      mockGet.mockImplementation((path) => {
        if (path === '/users/me') return Promise.resolve({ id: 'user-1', organizationId: 'org-1' });
        return Promise.resolve([]);
      });
    });

    it('編集ダイアログで案件名を変更して送信すると apiClient.put が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<ProjectsPage />);

      // プロジェクト一覧が表示されるまで待つ
      await waitFor(() => expect(screen.getByText('テスト橋梁工事')).toBeTruthy());

      // 編集ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: 'テスト橋梁工事を編集' }));
      await waitFor(() => expect(screen.getByText('工事案件 編集')).toBeTruthy());

      // 案件名を変更
      const nameInput = screen.getByLabelText(/案件名/);
      fireEvent.change(nameInput, { target: { value: '修正後橋梁工事' } });

      fireEvent.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(mockPut).toHaveBeenCalledWith(`/projects/${MOCK_PROJECT.id}`, expect.objectContaining({
          name: '修正後橋梁工事',
        }));
      });
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      renderWithQueryClient(<ProjectsPage />);

      await waitFor(() => expect(screen.getByText('テスト橋梁工事')).toBeTruthy());

      // 削除ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: 'テスト橋梁工事を削除' }));
      await waitFor(() => expect(screen.getByText('工事案件を削除')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(`/projects/${MOCK_PROJECT.id}`);
      });
    });
  });
});

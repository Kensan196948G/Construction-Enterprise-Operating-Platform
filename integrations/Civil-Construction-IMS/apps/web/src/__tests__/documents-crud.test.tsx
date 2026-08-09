import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentsPage from '@/app/(dashboard)/documents/page';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn((path) => {
      if (path === '/projects') return Promise.resolve([]);
      if (path === '/documents') return Promise.resolve([]);
      if (path === '/documents/categories/all') return Promise.resolve([]);
      return Promise.resolve([]);
    }),
    post: jest.fn().mockResolvedValue({
      id: 'doc-1',
      documentNo: 'DOC-2026-001',
      title: 'テスト手順書',
      status: 'DRAFT',
      currentVersion: '1',
      createdAt: '2026-06-01T00:00:00.000Z',
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

const MOCK_DOC = {
  id: 'doc-1',
  documentNo: 'DOC-2026-001',
  title: 'コンクリート打設手順書',
  status: 'DRAFT',
  currentVersion: '1',
  createdAt: '2026-06-01T00:00:00.000Z',
};

const MOCK_CATEGORY = {
  id: 'cat-1',
  code: 'PROC',
  name: '手順書',
};

const MOCK_PROJECT = {
  id: 'proj-1',
  code: 'P-001',
  name: 'テスト橋梁工事',
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

describe('DocumentsPage — CRUD ダイアログ', () => {
  beforeEach(() => {
    mockGet.mockImplementation((path) => {
      if (path === '/projects') return Promise.resolve([]);
      if (path === '/documents') return Promise.resolve([]);
      if (path === '/documents/categories/all') return Promise.resolve([]);
      return Promise.resolve([]);
    });
  });

  describe('ページ見出し', () => {
    it('文書管理タイトルが表示される', () => {
      renderWithQueryClient(<DocumentsPage />);
      expect(screen.getByText(/文書管理/)).toBeTruthy();
    });

    it('文書一覧カードが表示される', () => {
      renderWithQueryClient(<DocumentsPage />);
      expect(screen.getByText('文書一覧')).toBeTruthy();
    });

    it('新規作成ボタンが表示される', () => {
      renderWithQueryClient(<DocumentsPage />);
      expect(screen.getByText('新規作成')).toBeTruthy();
    });
  });

  describe('新規作成ダイアログ', () => {
    it('「新規作成」ボタンをクリックするとダイアログが開く', async () => {
      renderWithQueryClient(<DocumentsPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('文書 新規作成')).toBeTruthy();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<DocumentsPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('文書 新規作成')).toBeTruthy());

      // submit ボタンはカテゴリ未選択で disabled のため、ボタンが属するフォームを直接 submit
      const submitButton = screen.getByRole('button', { name: '作成' });
      const form = submitButton.closest('form');
      if (!form) throw new Error('作成フォームが見つかりません');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText('文書番号・タイトル・カテゴリは必須です')).toBeTruthy();
      });
    });

    it('キャンセルボタンでダイアログが閉じる', async () => {
      renderWithQueryClient(<DocumentsPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('文書 新規作成')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

      await waitFor(() => {
        expect(screen.queryByText('文書 新規作成')).toBeNull();
      });
    });

    it('文書番号フィールドが表示される', async () => {
      renderWithQueryClient(<DocumentsPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('文書 新規作成')).toBeTruthy());

      expect(screen.getByPlaceholderText('例: DOC-2026-001')).toBeTruthy();
    });
  });

  describe('新規作成 — 成功パス', () => {
    beforeEach(() => {
      mockPost.mockClear();
      mockPost.mockResolvedValue(MOCK_DOC);
      mockGet.mockImplementation((path) => {
        if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
        if (path === '/documents') return Promise.resolve([]);
        if (path === '/documents/categories/all') return Promise.resolve([MOCK_CATEGORY]);
        return Promise.resolve([]);
      });
    });

    it('フォームを正しく入力して送信すると apiClient.post が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<DocumentsPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('文書 新規作成')).toBeTruthy());

      fireEvent.change(screen.getByPlaceholderText('例: DOC-2026-001'), { target: { value: 'DOC-2026-001' } });
      fireEvent.change(screen.getByPlaceholderText('例: コンクリート打設手順書'), { target: { value: 'テスト手順書' } });

      // カテゴリオプションが DOM に描画されるまで待ってから選択
      await waitFor(() => expect(screen.getByText('PROC — 手順書')).toBeTruthy());
      const categorySelect = screen.getByLabelText(/カテゴリ/);
      fireEvent.change(categorySelect, { target: { value: MOCK_CATEGORY.id } });

      // 全フィールドが揃い submit ボタンが有効になるまで待つ
      await waitFor(() => expect(screen.getByRole('button', { name: '作成' })).not.toBeDisabled());

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith('/documents', expect.objectContaining({
          documentNo: 'DOC-2026-001',
          title: 'テスト手順書',
          categoryId: MOCK_CATEGORY.id,
        }));
      });
    });
  });

  describe('編集 / 削除 — テーブル行', () => {
    beforeEach(() => {
      mockGet.mockImplementation((path) => {
        if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
        if (path === '/documents') return Promise.resolve([MOCK_DOC]);
        if (path === '/documents/categories/all') return Promise.resolve([MOCK_CATEGORY]);
        return Promise.resolve([]);
      });
      mockPut.mockClear();
      mockPut.mockResolvedValue({});
      mockDelete.mockClear();
      mockDelete.mockResolvedValue(undefined);
    });

    it('文書一覧に文書タイトルが表示される', async () => {
      renderWithQueryClient(<DocumentsPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設手順書')).toBeTruthy());
    });

    it('文書番号が表示される', async () => {
      renderWithQueryClient(<DocumentsPage />);
      await waitFor(() => expect(screen.getByText('DOC-2026-001')).toBeTruthy());
    });

    it('編集ボタンをクリックすると編集ダイアログが開く', async () => {
      renderWithQueryClient(<DocumentsPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設手順書')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート打設手順書を編集' }));
      await waitFor(() => expect(screen.getByText('文書 編集')).toBeTruthy());
    });

    it('編集ダイアログでタイトルを変更して送信すると apiClient.put が呼ばれる', async () => {
      renderWithQueryClient(<DocumentsPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設手順書')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート打設手順書を編集' }));
      await waitFor(() => expect(screen.getByText('文書 編集')).toBeTruthy());

      const titleInput = screen.getByDisplayValue('コンクリート打設手順書');
      fireEvent.change(titleInput, { target: { value: '改訂版打設手順書' } });

      fireEvent.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(mockPut).toHaveBeenCalledWith(`/documents/${MOCK_DOC.id}`, expect.objectContaining({
          title: '改訂版打設手順書',
        }));
      });
    });

    it('削除ボタンをクリックすると削除ダイアログが開く', async () => {
      renderWithQueryClient(<DocumentsPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設手順書')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート打設手順書を削除' }));
      await waitFor(() => expect(screen.getByText('文書を削除')).toBeTruthy());
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      renderWithQueryClient(<DocumentsPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設手順書')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート打設手順書を削除' }));
      await waitFor(() => expect(screen.getByText('文書を削除')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(`/documents/${MOCK_DOC.id}`);
      });
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はスケルトンを表示する', () => {
      renderWithQueryClient(<DocumentsPage />);
      const busy = document.querySelector('[aria-busy="true"]');
      expect(busy).toBeTruthy();
    });
  });
});

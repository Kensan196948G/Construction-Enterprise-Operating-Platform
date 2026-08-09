import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QualityPage from '@/app/(dashboard)/quality/page';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn((path) => {
      if (path === '/projects') return Promise.resolve([]);
      return Promise.resolve([]);
    }),
    post: jest.fn().mockResolvedValue({
      id: 'plan-1',
      planNo: 'QP-2026-001',
      title: '品質計画書',
      status: 'DRAFT',
      version: 1,
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
  id: 'plan-1',
  planNo: 'QP-2026-001',
  title: 'コンクリート工事品質計画書',
  status: 'DRAFT',
  version: 1,
  updatedAt: '2026-06-01T00:00:00.000Z',
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

describe('QualityPage — CRUD ダイアログ', () => {
  beforeEach(() => {
    mockGet.mockImplementation((path) => {
      if (path === '/projects') return Promise.resolve([]);
      if (path === '/quality/plans') return Promise.resolve([]);
      return Promise.resolve([]);
    });
  });

  describe('ページ見出し', () => {
    it('品質管理タイトルが表示される', () => {
      renderWithQueryClient(<QualityPage />);
      expect(screen.getByText(/品質管理/)).toBeTruthy();
    });

    it('品質計画一覧カードが表示される', () => {
      renderWithQueryClient(<QualityPage />);
      expect(screen.getByText('品質計画一覧')).toBeTruthy();
    });

    it('新規作成ボタンが表示される', () => {
      renderWithQueryClient(<QualityPage />);
      expect(screen.getByText('新規作成')).toBeTruthy();
    });
  });

  describe('新規作成ダイアログ', () => {
    it('「新規作成」ボタンをクリックするとダイアログが開く', async () => {
      renderWithQueryClient(<QualityPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('品質計画 新規作成')).toBeTruthy();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<QualityPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('品質計画 新規作成')).toBeTruthy());

      // submit ボタンは projectId 未選択で disabled のため、ボタンが属するフォームを直接 submit
      const submitButton = screen.getByRole('button', { name: '作成' });
      const form = submitButton.closest('form');
      if (!form) throw new Error('作成フォームが見つかりません');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText('タイトルと対象案件は必須です')).toBeTruthy();
      });
    });

    it('キャンセルボタンでダイアログが閉じる', async () => {
      renderWithQueryClient(<QualityPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('品質計画 新規作成')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

      await waitFor(() => {
        expect(screen.queryByText('品質計画 新規作成')).toBeNull();
      });
    });
  });

  describe('新規作成 — 成功パス', () => {
    beforeEach(() => {
      mockPost.mockClear();
      mockPost.mockResolvedValue(MOCK_PLAN);
      mockGet.mockImplementation((path) => {
        if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
        if (path === '/quality/plans') return Promise.resolve([]);
        return Promise.resolve([]);
      });
    });

    it('フォームを正しく入力して送信すると apiClient.post が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<QualityPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('品質計画 新規作成')).toBeTruthy());

      // 案件オプションが DOM に描画されるまで待ってから選択
      await waitFor(() => expect(screen.getByText('P-001 — テスト橋梁工事')).toBeTruthy());
      const projectSelect = screen.getByLabelText(/対象案件/);
      fireEvent.change(projectSelect, { target: { value: MOCK_PROJECT.id } });

      // タイトル入力
      const titleInput = screen.getByPlaceholderText('例: コンクリート工事品質計画書');
      fireEvent.change(titleInput, { target: { value: 'テスト品質計画書' } });

      // projectId がセットされ submit ボタンが有効になるまで待つ
      await waitFor(() => expect(screen.getByRole('button', { name: '作成' })).not.toBeDisabled());

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith('/quality/plans', expect.objectContaining({
          title: 'テスト品質計画書',
          projectId: MOCK_PROJECT.id,
        }));
      });
    });
  });

  describe('編集 / 削除 — テーブル行', () => {
    beforeEach(() => {
      mockGet.mockImplementation((path) => {
        if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
        if (path === '/quality/plans') return Promise.resolve([MOCK_PLAN]);
        return Promise.resolve([]);
      });
      mockPut.mockClear();
      mockPut.mockResolvedValue({});
      mockDelete.mockClear();
      mockDelete.mockResolvedValue(undefined);
    });

    it('計画一覧に品質計画が表示される', async () => {
      renderWithQueryClient(<QualityPage />);
      await waitFor(() => expect(screen.getByText('コンクリート工事品質計画書')).toBeTruthy());
    });

    it('編集ボタンをクリックすると編集ダイアログが開く', async () => {
      renderWithQueryClient(<QualityPage />);
      await waitFor(() => expect(screen.getByText('コンクリート工事品質計画書')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート工事品質計画書を編集' }));
      await waitFor(() => expect(screen.getByText('品質計画 編集')).toBeTruthy());
    });

    it('編集ダイアログでタイトルを変更して送信すると apiClient.put が呼ばれる', async () => {
      renderWithQueryClient(<QualityPage />);
      await waitFor(() => expect(screen.getByText('コンクリート工事品質計画書')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート工事品質計画書を編集' }));
      await waitFor(() => expect(screen.getByText('品質計画 編集')).toBeTruthy());

      const titleInput = screen.getByLabelText(/タイトル/);
      fireEvent.change(titleInput, { target: { value: '修正後品質計画書' } });

      fireEvent.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(mockPut).toHaveBeenCalledWith(`/quality/plans/${MOCK_PLAN.id}`, expect.objectContaining({
          title: '修正後品質計画書',
        }));
      });
    });

    it('削除ボタンをクリックすると削除ダイアログが開く', async () => {
      renderWithQueryClient(<QualityPage />);
      await waitFor(() => expect(screen.getByText('コンクリート工事品質計画書')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート工事品質計画書を削除' }));
      await waitFor(() => expect(screen.getByText('品質計画を削除')).toBeTruthy());
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      renderWithQueryClient(<QualityPage />);
      await waitFor(() => expect(screen.getByText('コンクリート工事品質計画書')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート工事品質計画書を削除' }));
      await waitFor(() => expect(screen.getByText('品質計画を削除')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(`/quality/plans/${MOCK_PLAN.id}`);
      });
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はスケルトンを表示する', () => {
      renderWithQueryClient(<QualityPage />);
      const busy = document.querySelector('[aria-busy="true"]');
      expect(busy).toBeTruthy();
    });
  });
});

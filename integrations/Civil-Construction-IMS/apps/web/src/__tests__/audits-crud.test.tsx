import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuditsPage from '@/app/(dashboard)/audits/page';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(() => Promise.resolve([])),
    post: jest.fn().mockResolvedValue({
      id: 'new-1',
      planNo: 'AP-2025-001',
      title: '品質管理内部監査',
      isoStandard: '9001',
      status: 'PLANNED',
      scheduledAt: '2025-10-01T09:00:00.000Z',
    }),
    patch: jest.fn().mockResolvedValue({}),
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
const mockPatch = apiClient.patch as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const MOCK_PLAN = {
  id: 'plan-1',
  planNo: 'AP-2025-001',
  title: '2025年度 品質管理システム内部監査',
  isoStandard: '9001',
  status: 'PLANNED' as const,
  scheduledAt: '2025-10-01T09:00:00.000Z',
  scope: '品質管理部門',
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

describe('AuditsPage — CRUD ダイアログ', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue([]);
    mockPost.mockClear();
    mockPost.mockResolvedValue({ id: 'new-1', planNo: 'AP-2025-001', title: '新規監査', isoStandard: '9001', status: 'PLANNED', scheduledAt: '2025-10-01T09:00:00.000Z' });
    mockPatch.mockClear();
    mockPatch.mockResolvedValue({});
    mockDelete.mockClear();
    mockDelete.mockResolvedValue(undefined);
  });

  describe('ページ見出し', () => {
    it('ページタイトルが表示される', () => {
      renderWithQueryClient(<AuditsPage />);
      expect(screen.getByText(/監査・是正/)).toBeTruthy();
    });

    it('監査計画一覧カードが表示される', () => {
      renderWithQueryClient(<AuditsPage />);
      expect(screen.getByText('監査計画一覧')).toBeTruthy();
    });

    it('「新規作成」ボタンがレンダリングされる', () => {
      renderWithQueryClient(<AuditsPage />);
      expect(screen.getByText('新規作成')).toBeTruthy();
    });
  });

  describe('新規作成ダイアログ', () => {
    it('「新規作成」ボタンをクリックするとダイアログが開く', async () => {
      renderWithQueryClient(<AuditsPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('監査計画を新規作成')).toBeTruthy();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<AuditsPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('監査計画を新規作成')).toBeTruthy();
      });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(screen.getByText('計画番号・タイトル・予定日は必須です。')).toBeTruthy();
      });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('フォームを正しく入力して送信すると apiClient.post が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<AuditsPage />);

      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('監査計画を新規作成')).toBeTruthy());

      fireEvent.change(screen.getByPlaceholderText('AP-2025-001'), {
        target: { value: 'AP-2025-001' },
      });
      fireEvent.change(screen.getByPlaceholderText('2025年度 品質管理システム内部監査'), {
        target: { value: '品質管理内部監査' },
      });
      fireEvent.change(screen.getByLabelText('実施予定日 *'), {
        target: { value: '2025-10-01' },
      });

      fireEvent.click(screen.getByRole('button', { name: '作成' }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith(
          '/audit/plans',
          expect.objectContaining({
            planNo: 'AP-2025-001',
            title: '品質管理内部監査',
            isoStandard: '9001',
          }),
        );
      });
    });
  });

  describe('編集 / 削除 — 成功パス', () => {
    beforeEach(() => {
      mockGet.mockResolvedValue([MOCK_PLAN]);
    });

    it('一覧が表示される', async () => {
      renderWithQueryClient(<AuditsPage />);
      await waitFor(() => expect(screen.getByText('2025年度 品質管理システム内部監査')).toBeTruthy());
    });

    it('編集ダイアログを開いて送信すると apiClient.patch が呼ばれる', async () => {
      renderWithQueryClient(<AuditsPage />);
      await waitFor(() => expect(screen.getByText('2025年度 品質管理システム内部監査')).toBeTruthy());

      const editBtns = screen.getAllByRole('button', { name: '編集' });
      fireEvent.click(editBtns[0]);

      await waitFor(() => expect(screen.getByText('監査計画を編集')).toBeTruthy());

      // タイトル変更
      const titleInput = screen.getByPlaceholderText('2025年度 品質管理システム内部監査');
      fireEvent.change(titleInput, { target: { value: '更新後タイトル' } });

      fireEvent.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPatch).toHaveBeenCalledTimes(1);
        expect(mockPatch).toHaveBeenCalledWith(
          `/audit/plans/${MOCK_PLAN.id}`,
          expect.objectContaining({ title: '更新後タイトル' }),
        );
      });
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      renderWithQueryClient(<AuditsPage />);
      await waitFor(() => expect(screen.getByText('2025年度 品質管理システム内部監査')).toBeTruthy());

      const deleteBtns = screen.getAllByRole('button', { name: '削除' });
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => expect(screen.getByText('監査計画を削除しますか？')).toBeTruthy());

      // 削除確認ダイアログのボタンを特定 (variant=destructive の「削除」)
      const confirmBtn = screen.getAllByRole('button', { name: '削除' }).find(
        (btn) => btn.classList.contains('bg-destructive') || btn.textContent === '削除'
      );
      if (confirmBtn) fireEvent.click(confirmBtn);
      else {
        // fallback: テキストが '削除' の2番目のボタン
        const allDeleteBtns = screen.getAllByRole('button', { name: '削除' });
        fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]);
      }

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(`/audit/plans/${MOCK_PLAN.id}`);
      });
    });
  });
});

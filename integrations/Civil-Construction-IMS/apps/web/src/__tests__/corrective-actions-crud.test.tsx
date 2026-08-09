import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import CorrectiveActionsPage from '@/app/(dashboard)/corrective-actions/page';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CorrectiveActionsPage />
    </QueryClientProvider>,
  );
}

const emptyResponse = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };

const sampleCA = {
  id: 'ca-1',
  caNo: 'CA-2026-001',
  sourceType: 'nonconformity',
  title: 'コンクリート強度不足',
  description: '設計強度を下回るコンクリートが使用された',
  isoStandard: '9001',
  severity: 'HIGH' as const,
  status: 'OPEN' as const,
  dueDate: '2026-07-01T00:00:00.000Z',
  createdAt: '2026-06-01T00:00:00.000Z',
};

const sampleResponse = { items: [sampleCA], total: 1, page: 1, limit: 20, totalPages: 1 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CorrectiveActionsPage — CRUD ダイアログ', () => {
  describe('ページ見出し', () => {
    it('ページタイトルが表示される', async () => {
      mockGet.mockResolvedValue(emptyResponse);
      renderPage();
      expect(screen.getByText('是正処置管理')).toBeInTheDocument();
    });

    it('「新規登録」ボタンがレンダリングされる', async () => {
      mockGet.mockResolvedValue(emptyResponse);
      renderPage();
      expect(screen.getByText('新規登録')).toBeInTheDocument();
    });

    it('ISO 規格説明が表示される', async () => {
      mockGet.mockResolvedValue(emptyResponse);
      renderPage();
      expect(screen.getByText(/ISO 9001\/14001/)).toBeInTheDocument();
    });
  });

  describe('データなし状態', () => {
    it('ローディング中はスケルトンが表示される', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      const { container } = renderPage();
      expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    });

    it('データが空のときは空状態メッセージを表示する', async () => {
      mockGet.mockResolvedValue(emptyResponse);
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('是正処置の記録がありません')).toBeInTheDocument();
      });
    });

    it('APIエラー時は警告メッセージを表示する', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/データの読み込みに失敗しました/)).toBeInTheDocument();
      });
    });
  });

  describe('新規登録ダイアログ', () => {
    it('「新規登録」ボタンをクリックするとダイアログが開く', async () => {
      mockGet.mockResolvedValue(emptyResponse);
      renderPage();
      await waitFor(() => screen.getByText('新規登録'));
      fireEvent.click(screen.getByText('新規登録'));
      await waitFor(() => {
        expect(screen.getByText('是正処置を新規登録')).toBeInTheDocument();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      mockGet.mockResolvedValue(emptyResponse);
      renderPage();
      await waitFor(() => screen.getByText('新規登録'));
      fireEvent.click(screen.getByText('新規登録'));
      await waitFor(() => screen.getByText('是正処置を新規登録'));
      fireEvent.click(screen.getByText('登録'));
      await waitFor(() => {
        expect(screen.getByText(/CA番号・タイトル・説明は必須です/)).toBeInTheDocument();
      });
    });

    it('フォームを正しく入力して送信すると apiClient.post が呼ばれる', async () => {
      mockGet.mockResolvedValue(emptyResponse);
      mockPost.mockResolvedValue({ ...sampleCA });
      renderPage();
      await waitFor(() => screen.getByText('新規登録'));
      fireEvent.click(screen.getByText('新規登録'));
      await waitFor(() => screen.getByText('是正処置を新規登録'));

      fireEvent.change(screen.getByLabelText('CA番号 *'), { target: { value: 'CA-2026-001' } });
      fireEvent.change(screen.getByLabelText('タイトル *'), { target: { value: 'コンクリート強度不足' } });
      fireEvent.change(screen.getByLabelText('問題の説明 *'), { target: { value: '設計強度を下回る' } });
      fireEvent.click(screen.getByText('登録'));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/corrective-actions', expect.objectContaining({
          caNo: 'CA-2026-001',
          title: 'コンクリート強度不足',
          description: '設計強度を下回る',
        }));
      });
    });
  });

  describe('編集 / 削除 — 成功パス', () => {
    it('一覧が表示される', async () => {
      mockGet.mockResolvedValue(sampleResponse);
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('CA-2026-001')).toBeInTheDocument();
        expect(screen.getByText('コンクリート強度不足')).toBeInTheDocument();
      });
    });

    it('編集ダイアログを開いて送信すると apiClient.put が呼ばれる', async () => {
      mockGet.mockResolvedValue(sampleResponse);
      mockPut.mockResolvedValue({ ...sampleCA, title: '更新後タイトル' });
      renderPage();
      await waitFor(() => screen.getAllByText('編集'));
      fireEvent.click(screen.getAllByText('編集')[0]);

      await waitFor(() => {
        expect(screen.getByText('是正処置を編集')).toBeInTheDocument();
      });
      expect(screen.getByLabelText('CA番号 *')).toHaveValue('CA-2026-001');

      fireEvent.click(screen.getByText('更新'));
      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledWith('/corrective-actions/ca-1', expect.any(Object));
      });
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      mockGet.mockResolvedValue(sampleResponse);
      mockDelete.mockResolvedValue(undefined);
      renderPage();
      await waitFor(() => screen.getAllByText('削除'));
      fireEvent.click(screen.getAllByText('削除')[0]);

      await waitFor(() => {
        expect(screen.getByText('是正処置を削除しますか？')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByText('削除');
      const dialogDeleteBtn = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(dialogDeleteBtn);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('/corrective-actions/ca-1');
      });
    });
  });

  describe('ステータスフィルタ', () => {
    it('「OPEN」フィルタをクリックするとクエリが更新される', async () => {
      mockGet.mockResolvedValue(sampleResponse);
      renderPage();
      await waitFor(() => screen.getByText('未処置'));
      fireEvent.click(screen.getByText('未処置'));
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('status=OPEN'));
      });
    });
  });
});

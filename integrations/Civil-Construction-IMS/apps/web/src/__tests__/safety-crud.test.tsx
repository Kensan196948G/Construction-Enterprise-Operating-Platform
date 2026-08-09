import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SafetyPage from '@/app/(dashboard)/safety/page';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn((path) => {
      if (path === '/projects') return Promise.resolve([]);
      if (path === '/safety/hazards') return Promise.resolve([]);
      return Promise.resolve([]);
    }),
    post: jest.fn().mockResolvedValue({
      id: 'hazard-1',
      workActivity: 'コンクリート打設',
      hazardType: '転落',
      hazardDescription: '足場からの転落危険',
      riskLevel: 'HIGH',
      residualRisk: 'LOW',
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

const MOCK_HAZARD = {
  id: 'hazard-1',
  workActivity: 'コンクリート打設',
  hazardType: '転落',
  hazardDescription: '足場からの転落危険',
  riskLevel: 'HIGH',
  residualRisk: 'LOW',
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

describe('SafetyPage — CRUD ダイアログ', () => {
  beforeEach(() => {
    mockGet.mockImplementation((path) => {
      if (path === '/projects') return Promise.resolve([]);
      if (path === '/safety/hazards') return Promise.resolve([]);
      return Promise.resolve([]);
    });
  });

  describe('ページ見出し', () => {
    it('安全管理タイトルが表示される', () => {
      renderWithQueryClient(<SafetyPage />);
      expect(screen.getByRole('heading', { name: /安全衛生/ })).toBeTruthy();
    });

    it('新規作成ボタンが表示される', () => {
      renderWithQueryClient(<SafetyPage />);
      expect(screen.getByText('新規作成')).toBeTruthy();
    });
  });

  describe('新規作成ダイアログ', () => {
    it('「新規作成」ボタンをクリックするとダイアログが開く', async () => {
      renderWithQueryClient(<SafetyPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => {
        expect(screen.getByText('ハザード 新規登録')).toBeTruthy();
      });
    });

    it('必須フィールド未入力で送信するとバリデーションエラーが表示される', async () => {
      renderWithQueryClient(<SafetyPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('ハザード 新規登録')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: '登録' }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(screen.getByText('作業・危険源種別・詳細説明は必須です')).toBeTruthy();
      });
    });

    it('キャンセルボタンでダイアログが閉じる', async () => {
      renderWithQueryClient(<SafetyPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('ハザード 新規登録')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

      await waitFor(() => {
        expect(screen.queryByText('ハザード 新規登録')).toBeNull();
      });
    });
  });

  describe('新規作成 — 成功パス', () => {
    beforeEach(() => {
      mockPost.mockClear();
      mockPost.mockResolvedValue(MOCK_HAZARD);
      mockGet.mockImplementation((path) => {
        if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
        if (path === '/safety/hazards') return Promise.resolve([]);
        return Promise.resolve([]);
      });
    });

    it('フォームを正しく入力して送信すると apiClient.post が正しいペイロードで呼ばれる', async () => {
      renderWithQueryClient(<SafetyPage />);
      fireEvent.click(screen.getByText('新規作成'));
      await waitFor(() => expect(screen.getByText('ハザード 新規登録')).toBeTruthy());

      fireEvent.change(screen.getByPlaceholderText('例: 足場組立・解体作業'), { target: { value: '掘削作業' } });
      fireEvent.change(screen.getByPlaceholderText('例: 墜落・転落'), { target: { value: '土砂崩壊' } });
      fireEvent.change(screen.getByPlaceholderText('例: 高所作業での手すりなし箇所からの墜落リスク'), { target: { value: '掘削面崩壊による作業員埋没リスク' } });

      fireEvent.click(screen.getByRole('button', { name: '登録' }));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);
        expect(mockPost).toHaveBeenCalledWith('/safety/hazards', expect.objectContaining({
          workActivity: '掘削作業',
          hazardType: '土砂崩壊',
          hazardDescription: '掘削面崩壊による作業員埋没リスク',
        }));
      });
    });
  });

  describe('編集 / 削除 — テーブル行', () => {
    beforeEach(() => {
      mockGet.mockImplementation((path) => {
        if (path === '/projects') return Promise.resolve([MOCK_PROJECT]);
        if (path === '/safety/hazards') return Promise.resolve([MOCK_HAZARD]);
        return Promise.resolve([]);
      });
      mockPut.mockClear();
      mockPut.mockResolvedValue({});
      mockDelete.mockClear();
      mockDelete.mockResolvedValue(undefined);
    });

    it('ハザード一覧に作業内容が表示される', async () => {
      renderWithQueryClient(<SafetyPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設')).toBeTruthy());
    });

    it('編集ボタンをクリックすると編集ダイアログが開く', async () => {
      renderWithQueryClient(<SafetyPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート打設を編集' }));
      await waitFor(() => expect(screen.getByText('ハザード 編集')).toBeTruthy());
    });

    it('編集ダイアログで作業内容を変更して送信すると apiClient.put が呼ばれる', async () => {
      renderWithQueryClient(<SafetyPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート打設を編集' }));
      await waitFor(() => expect(screen.getByText('ハザード 編集')).toBeTruthy());

      const workActivityInput = screen.getByDisplayValue('コンクリート打設');
      fireEvent.change(workActivityInput, { target: { value: '型枠組立' } });

      fireEvent.click(screen.getByRole('button', { name: '更新' }));

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(mockPut).toHaveBeenCalledWith(`/safety/hazards/${MOCK_HAZARD.id}`, expect.objectContaining({
          workActivity: '型枠組立',
        }));
      });
    });

    it('削除ボタンをクリックすると削除ダイアログが開く', async () => {
      renderWithQueryClient(<SafetyPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート打設を削除' }));
      await waitFor(() => expect(screen.getByText('ハザードを削除')).toBeTruthy());
    });

    it('削除ダイアログで確認すると apiClient.delete が呼ばれる', async () => {
      renderWithQueryClient(<SafetyPage />);
      await waitFor(() => expect(screen.getByText('コンクリート打設')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: 'コンクリート打設を削除' }));
      await waitFor(() => expect(screen.getByText('ハザードを削除')).toBeTruthy());

      fireEvent.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(`/safety/hazards/${MOCK_HAZARD.id}`);
      });
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はテキストを表示する', () => {
      renderWithQueryClient(<SafetyPage />);
      expect(screen.getByText('読み込み中...')).toBeTruthy();
    });
  });
});

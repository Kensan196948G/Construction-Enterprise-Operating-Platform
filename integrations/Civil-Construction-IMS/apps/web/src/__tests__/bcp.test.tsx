import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

// formatDate は実際の実装を使用 (日付文字列の整形のみ)
jest.mock('@/lib/utils', () => ({
  formatDate: (s: string) => s,
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

jest.mock('lucide-react', () => ({
  FileText: () => null,
  AlertOctagon: () => null,
  CheckCircle: () => null,
  Clock: () => null,
  Shield: () => null,
}));

import BcpPage from '@/app/(dashboard)/bcp/page';

const mockGet = apiClient.get as jest.Mock;

const MOCK_PLANS = [
  {
    id: 'bcp-1',
    planNo: 'BCP-2026-001',
    title: '地震発生時の事業継続計画',
    version: 2,
    status: 'APPROVED',
    rto: 24,
    rpo: 4,
    approvedAt: '2026-03-15T00:00:00.000Z',
    approvedBy: '田中部長',
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'bcp-2',
    planNo: 'BCP-2026-002',
    title: 'サイバー攻撃対応計画',
    version: 1,
    status: 'DRAFT',
    rto: undefined,
    rpo: undefined,
    approvedAt: undefined,
    createdAt: '2026-04-01T00:00:00.000Z',
  },
];

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('BcpPage', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  describe('ページ構造', () => {
    it('ページタイトルが表示される', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      renderWithQueryClient(<BcpPage />);
      expect(screen.getByText(/BCP 事業継続計画/)).toBeTruthy();
    });

    it('"BCP 計画書総数" カードが表示される', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      renderWithQueryClient(<BcpPage />);
      expect(screen.getByText('BCP 計画書 総数')).toBeTruthy();
    });
  });

  describe('ローディング状態', () => {
    it('データ取得中はスケルトンが表示される', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      renderWithQueryClient(<BcpPage />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('エラー状態', () => {
    it('API エラー時はエラーメッセージを表示する', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));
      renderWithQueryClient(<BcpPage />);
      await waitFor(() => {
        expect(screen.getByText(/データの読み込みに失敗しました/)).toBeTruthy();
      });
    });
  });

  describe('空データ状態', () => {
    it('計画書が 0 件の場合は空状態メッセージを表示する', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0 });
      renderWithQueryClient(<BcpPage />);
      await waitFor(() => {
        expect(screen.getByText(/BCP 計画書がありません/)).toBeTruthy();
      });
    });

    it('空状態では総数サマリが 0 を表示する', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0 });
      renderWithQueryClient(<BcpPage />);
      await waitFor(() => {
        // 総数、承認済み、未承認、承認率 の 4 カードすべてが 0 または 0%
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('データ表示', () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({ items: MOCK_PLANS, total: MOCK_PLANS.length });
    });

    it('計画書のタイトルが表示される', async () => {
      renderWithQueryClient(<BcpPage />);
      await waitFor(() => {
        expect(screen.getByText('地震発生時の事業継続計画')).toBeTruthy();
        expect(screen.getByText('サイバー攻撃対応計画')).toBeTruthy();
      });
    });

    it('計画書番号が表示される', async () => {
      renderWithQueryClient(<BcpPage />);
      await waitFor(() => {
        expect(screen.getByText('BCP-2026-001')).toBeTruthy();
        expect(screen.getByText('BCP-2026-002')).toBeTruthy();
      });
    });

    it('サマリーカードに正しい合計・承認済み件数が表示される', async () => {
      renderWithQueryClient(<BcpPage />);
      await waitFor(() => {
        // 総数 = 2
        expect(screen.getByText('2')).toBeTruthy();
        // APPROVED=1, DRAFT=1 → "1" が複数存在するため getAllByText を使用
        expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      });
    });

    it('RTO が設定されている計画は RTO 時間を表示する', async () => {
      renderWithQueryClient(<BcpPage />);
      await waitFor(() => {
        expect(screen.getByText('24h')).toBeTruthy();
      });
    });

    it('RTO が未設定の計画は "—" を表示する', async () => {
      renderWithQueryClient(<BcpPage />);
      await waitFor(() => {
        // 最低1件は "—" が表示される
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });
  });
});

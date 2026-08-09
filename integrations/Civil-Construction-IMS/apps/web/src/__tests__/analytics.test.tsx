import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

// lucide-react SVG アイコンをスタブ化 (DOM テストに不要)
jest.mock('lucide-react', () => ({
  BarChart3: () => null,
  ShieldCheck: () => null,
  AlertTriangle: () => null,
  TrendingUp: () => null,
}));

import AnalyticsPage from '@/app/(dashboard)/analytics/page';

const mockGet = apiClient.get as jest.Mock;

const MOCK_COMPLIANCE = {
  iso9001: { name: 'ISO 9001', score: 85, open_nonconformities: 2 },
  iso14001: { name: 'ISO 14001', score: 72, non_compliant_legal: 1 },
  iso45001: { name: 'ISO 45001', score: 91, open_incidents: 0 },
  iso55001: { name: 'ISO 55001', score: 65, poor_condition_assets: 5 },
  iso19650: { name: 'ISO 19650', score: 78, wip_containers: 3 },
};

const MOCK_SAFETY_KPI = {
  near_misses: { ytd: 12, open: 2 },
  incidents: { ytd: 3, with_lost_days: 0 },
  education: { sessions_ytd: 24 },
};

const MOCK_QUALITY_KPI = {
  nonconformities: { open: 4, critical: 0 },
  documents: { under_review: 7, published: 142 },
  audits: { in_progress: 1 },
};

function renderWithQueryClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AnalyticsPage', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  describe('ページ構造', () => {
    it('ページタイトルが表示される', async () => {
      mockGet.mockResolvedValue(null);
      renderWithQueryClient(<AnalyticsPage />);
      expect(screen.getByText(/ISO 適合分析ダッシュボード/)).toBeTruthy();
    });

    it('"ISO 適合スコア" セクション見出しが表示される', () => {
      mockGet.mockResolvedValue(null);
      renderWithQueryClient(<AnalyticsPage />);
      expect(screen.getByText(/ISO 適合スコア/)).toBeTruthy();
    });
  });

  describe('ローディング状態', () => {
    it('データ取得中はスケルトン (animate-pulse) が表示される', () => {
      // never resolves → stays loading
      mockGet.mockReturnValue(new Promise(() => {}));
      renderWithQueryClient(<AnalyticsPage />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('エラー状態', () => {
    it('compliance API がエラーを返した場合は警告メッセージを表示する', async () => {
      mockGet.mockImplementation((path: string) => {
        if (path === '/analytics/iso-compliance') return Promise.reject(new Error('Network Error'));
        return Promise.resolve(null);
      });
      renderWithQueryClient(<AnalyticsPage />);
      await waitFor(() => {
        expect(screen.getByText(/データの読み込みに失敗しました/)).toBeTruthy();
      });
    });
  });

  describe('データ表示', () => {
    beforeEach(() => {
      mockGet.mockImplementation((path: string) => {
        if (path === '/analytics/iso-compliance') return Promise.resolve(MOCK_COMPLIANCE);
        if (path === '/analytics/safety-kpi') return Promise.resolve(MOCK_SAFETY_KPI);
        if (path === '/analytics/quality-kpi') return Promise.resolve(MOCK_QUALITY_KPI);
        return Promise.resolve(null);
      });
    });

    it('ISO 9001 のスコアと名称が表示される', async () => {
      renderWithQueryClient(<AnalyticsPage />);
      await waitFor(() => {
        expect(screen.getByText('ISO 9001')).toBeTruthy();
        expect(screen.getByText('85点')).toBeTruthy();
      });
    });

    it('ISO 45001 のスコアが表示される', async () => {
      renderWithQueryClient(<AnalyticsPage />);
      await waitFor(() => {
        expect(screen.getByText('91点')).toBeTruthy();
      });
    });

    it('安全衛生 KPI の年累計ヒヤリハット件数が表示される', async () => {
      renderWithQueryClient(<AnalyticsPage />);
      await waitFor(() => {
        expect(screen.getByText(/ヒヤリハット（年累計）/)).toBeTruthy();
        expect(screen.getByText('12件')).toBeTruthy();
      });
    });

    it('品質管理 KPI の発行済み文書数が表示される', async () => {
      renderWithQueryClient(<AnalyticsPage />);
      await waitFor(() => {
        expect(screen.getByText(/発行済み文書/)).toBeTruthy();
        expect(screen.getByText('142件')).toBeTruthy();
      });
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

jest.mock('@/lib/utils', () => ({
  formatDate: (s: string) => s,
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

jest.mock('lucide-react', () => ({
  Lock: () => null,
  ShieldAlert: () => null,
  Database: () => null,
  AlertCircle: () => null,
}));

import IsmsPage from '@/app/(dashboard)/isms/page';

const mockGet = apiClient.get as jest.Mock;

const MOCK_ASSETS = [
  {
    id: 'isms-asset-1',
    assetNo: 'ISMS-2026-001',
    name: '顧客データベース',
    assetType: 'データベース',
    classification: 'confidential',
    sensitivity: 'HIGH',
    owner: '情報システム部',
    location: 'データセンターA',
  },
];

const MOCK_INCIDENTS = [
  {
    id: 'isms-inc-1',
    incidentNo: 'INC-2026-001',
    incidentType: '不正アクセス',
    occurredAt: '2026-05-01T09:00:00.000Z',
    description: 'VPN 経由の不審なログイン試行',
    severity: 'HIGH',
    status: 'CLOSED',
    affectedSystems: 'VPN gateway',
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

describe('IsmsPage', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  describe('ページ構造', () => {
    it('ページタイトルが表示される', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      renderWithQueryClient(<IsmsPage />);
      expect(screen.getByText(/ISMS 情報セキュリティ管理/)).toBeTruthy();
    });

    it('"情報資産台帳" タブが表示される', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      renderWithQueryClient(<IsmsPage />);
      expect(screen.getByRole('button', { name: /情報資産台帳/ })).toBeTruthy();
    });

    it('"インシデント" タブが表示される', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      renderWithQueryClient(<IsmsPage />);
      expect(screen.getByRole('button', { name: /インシデント/ })).toBeTruthy();
    });
  });

  describe('情報資産台帳タブ (既定)', () => {
    it('初期表示は資産タブ — 資産台帳カードが表示される', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0 });
      renderWithQueryClient(<IsmsPage />);
      await waitFor(() => {
        // タブボタンとカードヘッダの両方に "情報資産台帳" が存在するため getAllByText を使用
        expect(screen.getAllByText('情報資産台帳').length).toBeGreaterThan(0);
      });
    });

    it('資産が 0 件の場合は空状態メッセージを表示する', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0 });
      renderWithQueryClient(<IsmsPage />);
      await waitFor(() => {
        expect(screen.getByText('情報資産が登録されていません')).toBeTruthy();
      });
    });

    it('資産データがある場合は資産名と分類が表示される', async () => {
      mockGet.mockResolvedValue({ items: MOCK_ASSETS, total: 1 });
      renderWithQueryClient(<IsmsPage />);
      await waitFor(() => {
        expect(screen.getByText('顧客データベース')).toBeTruthy();
        expect(screen.getByText('ISMS-2026-001')).toBeTruthy();
        // classification=confidential → "機密"
        expect(screen.getByText('機密')).toBeTruthy();
      });
    });

    it('ローディング中はスケルトンを表示する', () => {
      mockGet.mockReturnValue(new Promise(() => {}));
      renderWithQueryClient(<IsmsPage />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('インシデントタブへの切り替え', () => {
    it('インシデントタブをクリックすると資産カードが非表示になりインシデントカードが表示される', async () => {
      // インシデントAPI のみモック (資産は空)
      mockGet.mockImplementation((path: string) => {
        if (path === '/isms/assets') return Promise.resolve({ items: [], total: 0 });
        if (path === '/isms/incidents') return Promise.resolve({ items: [], total: 0 });
        return Promise.resolve(null);
      });
      renderWithQueryClient(<IsmsPage />);

      // 資産タブが先に表示
      await waitFor(() => expect(screen.getByText('情報資産が登録されていません')).toBeTruthy());

      // インシデントタブをクリック
      fireEvent.click(screen.getByRole('button', { name: /インシデント/ }));

      await waitFor(() => {
        expect(screen.getByText('セキュリティインシデント')).toBeTruthy();
        expect(screen.getByText('インシデントが登録されていません')).toBeTruthy();
      });
    });

    it('インシデントデータがある場合はインシデント番号と重大度が表示される', async () => {
      mockGet.mockImplementation((path: string) => {
        if (path === '/isms/assets') return Promise.resolve({ items: [], total: 0 });
        if (path === '/isms/incidents') return Promise.resolve({ items: MOCK_INCIDENTS, total: 1 });
        return Promise.resolve(null);
      });
      renderWithQueryClient(<IsmsPage />);

      // インシデントタブへ切り替え
      fireEvent.click(screen.getByRole('button', { name: /インシデント/ }));

      await waitFor(() => {
        expect(screen.getByText('INC-2026-001')).toBeTruthy();
        expect(screen.getByText('不正アクセス')).toBeTruthy();
        // severity=HIGH → "高"
        expect(screen.getByText('高')).toBeTruthy();
      });
    });
  });
});

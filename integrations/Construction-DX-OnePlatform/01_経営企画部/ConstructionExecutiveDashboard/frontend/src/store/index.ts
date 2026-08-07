import { create } from 'zustand';

type DashboardFilters = {
  period: string;
  branchCode?: string;
};

type DashboardStore = {
  filters: DashboardFilters;
  setPeriod: (period: string) => void;
  setBranch: (branchCode?: string) => void;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  filters: { period: 'current' },
  setPeriod: (period) => set((s) => ({ filters: { ...s.filters, period } })),
  setBranch: (branchCode) => set((s) => ({ filters: { ...s.filters, branchCode } })),
}));

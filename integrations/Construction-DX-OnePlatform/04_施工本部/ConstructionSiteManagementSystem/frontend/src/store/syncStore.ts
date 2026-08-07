import { create } from 'zustand';

interface SyncState {
  online: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  setOnline: (b: boolean) => void;
  setPending: (n: number) => void;
  setLastSynced: (iso: string) => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  lastSyncedAt: null,
  setOnline: (online) => set({ online }),
  setPending: (pendingCount) => set({ pendingCount }),
  setLastSynced: (lastSyncedAt) => set({ lastSyncedAt }),
}));

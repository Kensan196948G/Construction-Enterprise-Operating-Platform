import { create } from 'zustand';

interface OfflineState {
  deviceId: string;
  initDeviceId: () => void;
}

function genDeviceId(): string {
  const key = 'cdx-site-device-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export const useOfflineStore = create<OfflineState>()((set) => ({
  deviceId: typeof window !== 'undefined' ? genDeviceId() : '',
  initDeviceId: () => set({ deviceId: genDeviceId() }),
}));

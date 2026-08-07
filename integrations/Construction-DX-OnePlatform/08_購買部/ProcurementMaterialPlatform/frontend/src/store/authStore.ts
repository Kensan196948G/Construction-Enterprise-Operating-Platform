import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  userName: string | null;
  setToken: (t: string, name?: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userName: null,
      setToken: (token, userName) => set({ token, userName: userName ?? null }),
      clear: () => set({ token: null, userName: null }),
    }),
    { name: 'cdx-proc-auth' },
  ),
);

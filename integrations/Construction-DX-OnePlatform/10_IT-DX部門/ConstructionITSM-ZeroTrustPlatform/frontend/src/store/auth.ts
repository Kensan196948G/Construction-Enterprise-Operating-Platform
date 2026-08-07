import { create } from "zustand";

interface AuthState {
  token: string | null;
  user: { email: string; name: string } | null;
  setToken: (t: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("cdx_token"),
  user: null,
  setToken: (t) => {
    localStorage.setItem("cdx_token", t);
    set({ token: t });
  },
  clear: () => {
    localStorage.removeItem("cdx_token");
    set({ token: null, user: null });
  }
}));

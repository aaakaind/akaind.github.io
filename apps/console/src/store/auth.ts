import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
}

export const useAuthStore = create<AuthState>(() => ({
  isAuthenticated: false,
  user: null,
}));

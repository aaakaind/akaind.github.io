import { create } from "zustand";
export const useAuthStore = create(() => ({
    isAuthenticated: false,
    user: null,
}));
//# sourceMappingURL=auth.js.map
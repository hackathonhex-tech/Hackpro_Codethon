import { create } from 'zustand';
import type { UserSession } from '@codeathon/shared';

interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initAuth: () => void;
  setAuth: (user: UserSession, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  hasPermission: (permission: string) => boolean;
}

const getStoredAuth = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('access_token');
    const storedUser = sessionStorage.getItem('user');
    if (token) {
      try {
        const user = storedUser ? JSON.parse(storedUser) : null;
        return { accessToken: token, user, isAuthenticated: true };
      } catch (e) {}
    }
  }
  return { accessToken: null, user: null, isAuthenticated: false };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  // Deterministic initial state matching SSR to prevent React hydration mismatches
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  initAuth: () => {
    const auth = getStoredAuth();
    set({
      user: auth.user,
      accessToken: auth.accessToken,
      isAuthenticated: auth.isAuthenticated,
      isLoading: false,
    });
  },

  setAuth: (user, accessToken) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', accessToken);
      sessionStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
    }
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return (user.permissions ?? []).includes(permission as any);
  },
}));

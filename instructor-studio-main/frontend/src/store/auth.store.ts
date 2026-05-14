import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../lib/api-services';
import { setAuthToken, clearAuthToken } from '../lib/api';

export type RoleType =
  | 'super_admin' | 'admin' | 'blog_manager'
  | 'hr_manager' | 'website_manager' | 'instructor' | 'student';

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  roles: RoleType[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  fetchMe: () => Promise<void>;
  hasRole: (...roles: RoleType[]) => boolean;
  isAdmin: () => boolean;
  isInstructor: () => boolean;
  isStudent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password, remember = false) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ email, password, remember_me: remember });
          const { access_token, user } = data.data;
          setAuthToken(access_token);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        clearAuthToken();
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      fetchMe: async () => {
        try {
          const { data } = await authApi.me();
          set({ user: data.data.user, isAuthenticated: true });
        } catch {
          clearAuthToken();
          set({ user: null, isAuthenticated: false });
        }
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return user.roles.some((r) => roles.includes(r));
      },

      isAdmin: () => get().hasRole('admin', 'super_admin'),
      isInstructor: () => get().hasRole('instructor', 'admin', 'super_admin'),
      isStudent: () => get().hasRole('student'),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

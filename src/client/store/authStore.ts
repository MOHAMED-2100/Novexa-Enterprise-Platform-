import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  enabledModules: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  refreshModules: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  enabledModules: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.message || 'Login failed';
        set({ error: errorMsg, isLoading: false });
        return false;
      }

      const token = data.accessToken;
      const user = data.user;

      set({
        accessToken: token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Fetch tenant enabled modules
      await get().refreshModules();
      return true;
    } catch (err: any) {
      set({ error: err?.message || 'Network error during login', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      // Purge all in-memory credentials
      set({
        accessToken: null,
        user: null,
        enabledModules: [],
        isAuthenticated: false,
        error: null,
      });
    }
  },

  checkSession: async () => {
    try {
      const { accessToken } = get();
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Check /auth/me (will read cookie if accessToken isn't in memory yet)
      const res = await fetch('/auth/me', {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const json = await res.json();
        set({
          user: json.user,
          isAuthenticated: true,
        });
        await get().refreshModules();
      }
    } catch {
      // Session not active
    }
  },

  refreshModules: async () => {
    try {
      const { accessToken } = get();
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/me/enabled-modules', {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        set({ enabledModules: data.enabled_modules || [] });
      }
    } catch (err) {
      console.warn('Failed to refresh tenant enabled modules', err);
    }
  },
}));

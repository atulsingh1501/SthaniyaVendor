import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Config ────────────────────────────────────────────────────────────────
// For Android emulator use 10.0.2.2, for iOS simulator use localhost,
// For physical device use your machine's local IP (e.g. 192.168.1.x)
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'vendor_link_token';
const USER_KEY = 'vendor_link_user';

// ─── Storage helpers ────────────────────────────────────────────────────────
const storage = {
  get: async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return AsyncStorage.getItem(key);
  },
  set: async (key: string, value: string) => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return AsyncStorage.setItem(key, value);
  },
  remove: async (key: string) => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    return AsyncStorage.removeItem(key);
  },
};

// ─── HTTP Client ────────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = false,
): Promise<T> {
  const token = await storage.get(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requireAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'API Error');
  }

  // Handle 204 No Content
  if (response.status === 204) return null as T;
  return response.json();
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export const auth = {
  /** Register or sign in with phone. Returns session-like object. */
  signInOrRegister: async (phone: string, password = 'testpassword123') => {
    // Try login first
    try {
      const data = await request<{ access_token: string; user: any }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ phone, password }) },
      );
      await storage.set(TOKEN_KEY, data.access_token);
      await storage.set(USER_KEY, JSON.stringify(data.user));
      return { user: data.user, error: null };
    } catch (loginErr: any) {
      // If 401, user doesn't exist → register
      if (loginErr.message?.includes('Invalid phone')) {
        try {
          const data = await request<{ access_token: string; user: any }>(
            '/auth/register',
            { method: 'POST', body: JSON.stringify({ phone, password }) },
          );
          await storage.set(TOKEN_KEY, data.access_token);
          await storage.set(USER_KEY, JSON.stringify(data.user));
          return { user: data.user, error: null };
        } catch (regErr: any) {
          return { user: null, error: regErr };
        }
      }
      return { user: null, error: loginErr };
    }
  },

  /** Get the current user from storage (no network call). */
  getUser: async () => {
    const userStr = await storage.get(USER_KEY);
    if (!userStr) return { data: { user: null } };
    try {
      return { data: { user: JSON.parse(userStr) } };
    } catch {
      return { data: { user: null } };
    }
  },

  /** Verify token is still valid against the backend. */
  verifySession: async () => {
    try {
      const user = await request<any>('/auth/me', {}, true);
      return user;
    } catch {
      await auth.signOut();
      return null;
    }
  },

  /** Sign out — clear stored token. */
  signOut: async () => {
    await storage.remove(TOKEN_KEY);
    await storage.remove(USER_KEY);
  },
};

// ─── Stores ─────────────────────────────────────────────────────────────────
export const stores = {
  list: () => request<any[]>('/stores'),

  getById: (id: string) => request<any>(`/stores/${id}`),

  getMyStore: () => request<any | null>('/stores/vendor/me', {}, true),

  create: (payload: {
    name: string;
    category?: string;
    phone?: string;
    location_text?: string;
    latitude?: number;
    longitude?: number;
  }) =>
    request<any>('/stores', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true),
};

// ─── Products ────────────────────────────────────────────────────────────────
export const products = {
  addToStore: (
    storeId: string,
    items: { name: string; price?: string; category?: string; is_in_stock?: boolean }[],
  ) =>
    request<any[]>(`/stores/${storeId}/products`, {
      method: 'POST',
      body: JSON.stringify(items),
    }, true),

  updateStock: (productId: string, is_in_stock: boolean) =>
    request<any>(`/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_in_stock }),
    }, true),
};

// ─── Health ──────────────────────────────────────────────────────────────────
export const health = () => request<{ status: string }>('/health');

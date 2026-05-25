/**
 * Vendor Link API client — talks to FastAPI + PostgreSQL backend
 * Base URL set via VITE_API_URL in .env (defaults to http://localhost:8000)
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ─── Token helpers ────────────────────────────────────────────────────────────
const TOKEN_KEY = 'vendor_link_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Base fetch ───────────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (auth) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.detail || `API error ${res.status}`);
  }

  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  phone: string;
}

export interface Store {
  id: string;
  vendor_id: string;
  name: string;
  category: string | null;
  phone: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  upi_id: string | null;
  rating: number;
  created_at: string;
  products_count?: number;
  in_stock_count?: number;
  distance_km?: number | null;
  products?: Product[];
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  is_in_stock: boolean;
  created_at: string;
}

export interface StoreStats {
  total_products: number;
  in_stock: number;
  out_of_stock: number;
  avg_price: number;
  max_price: number;
  min_price: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  async register(phone: string, password = 'testpassword123') {
    const data = await apiFetch<{ access_token: string; user: User }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ phone, password }) }
    );
    setToken(data.access_token);
    return data;
  },

  async login(phone: string, password = 'testpassword123') {
    const data = await apiFetch<{ access_token: string; user: User }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ phone, password }) }
    );
    setToken(data.access_token);
    return data;
  },

  async me(): Promise<User> {
    return apiFetch<User>('/auth/me', {}, true);
  },

  logout() {
    clearToken();
  },

  isLoggedIn(): boolean {
    return !!getToken();
  },
};

// ─── Stores ───────────────────────────────────────────────────────────────────
export const stores = {
  async list(params: {
    lat?: number;
    lng?: number;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ total: number; stores: Store[] }> {
    const qs = new URLSearchParams();
    if (params.lat != null) qs.set('lat', String(params.lat));
    if (params.lng != null) qs.set('lng', String(params.lng));
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    return apiFetch<{ total: number; stores: Store[] }>(`/stores?${qs}`);
  },

  async get(id: string): Promise<Store> {
    return apiFetch<Store>(`/stores/${id}`);
  },

  async myStore(): Promise<Store | null> {
    return apiFetch<Store | null>('/stores/vendor/me', {}, true);
  },

  async create(body: {
    name: string;
    category?: string;
    phone?: string;
    location_text?: string;
    latitude?: number;
    longitude?: number;
    upi_id?: string;
  }): Promise<Store> {
    return apiFetch<Store>('/stores', { method: 'POST', body: JSON.stringify(body) }, true);
  },

  async update(id: string, body: Partial<Store>): Promise<Store> {
    return apiFetch<Store>(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(body) }, true);
  },

  async stats(id: string): Promise<StoreStats> {
    return apiFetch<StoreStats>(`/stores/${id}/stats`, {}, true);
  },
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = {
  async list(storeId: string): Promise<Product[]> {
    return apiFetch<Product[]>(`/stores/${storeId}/products`);
  },

  async add(
    storeId: string,
    items: Array<{
      name: string;
      price?: number;
      unit?: string;
      category?: string;
      is_in_stock?: boolean;
    }>
  ): Promise<Product[]> {
    return apiFetch<Product[]>(
      `/stores/${storeId}/products`,
      { method: 'POST', body: JSON.stringify(items) },
      true
    );
  },

  async update(
    productId: string,
    body: { name?: string; price?: number; unit?: string; category?: string; is_in_stock?: boolean }
  ): Promise<Product> {
    return apiFetch<Product>(
      `/products/${productId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
      true
    );
  },

  async delete(productId: string): Promise<void> {
    return apiFetch<void>(`/products/${productId}`, { method: 'DELETE' }, true);
  },
};

// ─── Health check ─────────────────────────────────────────────────────────────
export async function healthCheck(): Promise<boolean> {
  try {
    await apiFetch<{ status: string }>('/health');
    return true;
  } catch {
    return false;
  }
}

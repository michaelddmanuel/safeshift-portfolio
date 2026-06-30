import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

/**
 * API base URL resolution:
 *  - If `VITE_API_URL` is set at build time, talk to that real backend.
 *  - Else in a production build (no backend reachable), run in self-contained
 *    DEMO mode resolved from seeded fixtures (see api/demo.ts).
 *  - Else (local `npm run dev`) use `/api`, proxied to the Express server.
 */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || undefined;
export const IS_DEMO = !API_URL && import.meta.env.PROD;

async function demoAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const { resolveDemoRequest } = await import('./demo');
  return resolveDemoRequest(config);
}

/**
 * Shared Axios instance. Attaches the JWT and, for platform admins, the active
 * brand via the X-Tenant header (drives the 3-way brand toggle server-side).
 */
export const api = axios.create({
  baseURL: API_URL ?? '/api',
  ...(IS_DEMO ? { adapter: demoAdapter } : {}),
});

const TOKEN_KEY = 'safeshift.token';
const TENANT_KEY = 'safeshift.activeTenant';

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else {
    localStorage.removeItem(TOKEN_KEY);
    if (IS_DEMO) void import('./demo').then((m) => m.clearDemoSession());
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setActiveTenantSlug(slug: string | null): void {
  if (slug) localStorage.setItem(TENANT_KEY, slug);
  else localStorage.removeItem(TENANT_KEY);
}

export function getActiveTenantSlug(): string | null {
  return localStorage.getItem(TENANT_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const activeTenant = getActiveTenantSlug();
  if (activeTenant) config.headers['X-Tenant'] = activeTenant;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      // Token expired/invalid → clear and bounce to login.
      setToken(null);
      if (location.pathname !== '/login') location.assign('/login');
    }
    return Promise.reject(error);
  },
);

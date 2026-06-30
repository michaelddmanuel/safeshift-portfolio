import axios from 'axios';

/**
 * Shared Axios instance. Attaches the JWT and, for platform admins, the active
 * brand via the X-Tenant header (drives the 3-way brand toggle server-side).
 */
export const api = axios.create({ baseURL: '/api' });

const TOKEN_KEY = 'safeshift.token';
const TENANT_KEY = 'safeshift.activeTenant';

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
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

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/endpoints';
import { getToken, setActiveTenantSlug, setToken } from '../api/client';
import type { Tenant, User } from '../types';

interface AuthContextValue {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Set after login for non-admins; lets TenantContext override for admins. */
  setTenant: (tenant: Tenant | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user: u, tenant: t }) => {
        setUser(u);
        setTenant(t);
        if (t) setActiveTenantSlug(t.slug);
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u, tenant: t } = await authApi.login(email, password);
    setToken(token);
    setUser(u);
    setTenant(t);
    if (t) setActiveTenantSlug(t.slug);
    else setActiveTenantSlug(null);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setActiveTenantSlug(null);
    setUser(null);
    setTenant(null);
  }, []);

  const value = useMemo(
    () => ({ user, tenant, loading, login, logout, setTenant }),
    [user, tenant, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

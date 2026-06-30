import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { tenantApi } from '../api/endpoints';
import { setActiveTenantSlug } from '../api/client';
import { applyBrandTheme } from '../lib/theme';
import { useAuth } from './AuthContext';
import type { FeatureFlag, Tenant } from '../types';

interface TenantContextValue {
  /** The tenant whose theme/labels are currently rendered. */
  activeTenant: Tenant | null;
  /** All brands (platform admin / demo toggle). Empty for normal users. */
  availableTenants: Tenant[];
  canSwitchBrand: boolean;
  switchBrand: (slug: string) => void;
  hasFeature: (flag: FeatureFlag) => boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, tenant: authTenant } = useAuth();
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [overrideTenant, setOverrideTenant] = useState<Tenant | null>(null);

  const isPlatformAdmin = user?.role === 'platform_admin';

  // Platform admins can preview/switch all brands; others are pinned to theirs.
  useEffect(() => {
    if (isPlatformAdmin) {
      tenantApi
        .list()
        .then((tenants) => {
          setAvailableTenants(tenants);
          // Platform admins have no fixed auth tenant; pick a sensible default
          // so the brand switcher always has an active selection.
          if (!authTenant && !overrideTenant && tenants.length > 0) {
            setOverrideTenant(tenants[0]);
            setActiveTenantSlug(tenants[0].slug);
          }
        })
        .catch(() => setAvailableTenants([]));
    } else {
      setAvailableTenants([]);
      setOverrideTenant(null);
    }
  }, [isPlatformAdmin, authTenant, overrideTenant]);

  const activeTenant = overrideTenant ?? authTenant ?? null;

  useEffect(() => {
    applyBrandTheme(activeTenant?.theme ?? null, activeTenant?.slug ?? null);
  }, [activeTenant]);

  const switchBrand = useCallback(
    (slug: string) => {
      const next = availableTenants.find((t) => t.slug === slug) ?? null;
      if (!next) return;
      setOverrideTenant(next);
      setActiveTenantSlug(next.slug);
    },
    [availableTenants],
  );

  const hasFeature = useCallback(
    (flag: FeatureFlag) => Boolean(activeTenant?.features?.[flag]),
    [activeTenant],
  );

  const value = useMemo(
    () => ({
      activeTenant,
      availableTenants,
      canSwitchBrand: isPlatformAdmin && availableTenants.length > 0,
      switchBrand,
      hasFeature,
    }),
    [activeTenant, availableTenants, isPlatformAdmin, switchBrand, hasFeature],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}

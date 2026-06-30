import type { ReactNode } from 'react';
import { useTenant } from '../context/TenantContext';
import type { FeatureFlag } from '../types';

/**
 * Renders children only when the active tenant has the feature enabled (§5.4).
 * This is presentation only — the API enforces the real gate via requireFeature.
 */
export function Feature({
  flag,
  children,
  fallback = null,
}: {
  flag: FeatureFlag;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasFeature } = useTenant();
  return <>{hasFeature(flag) ? children : fallback}</>;
}

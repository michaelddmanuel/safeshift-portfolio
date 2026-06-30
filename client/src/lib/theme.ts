import type { TenantTheme } from '../types';

/** Pick black/white text for best contrast against a hex background. */
export function contrastColor(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

/** Darken (percent < 0) or lighten (percent > 0) a hex color by mixing with black/white. */
export function shade(hex: string, percent: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const mix = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  const ch = (v: number) => Math.round((mix - v) * p + v);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(ch(r))}${toHex(ch(g))}${toHex(ch(b))}`;
}

/**
 * Brand theming (§5.3): set --brand-* CSS variables on :root so utilities like
 * `bg-brand`, `bg-brand-gradient`, `text-brand` reskin the whole app instantly.
 * Used by both TenantContext (in-app) and the login page (pre-auth preview), so
 * the 3-way toggle and the login brand picker share one source of truth.
 */
export function applyBrandTheme(theme: TenantTheme | null, slug?: string | null): void {
  const root = document.documentElement;
  if (!theme) {
    root.removeAttribute('data-tenant');
    root.style.removeProperty('--brand-primary');
    root.style.removeProperty('--brand-primary-dark');
    root.style.removeProperty('--brand-secondary');
    root.style.removeProperty('--brand-accent');
    root.style.removeProperty('--brand-contrast');
    return;
  }
  if (slug) root.setAttribute('data-tenant', slug);
  root.style.setProperty('--brand-primary', theme.primary);
  root.style.setProperty('--brand-primary-dark', shade(theme.primary, -0.22));
  root.style.setProperty('--brand-secondary', theme.secondary);
  root.style.setProperty('--brand-accent', theme.accent);
  root.style.setProperty('--brand-contrast', contrastColor(theme.primary));
  root.style.setProperty('--brand-secondary-contrast', contrastColor(theme.secondary));
}

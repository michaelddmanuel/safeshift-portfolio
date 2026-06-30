import type { CSSProperties } from 'react';

/**
 * Original, non-trademarked brand marks for the SafeShift white-label demo
 * (§16 — placeholder marks, not the real Shell/Exxon/Chevron logos). Each is a
 * geometric HSE "shield" that takes the active brand colors, so it doubles as
 * the app logo, the login card logo, and the floating background marks.
 */

export interface MarkProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
  primary?: string;
  secondary?: string;
}

type BrandSlug = 'shell' | 'exxon' | 'chevron';

const BRAND_LOGOS: Record<BrandSlug, { icon: string; wordmark: string; name: string }> = {
  shell: {
    icon: '/logos/shell-icon.png',
    wordmark: '/logos/shell-wordmark.png',
    name: 'Shell',
  },
  exxon: {
    icon: '/logos/exxon-icon.png',
    wordmark: '/logos/exxon-wordmark.png',
    name: 'ExxonMobil',
  },
  chevron: {
    icon: '/logos/chevron-icon.png',
    wordmark: '/logos/chevron-wordmark.png',
    name: 'Chevron',
  },
};

function isBrandSlug(value: string | null | undefined): value is BrandSlug {
  return value === 'shell' || value === 'exxon' || value === 'chevron';
}

export function getBrandLogo(slug: string | null | undefined) {
  if (!isBrandSlug(slug)) return null;
  return BRAND_LOGOS[slug];
}

export function BrandLogo({
  slug,
  variant = 'wordmark',
  height = 28,
  className,
}: {
  slug: string | null | undefined;
  variant?: 'icon' | 'wordmark';
  height?: number;
  className?: string;
}) {
  const brand = getBrandLogo(slug);
  if (!brand) return null;

  return (
    <img
      src={variant === 'icon' ? brand.icon : brand.wordmark}
      alt={`${brand.name} logo`}
      className={className}
      style={{ height, width: 'auto' }}
    />
  );
}

/** A safety shield with a check — the SafeShift glyph, themable per brand. */
export function ShieldMark({
  size = 40,
  className,
  style,
  primary = 'var(--brand-primary, #1f2937)',
  secondary = 'var(--brand-secondary, #6b7280)',
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M24 3 6 10v12c0 11 7.6 19.5 18 23 10.4-3.5 18-12 18-23V10L24 3Z"
        fill={primary}
      />
      <path
        d="M24 3 6 10v12c0 11 7.6 19.5 18 23 10.4-3.5 18-12 18-23V10L24 3Z"
        fill="url(#shieldGrad)"
        fillOpacity="0.25"
      />
      <path
        d="m15.5 24.5 6 6 11-12"
        stroke="white"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="shieldGrad" x1="6" y1="3" x2="42" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor={secondary} stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Hexagon "molecule" mark used for the floating background elements. */
export function HexMark({
  size = 40,
  className,
  style,
  primary = 'var(--brand-primary, #1f2937)',
  secondary = 'var(--brand-secondary, #6b7280)',
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M24 2 42 12.5v23L24 46 6 35.5v-23L24 2Z"
        fill={primary}
        fillOpacity="0.9"
      />
      <path d="M24 12 33 17v10l-9 5-9-5V17l9-5Z" fill="white" fillOpacity="0.85" />
      <circle cx="24" cy="22" r="3.4" fill={secondary} />
    </svg>
  );
}

/**
 * The full SafeShift lockup: shield glyph + wordmark. `tone` controls the text
 * color for light vs. dark backgrounds.
 */
export function SafeShiftLogo({
  height = 28,
  tone = 'dark',
  brandName,
}: {
  height?: number;
  tone?: 'dark' | 'light';
  brandName?: string;
}) {
  const text = tone === 'light' ? '#ffffff' : '#0f172a';
  const sub = tone === 'light' ? 'rgba(255,255,255,0.75)' : '#64748b';
  return (
    <div className="flex items-center gap-2" style={{ height }}>
      <ShieldMark size={height} />
      <div className="leading-none">
        <span className="text-lg font-bold tracking-tight" style={{ color: text }}>
          SafeShift
        </span>
        {brandName && (
          <span className="ml-1 text-sm font-medium" style={{ color: sub }}>
            · {brandName}
          </span>
        )}
      </div>
    </div>
  );
}

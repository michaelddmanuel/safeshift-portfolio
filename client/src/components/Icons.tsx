import type { SVGProps } from 'react';

/**
 * Minimal Feather-style icon set (inline SVG, no dependency) for the app nav,
 * matching the icon-driven sidebar of the original sasol-attendance MainLayout.
 * `currentColor` so they inherit the nav link's text color.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  };
}

export function HomeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  );
}

export function ClipboardIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a3 3 0 0 1 6 0" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  );
}

export function ShieldIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3 5 5.5v5c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9v-5L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function FileEditIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
      <path d="M14 3v5h5" />
      <path d="M18.5 2.5a1.7 1.7 0 0 1 2.4 2.4L16 9.8l-3 .7.7-3 4.8-5Z" />
    </svg>
  );
}

export function UsersIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1" />
      <path d="M17.5 14.3A5.5 5.5 0 0 1 20.5 20" />
    </svg>
  );
}

export function BarChartIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

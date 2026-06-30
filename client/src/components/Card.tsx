import type { ComponentType, ReactNode, SVGProps } from 'react';
import { cn } from '../lib/utils';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'section-card rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

export function StatCard({
  label,
  value,
  hint,
  accent,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
  icon?: IconType;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  return (
    <Card
      className={cn(
        'relative overflow-hidden p-4 sm:p-5',
        accent && 'border-brand-soft',
        clickable && 'cursor-pointer transition hover:border-slate-300 hover:shadow-md',
      )}
    >
      {clickable && (
        <button
          type="button"
          aria-label={`Open ${label} details`}
          onClick={onClick}
          className="absolute inset-0 z-10"
        />
      )}
      {accent && <span className="brand-accent-stripe absolute inset-x-0 top-0 h-1" />}
      {/* Large faded brand icon in the corner (ported from the original StatsCard). */}
      {Icon && (
        <Icon
          size={88}
          className="pointer-events-none absolute -right-3 top-1/2 -translate-y-1/2 text-brand opacity-10"
        />
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold', accent ? 'text-brand' : 'text-slate-900')}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p>}
    </Card>
  );
}

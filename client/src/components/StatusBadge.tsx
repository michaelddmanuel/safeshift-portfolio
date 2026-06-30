import { cn } from '../lib/utils';
import type { CertStatus } from '../types';

const styles: Record<CertStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  expiring: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  expired: 'bg-red-50 text-red-700 ring-red-600/20',
};

const labels: Record<CertStatus, string> = {
  active: 'Active',
  expiring: 'Expiring',
  expired: 'Expired',
};

export function StatusBadge({ status }: { status: CertStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      {children}
    </span>
  );
}

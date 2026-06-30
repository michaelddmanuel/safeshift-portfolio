import { useEffect, useState } from 'react';
import { dashboardApi, certApi } from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import { Card, StatCard } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldIcon, CalendarIcon } from '../components/Icons';
import { formatDate } from '../lib/utils';
import type { CertSummary, Dashboard, Certification } from '../types';

export function ReportsAnalyticsPage() {
  const { activeTenant } = useTenant();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [summary, setSummary] = useState<CertSummary | null>(null);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([dashboardApi.get(), certApi.summary(), certApi.list()])
      .then(([d, s, c]) => {
        setDash(d);
        setSummary(s);
        setCerts(c);
      })
      .finally(() => setLoading(false));
  }, [activeTenant?.slug]);

  if (loading) return <p className="text-sm text-slate-500">Loading analytics…</p>;
  if (!summary || !dash || dash.scope !== 'tenant') {
    return (
      <div>
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="mt-2 text-sm text-slate-500">
          Select a specific brand from the top bar to view its HSE analytics.
        </p>
      </div>
    );
  }

  const { stats } = dash;
  const total = summary.total || 1;
  const expiringSoon = certs
    .filter((c) => c.status !== 'expired' && c.daysToExpiry !== null && c.daysToExpiry <= 90)
    .sort((a, b) => (a.daysToExpiry ?? 0) - (b.daysToExpiry ?? 0))
    .slice(0, 8);

  return (
    <div>
      <h1 className="page-title">Reports & Analytics</h1>
      <p className="page-subtitle">
        Audit-readiness, certification health, and upcoming expirations.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Audit readiness"
          value={`${stats.auditReadiness}%`}
          hint="workforce with current certs"
          icon={ShieldIcon}
          accent
        />
        <StatCard label="Expiring ≤30d" value={summary.expiringIn30} hint="act now" icon={CalendarIcon} />
        <StatCard label="Expiring ≤60d" value={summary.expiringIn60} hint="plan refreshers" icon={CalendarIcon} />
        <StatCard label="Expiring ≤90d" value={summary.expiringIn90} hint="forecast" icon={CalendarIcon} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-slate-700">Certification mix</p>
          <div className="mt-4 space-y-3">
            <Bar label="Active" value={summary.active} total={total} color="bg-emerald-500" />
            <Bar label="Expiring" value={summary.expiring} total={total} color="bg-amber-500" />
            <Bar label="Expired" value={summary.expired} total={total} color="bg-red-500" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
            <span className="text-slate-500">Total certifications</span>
            <span className="font-semibold text-slate-800">{summary.total}</span>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Expiring within 90 days</p>
            <span className="text-xs text-slate-400">{expiringSoon.length} flagged</span>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {expiringSoon.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {c.user?.fullName ?? 'Unknown'} · expires {formatDate(c.expiresAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.daysToExpiry !== null && (
                    <span className="text-xs font-medium text-slate-500">{c.daysToExpiry}d</span>
                  )}
                  <StatusBadge status={c.status} />
                </div>
              </li>
            ))}
            {expiringSoon.length === 0 && (
              <li className="py-3 text-sm text-slate-400">Nothing expiring in the next 90 days.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">
          {value} · {pct}%
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

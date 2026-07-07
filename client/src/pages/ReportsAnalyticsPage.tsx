import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { incidentApi } from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import {
  useCertifications,
  useCertSummary,
  useDashboard,
  useUsers,
} from '../lib/queries';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { ShieldIcon, CalendarIcon, UsersIcon, AlertTriangleIcon } from '../components/Icons';
import { cn, formatDate, roleLabel } from '../lib/utils';
import type { Certification, Incident } from '../types';

const STATUS_COLORS = {
  active: '#10b981',
  expiring: '#f59e0b',
  expired: '#ef4444',
} as const;

export function ReportsAnalyticsPage() {
  const { activeTenant, hasFeature } = useTenant();
  const { data: dash, isLoading: dashLoading } = useDashboard();
  const { data: summary, isLoading: sumLoading } = useCertSummary();
  const { data: certs = [], isLoading: certsLoading } = useCertifications();
  const { data: users = [] } = useUsers();

  const scope = activeTenant?.slug ?? 'platform';
  const isTenant = dash?.scope === 'tenant';
  const canIncidents = hasFeature('incidentReporting');
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents', scope],
    queryFn: incidentApi.list,
    enabled: canIncidents && isTenant,
  });

  const forecast = useMemo(() => certForecast(certs), [certs]);
  const byType = useMemo(() => certsByType(certs), [certs]);
  const atRisk = useMemo(
    () =>
      users
        .filter((u) => u.isActive && (u.certs.expired > 0 || u.certs.expiring > 0))
        .sort((a, b) => b.certs.expired - a.certs.expired || b.certs.expiring - a.certs.expiring)
        .slice(0, 6),
    [users],
  );

  if (dashLoading || sumLoading || certsLoading) {
    return <p className="text-sm text-slate-500">Loading analytics…</p>;
  }
  if (!summary || !dash || dash.scope !== 'tenant') {
    return (
      <div>
        <h1 className="page-title">Reports &amp; Analytics</h1>
        <p className="mt-2 text-sm text-slate-500">
          Select a specific brand from the top bar to view its HSE analytics.
        </p>
      </div>
    );
  }

  const { stats } = dash;
  const donutData = [
    { label: 'Active', value: summary.active, color: STATUS_COLORS.active },
    { label: 'Expiring', value: summary.expiring, color: STATUS_COLORS.expiring },
    { label: 'Expired', value: summary.expired, color: STATUS_COLORS.expired },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Reports &amp; Analytics</h1>
          <p className="page-subtitle">
            Audit-readiness, certification health, expiry forecasting, and workforce risk for{' '}
            {activeTenant?.displayName ?? 'this brand'}.
          </p>
        </div>
        <Button variant="outline" onPress={() => exportCsv(certs)} isDisabled={certs.length === 0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
            <path d="M5 21h14" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Audit readiness"
          value={`${stats.auditReadiness}%`}
          hint="workforce with current certs"
          icon={ShieldIcon}
          accent
        />
        <StatCard label="Total certifications" value={summary.total} hint={`${stats.workforce} workers`} icon={UsersIcon} />
        <StatCard label="Expiring ≤30d" value={summary.expiringIn30} hint="act now" icon={CalendarIcon} />
        <StatCard label="Expired" value={summary.expired} hint="out of compliance" icon={AlertTriangleIcon} />
      </div>

      {/* Donut + expiry forecast */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-slate-700">Certification status</p>
          <div className="mt-2 flex items-center gap-6">
            <DonutChart data={donutData} total={summary.total} />
            <div className="space-y-2.5">
              {donutData.map((d) => {
                const pct = summary.total ? Math.round((d.value / summary.total) * 100) : 0;
                return (
                  <div key={d.label} className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-slate-600">{d.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{d.value}</span>
                    <span className="text-xs text-slate-400">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-700">Expiry forecast</p>
          <p className="text-xs text-slate-400">When current certifications lapse</p>
          <div className="mt-4 space-y-3">
            <BarRow label="Overdue" value={forecast.overdue} max={forecast.max} color="bg-red-500" />
            <BarRow label="Next 30 days" value={forecast.d30} max={forecast.max} color="bg-amber-500" />
            <BarRow label="31–60 days" value={forecast.d60} max={forecast.max} color="bg-amber-400" />
            <BarRow label="61–90 days" value={forecast.d90} max={forecast.max} color="bg-sky-400" />
            <BarRow label="90+ days" value={forecast.later} max={forecast.max} color="bg-emerald-500" />
            {forecast.noExpiry > 0 && (
              <BarRow label="No expiry" value={forecast.noExpiry} max={forecast.max} color="bg-slate-300" />
            )}
          </div>
        </Card>
      </div>

      {/* Certs by type + at-risk workers */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="text-sm font-semibold text-slate-700">Certifications by type</p>
          <div className="mt-4 space-y-3">
            {byType.length === 0 && <p className="text-sm text-slate-400">No certifications on record.</p>}
            {byType.map((t) => (
              <div key={t.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-3 font-medium text-slate-700">{t.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{t.total}</span>
                </div>
                <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span className="h-full bg-emerald-500" style={{ width: `${(t.active / t.total) * 100}%` }} />
                  <span className="h-full bg-amber-500" style={{ width: `${(t.expiring / t.total) * 100}%` }} />
                  <span className="h-full bg-red-500" style={{ width: `${(t.expired / t.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-700">Top at-risk workers</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {atRisk.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{u.fullName}</p>
                  <p className="truncate text-xs text-slate-400">{roleLabel(u.role)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {u.certs.expired > 0 && (
                    <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                      {u.certs.expired} expired
                    </span>
                  )}
                  {u.certs.expiring > 0 && (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                      {u.certs.expiring} expiring
                    </span>
                  )}
                </div>
              </li>
            ))}
            {atRisk.length === 0 && (
              <li className="py-3 text-sm text-slate-400">Everyone is compliant. 🎉</li>
            )}
          </ul>
        </Card>
      </div>

      {/* Incident analytics (feature-gated) */}
      {canIncidents && incidents.length > 0 && <IncidentAnalytics incidents={incidents} />}
    </div>
  );
}

// ── Incident analytics ─────────────────────────────────────────────────────
function IncidentAnalytics({ incidents }: { incidents: Incident[] }) {
  const recordable = incidents.filter((i) => i.oshaRecordable).length;
  const open = incidents.filter((i) => i.status !== 'closed').length;
  const nearMiss = incidents.filter((i) => i.type === 'near-miss').length;

  const byType = groupCount(incidents.map((i) => i.type));
  const bySeverity = groupCount(incidents.map((i) => i.severity));
  const typeMax = Math.max(1, ...byType.map((b) => b.count));
  const sevMax = Math.max(1, ...bySeverity.map((b) => b.count));

  const SEV_COLOR: Record<string, string> = {
    low: 'bg-slate-400',
    medium: 'bg-amber-400',
    high: 'bg-orange-500',
    critical: 'bg-red-600',
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">Incident analytics</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total incidents" value={incidents.length} icon={AlertTriangleIcon} accent />
        <StatCard label="OSHA recordable" value={recordable} hint="on the 300 Log" icon={ShieldIcon} />
        <StatCard label="Open cases" value={open} hint="awaiting closure" />
        <StatCard label="Near misses" value={nearMiss} hint="leading indicators" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-slate-700">By type</p>
          <div className="mt-4 space-y-3">
            {byType.map((b) => (
              <BarRow key={b.key} label={labelize(b.key)} value={b.count} max={typeMax} color="bg-brand" />
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-700">By severity</p>
          <div className="mt-4 space-y-3">
            {bySeverity.map((b) => (
              <BarRow
                key={b.key}
                label={labelize(b.key)}
                value={b.count}
                max={sevMax}
                color={SEV_COLOR[b.key] ?? 'bg-slate-400'}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Charts & rows ────────────────────────────────────────────────────────────
function DonutChart({
  data,
  total,
  size = 148,
  thickness = 22,
}: {
  data: { label: string; value: number; color: string }[];
  total: number;
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const sum = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <g transform={`rotate(-90 ${cx} ${cx})`}>
        {sum === 0 ? (
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={thickness} />
        ) : (
          data.map((d) => {
            const dash = (d.value / sum) * c;
            const el = (
              <circle
                key={d.label}
                cx={cx}
                cy={cx}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })
        )}
      </g>
      <text x={cx} y={cx - 4} textAnchor="middle" className="fill-slate-900 text-2xl font-bold">
        {total}
      </text>
      <text x={cx} y={cx + 14} textAnchor="middle" className="fill-slate-400 text-[11px] font-medium">
        certs
      </text>
    </svg>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Data helpers ─────────────────────────────────────────────────────────────
function certForecast(certs: Certification[]) {
  const b = { overdue: 0, d30: 0, d60: 0, d90: 0, later: 0, noExpiry: 0 };
  for (const c of certs) {
    const d = c.daysToExpiry;
    if (d === null) b.noExpiry += 1;
    else if (d < 0) b.overdue += 1;
    else if (d <= 30) b.d30 += 1;
    else if (d <= 60) b.d60 += 1;
    else if (d <= 90) b.d90 += 1;
    else b.later += 1;
  }
  const max = Math.max(1, b.overdue, b.d30, b.d60, b.d90, b.later, b.noExpiry);
  return { ...b, max };
}

function certsByType(certs: Certification[]) {
  const map = new Map<string, { name: string; active: number; expiring: number; expired: number; total: number }>();
  for (const c of certs) {
    const row = map.get(c.name) ?? { name: c.name, active: 0, expiring: 0, expired: 0, total: 0 };
    row[c.status] += 1;
    row.total += 1;
    map.set(c.name, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function groupCount(values: string[]): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function labelize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

function exportCsv(certs: Certification[]): void {
  const header = ['Holder', 'Role', 'Certification', 'Course code', 'Issuer', 'Issued', 'Expires', 'Status', 'Days to expiry'];
  const rows = certs.map((c) => [
    c.user?.fullName ?? '',
    c.user ? roleLabel(c.user.role) : '',
    c.name,
    c.courseCode ?? '',
    c.issuer ?? '',
    c.issuedAt,
    c.expiresAt ?? '',
    c.status,
    c.daysToExpiry ?? '',
  ]);
  const csv = [header, ...rows]
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `safeshift-certifications-${formatDate(new Date().toISOString()).replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

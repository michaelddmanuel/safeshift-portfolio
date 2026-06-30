import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import { Card, StatCard } from '../components/Card';
import { Pill } from '../components/StatusBadge';
import { ShieldIcon, UsersIcon, CalendarIcon, BarChartIcon } from '../components/Icons';
import { formatDateTime } from '../lib/utils';
import type { Dashboard } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { activeTenant } = useTenant();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .get()
      .then(setData)
      .finally(() => setLoading(false));
  }, [activeTenant?.slug]);

  if (loading) return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  if (!data) return <p className="text-sm text-slate-500">No data.</p>;

  if (data.scope === 'platform') {
    return (
      <div className="space-y-6">
        <section className="section-card rounded-2xl p-6 sm:p-8">
          <p className="muted-kicker">Executive console</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Platform overview</h1>
          <p className="page-subtitle">
          Cross-tenant view. Use the brand toggle in the top bar to enter a specific brand.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard label="Tenants" value={data.tenants.length} hint="active brands" icon={ShieldIcon} accent />
            <StatCard
              label="Workforce"
              value={data.tenants.reduce((sum, t) => sum + t.users, 0)}
              hint="cross-tenant headcount"
              icon={UsersIcon}
            />
            <StatCard
              label="Certifications"
              value={data.tenants.reduce((sum, t) => sum + t.certifications, 0)}
              hint="tracked credentials"
              icon={BarChartIcon}
            />
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-3">
          {data.tenants.map((t) => (
            <Card key={t.slug}>
              <p className="text-lg font-semibold text-slate-900">{t.displayName}</p>
              <dl className="mt-3 space-y-1 text-sm text-slate-600">
                <div className="flex justify-between">
                  <dt>Workforce</dt>
                  <dd className="font-medium">{t.users}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Trainings</dt>
                  <dd className="font-medium">{t.trainings}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Certifications</dt>
                  <dd className="font-medium">{t.certifications}</dd>
                </div>
              </dl>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-slate-800"
                  style={{ width: `${Math.min(100, Math.round((t.certifications / Math.max(1, t.users)) * 20))}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { stats, recentTrainings } = data;
  const certTotal = Math.max(stats.certifications, 1);
  const riskScore = Math.round(((stats.certStatus.expired * 2 + stats.certStatus.expiring) / certTotal) * 100);
  const completionScore = Math.max(0, Math.min(100, stats.auditReadiness));
  const trainingLoad = Math.round((stats.upcomingTrainings / Math.max(stats.workforce, 1)) * 100);
  const actionItems = buildActionItems(stats);

  return (
    <div className="space-y-6">
      <section className="section-card relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <span className="absolute inset-x-0 top-0 h-px bg-slate-200" />
        <p className="muted-kicker">Operations</p>
        <div className="mt-2 flex flex-wrap items-center gap-5">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">HSE Command Dashboard</h1>
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            System online
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          Live readiness score, workforce posture, and certification risk across your active sites.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ScoreTile
            title="Readiness"
            value={`${completionScore}%`}
            tone="good"
            onClick={() => navigate('/certifications?status=active')}
          />
          <ScoreTile
            title="Risk score"
            value={`${riskScore}%`}
            tone={riskScore >= 35 ? 'high' : 'watch'}
            onClick={() => navigate('/certifications?status=expired')}
          />
          <ScoreTile
            title="Training load"
            value={`${trainingLoad}%`}
            tone={trainingLoad >= 30 ? 'watch' : 'good'}
            onClick={() => navigate('/trainings?status=scheduled')}
          />
        </div>
      </section>

      <div>
        <p className="muted-kicker">Snapshot</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Audit readiness"
          value={`${stats.auditReadiness}%`}
          hint="workforce with current certs"
          icon={ShieldIcon}
          accent
          onClick={() => navigate('/certifications?status=active')}
        />
        <StatCard
          label="Workforce"
          value={stats.workforce}
          hint="employees + contractors"
          icon={UsersIcon}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          label="Upcoming training"
          value={stats.upcomingTrainings}
          hint="scheduled sessions"
          icon={CalendarIcon}
          onClick={() => navigate('/trainings?status=scheduled')}
        />
        <StatCard
          label="Certifications"
          value={stats.certifications}
          hint={`${stats.certStatus.expiring} expiring · ${stats.certStatus.expired} expired`}
          icon={BarChartIcon}
          onClick={() => navigate('/certifications')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <p className="text-sm font-semibold text-slate-700">Risk radar</p>
          <p className="mt-1 text-xs text-slate-500">Derived from live certifications and workforce load.</p>
          <div className="mt-4 space-y-3">
            <CertBar
              label="Critical risk"
              value={stats.certStatus.expired}
              total={stats.certifications}
              color="bg-slate-700"
              onClick={() => navigate('/certifications?status=expired')}
            />
            <CertBar
              label="Watchlist"
              value={stats.certStatus.expiring}
              total={stats.certifications}
              color="bg-slate-500"
              onClick={() => navigate('/certifications?status=expiring')}
            />
            <CertBar
              label="Healthy"
              value={stats.certStatus.active}
              total={stats.certifications}
              color="bg-slate-300"
              onClick={() => navigate('/certifications?status=active')}
            />
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended actions</p>
            <ul className="mt-2 space-y-2">
              {actionItems.map((item) => (
                <li key={item} className="text-sm text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="xl:col-span-8">
          <p className="text-sm font-semibold text-slate-700">Recent & upcoming training</p>
          <p className="mt-1 text-xs text-slate-500">Operations timeline for scheduled and recently completed sessions.</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {recentTrainings.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(t.scheduledAt)}</p>
                </div>
                <Pill>{t.status}</Pill>
              </li>
            ))}
            {recentTrainings.length === 0 && (
              <li className="py-3 text-sm text-slate-400">No training scheduled.</li>
            )}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <p className="text-sm font-semibold text-slate-700">Certification health matrix</p>
          <p className="mt-1 text-xs text-slate-500">Balance readiness against renewal backlog with status distribution.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricPanel title="Active" value={stats.certStatus.active} pct={pct(stats.certStatus.active, stats.certifications)} color="soft" />
            <MetricPanel title="Expiring" value={stats.certStatus.expiring} pct={pct(stats.certStatus.expiring, stats.certifications)} color="muted" />
            <MetricPanel title="Expired" value={stats.certStatus.expired} pct={pct(stats.certStatus.expired, stats.certifications)} color="strong" />
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-700">Readiness dial</p>
          <div className="mt-5 flex items-center justify-center">
            <Dial score={completionScore} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function buildActionItems(stats: {
  certStatus: { active: number; expiring: number; expired: number };
  upcomingTrainings: number;
  workforce: number;
}) {
  const items: string[] = [];
  if (stats.certStatus.expired > 0) {
    items.push(`Escalate ${stats.certStatus.expired} expired certification record(s) for immediate renewal.`);
  }
  if (stats.certStatus.expiring > 0) {
    items.push(`Pre-book recertification for ${stats.certStatus.expiring} expiring worker(s).`);
  }
  if (stats.upcomingTrainings < Math.ceil(stats.workforce * 0.08)) {
    items.push('Increase upcoming training sessions to maintain quarterly readiness coverage.');
  }
  if (items.length === 0) {
    items.push('No immediate actions. Maintain current cadence and continue weekly certification scans.');
  }
  return items;
}

function ScoreTile({
  title,
  value,
  onClick,
}: {
  title: string;
  value: string;
  tone: 'good' | 'watch' | 'high';
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 ' +
        (clickable ? 'cursor-pointer transition hover:border-slate-300 hover:shadow-sm' : '')
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </button>
  );
}

function MetricPanel({
  title,
  value,
  pct,
  color,
}: {
  title: string;
  value: number;
  pct: number;
  color: 'soft' | 'muted' | 'strong';
}) {
  const palette = {
    soft: 'border-slate-200 bg-slate-50 text-slate-700',
    muted: 'border-slate-200 bg-slate-100 text-slate-700',
    strong: 'border-slate-300 bg-slate-200 text-slate-800',
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${palette[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80">{pct}% of certificates</p>
    </div>
  );
}

function Dial({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));
  return (
    <div
      className="flex h-36 w-36 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--brand-primary) ${safeScore * 3.6}deg, #e2e8f0 0deg)`,
      }}
    >
      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
        <p className="text-3xl font-bold text-slate-900">{safeScore}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness</p>
      </div>
    </div>
  );
}

function CertBar({
  label,
  value,
  total,
  color,
  onClick,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  onClick?: () => void;
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full cursor-pointer text-left"
      aria-label={`Open ${label} certifications`}
    >
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

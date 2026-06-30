import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Skeleton, StatGridSkeleton } from '../components/Skeleton';
import { useCertifications, useCertSummary, useRunCertScan } from '../lib/queries';
import { formatDate } from '../lib/utils';

const CAN_SCAN = ['platform_admin', 'hse_manager', 'supervisor'];
const STATUS_FILTERS = ['all', 'active', 'expiring', 'expired'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function CertificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: certs = [], isLoading } = useCertifications();
  const { data: summary } = useCertSummary();
  const scan = useRunCertScan();

  const canScan = user ? CAN_SCAN.includes(user.role) : false;
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter;

  const filteredCerts = certs.filter((c) => statusFilter === 'all' || c.status === statusFilter);

  function setStatusFilter(next: StatusFilter) {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'all') nextParams.delete('status');
    else nextParams.set('status', next);
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Certification & Expiry Tracker</h1>
          <p className="page-subtitle">
            Are we audit-ready right now? Track OSHA, HAZWOPER, H2S, LOTO and more — with expiry
            alerts before they lapse.
          </p>
        </div>
        {canScan && (
          <Button variant="outline" onPress={() => scan.mutate()} isDisabled={scan.isPending}>
            {scan.isPending ? 'Scanning…' : 'Run expiry scan'}
          </Button>
        )}
      </div>

      {summary ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total certifications" value={summary.total} hint="across active workforce" accent />
          <StatCard label="Active" value={summary.active} />
          <StatCard
            label="Expiring soon"
            value={summary.expiring}
            hint={`${summary.expiringIn30} within 30 days`}
          />
          <StatCard label="Expired" value={summary.expired} hint="action required" />
        </div>
      ) : (
        <div className="mt-6">
          <StatGridSkeleton />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const active = s === statusFilter;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition ' +
                (active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
              }
            >
              {s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}
            </button>
          );
        })}
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : filteredCerts.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">No certifications on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Certification</th>
                  <th className="px-5 py-3 font-semibold">Holder</th>
                  <th className="px-5 py-3 font-semibold">Issued</th>
                  <th className="px-5 py-3 font-semibold">Expires</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCerts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{c.name}</p>
                      {c.issuer && <p className="text-xs text-slate-400">{c.issuer}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.user?.fullName ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(c.issuedAt)}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(c.expiresAt)}
                      {c.daysToExpiry !== null && (
                        <span
                          className={
                            c.daysToExpiry < 0
                              ? 'ml-1 text-xs text-red-500'
                              : c.daysToExpiry <= 60
                                ? 'ml-1 text-xs text-amber-600'
                                : 'ml-1 text-xs text-slate-400'
                          }
                        >
                          ({c.daysToExpiry < 0 ? `${-c.daysToExpiry}d overdue` : `${c.daysToExpiry}d`})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

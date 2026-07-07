import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Skeleton, StatGridSkeleton } from '../components/Skeleton';
import { useCertifications, useCertSummary, useRunCertScan } from '../lib/queries';
import { formatDate, roleLabel } from '../lib/utils';
import type { Certification } from '../types';

const CAN_SCAN = ['platform_admin', 'hse_manager', 'supervisor'];
const STATUS_FILTERS = ['all', 'active', 'expiring', 'expired'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function CertificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: certs = [], isLoading } = useCertifications();
  const { data: summary } = useCertSummary();
  const scan = useRunCertScan();
  const [selected, setSelected] = useState<Certification | null>(null);

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
                  <th className="px-5 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCerts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelected(c);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${c.name}`}
                    className="cursor-pointer transition hover:bg-brand-soft/40 focus:bg-brand-soft/50 focus:outline-none"
                  >
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
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                        View
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CertDetailModal cert={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function CertDetailModal({ cert, onClose }: { cert: Certification | null; onClose: () => void }) {
  return (
    <Modal
      isOpen={cert !== null}
      onOpenChange={(open) => !open && onClose()}
      title={cert?.name ?? 'Certification'}
      description={cert?.issuer ? `Issued by ${cert.issuer}` : undefined}
    >
      {cert && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={cert.status} />
            {cert.daysToExpiry !== null && (
              <span
                className={
                  cert.daysToExpiry < 0
                    ? 'text-sm font-semibold text-red-600'
                    : cert.daysToExpiry <= 60
                      ? 'text-sm font-semibold text-amber-600'
                      : 'text-sm font-semibold text-slate-500'
                }
              >
                {cert.daysToExpiry < 0
                  ? `${-cert.daysToExpiry} days overdue`
                  : `${cert.daysToExpiry} days remaining`}
              </span>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4">
            <DetailRow
              label="Holder"
              value={
                cert.user ? (
                  <span>
                    {cert.user.fullName}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      · {roleLabel(cert.user.role)}
                    </span>
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <DetailRow label="Course code" value={cert.courseCode ?? '—'} />
            <DetailRow label="Issued" value={formatDate(cert.issuedAt)} />
            <DetailRow label="Expires" value={cert.expiresAt ? formatDate(cert.expiresAt) : 'No expiry'} />
            <DetailRow label="Issuer" value={cert.issuer ?? '—'} />
            <DetailRow label="Status" value={<StatusBadge status={cert.status} />} />
          </dl>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Verification document
            </p>
            {cert.fileUrl ? (
              <a
                href={cert.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5" />
                </svg>
                View certificate file
              </a>
            ) : (
              <p className="mt-1 text-sm text-slate-400">No file on record for this certification.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

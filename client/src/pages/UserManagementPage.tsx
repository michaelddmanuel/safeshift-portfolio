import { useEffect, useMemo, useState } from 'react';
import { userApi } from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import { Card, StatCard } from '../components/Card';
import { Pill } from '../components/StatusBadge';
import { UsersIcon, ShieldIcon } from '../components/Icons';
import { cn } from '../lib/utils';
import type { ManagedUser, Role } from '../types';

const ROLE_LABEL: Record<Role, string> = {
  platform_admin: 'Platform admin',
  hse_manager: 'HSE manager',
  supervisor: 'Supervisor',
  worker: 'Worker',
  contractor: 'Contractor',
  auditor: 'Auditor',
};

export function UserManagementPage() {
  const { activeTenant } = useTenant();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  useEffect(() => {
    setLoading(true);
    userApi
      .list()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [activeTenant?.slug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const contractors = users.filter((u) => u.isContractor).length;
  const atRisk = users.filter((u) => u.certs.expired > 0).length;

  return (
    <div>
      <h1 className="page-title">User Management</h1>
      <p className="page-subtitle">
        Workforce directory with certification readiness per person.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Workforce" value={users.length} hint="employees + contractors" icon={UsersIcon} accent />
        <StatCard label="Contractors" value={contractors} hint="ISN-gated site access" icon={UsersIcon} />
        <StatCard label="At-risk" value={atRisk} hint="have an expired certification" icon={ShieldIcon} />
      </div>

      <Card className="mt-6 p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, employee ID…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-1">
            {(['all', 'hse_manager', 'supervisor', 'worker', 'contractor'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  roleFilter === r
                    ? 'bg-brand text-brand-contrast'
                    : 'bg-slate-100 text-slate-600 hover:bg-brand-soft hover:text-brand',
                )}
              >
                {r === 'all' ? 'All' : ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Employee ID</th>
                  <th className="px-4 py-3 font-medium">Certifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-soft/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-contrast">
                          {u.firstName[0]}
                          {u.lastName[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">{u.fullName}</p>
                          <p className="truncate text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600">{ROLE_LABEL[u.role]}</span>
                        {u.isContractor && <Pill>Contractor</Pill>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.employeeId ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <CertCount n={u.certs.active} tone="emerald" label="active" />
                        <CertCount n={u.certs.expiring} tone="amber" label="expiring" />
                        <CertCount n={u.certs.expired} tone="red" label="expired" />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                      No users match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function CertCount({
  n,
  tone,
  label,
}: {
  n: number;
  tone: 'emerald' | 'amber' | 'red';
  label: string;
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <span
      title={`${n} ${label}`}
      className={cn(
        'inline-flex min-w-[1.75rem] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold',
        n === 0 ? 'bg-slate-50 text-slate-300' : tones[tone],
      )}
    >
      {n}
    </span>
  );
}

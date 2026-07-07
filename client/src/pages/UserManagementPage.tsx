import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useSetUserActive,
} from '../lib/queries';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { Pill } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { UsersIcon, ShieldIcon } from '../components/Icons';
import { cn, roleLabel } from '../lib/utils';
import type { AssignableRole, ManagedUser, NewUser, Role } from '../types';

const ASSIGNABLE_ROLES: AssignableRole[] = [
  'hse_manager',
  'supervisor',
  'worker',
  'contractor',
  'auditor',
];

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { activeTenant } = useTenant();
  const { data: users = [], isLoading } = useUsers();
  const setActive = useSetUserActive();

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState<{ open: boolean; editing: ManagedUser | null }>({
    open: false,
    editing: null,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (!showInactive && !u.isActive) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.employeeId ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter, showInactive]);

  const activeUsers = users.filter((u) => u.isActive);
  const contractors = activeUsers.filter((u) => u.isContractor).length;
  const atRisk = activeUsers.filter((u) => u.certs.expired > 0).length;
  const inactiveCount = users.length - activeUsers.length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Add, edit, and manage the {activeTenant?.displayName ?? 'workforce'} directory with
            certification readiness per person.
          </p>
        </div>
        <Button onPress={() => setForm({ open: true, editing: null })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add user
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Workforce" value={activeUsers.length} hint="active employees + contractors" icon={UsersIcon} accent />
        <StatCard label="Contractors" value={contractors} hint="ISN-gated site access" icon={UsersIcon} />
        <StatCard label="At-risk" value={atRisk} hint="have an expired certification" icon={ShieldIcon} />
      </div>

      <Card className="mt-6 p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, employee ID…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand lg:max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-1">
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
                {r === 'all' ? 'All' : roleLabel(r)}
              </button>
            ))}
            {inactiveCount > 0 && (
              <button
                onClick={() => setShowInactive((v) => !v)}
                className={cn(
                  'ml-1 rounded-full px-3 py-1 text-xs font-medium transition',
                  showInactive
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {showInactive ? 'Hide' : 'Show'} deactivated ({inactiveCount})
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
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
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className={cn('hover:bg-brand-soft/40', !u.isActive && 'opacity-60')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                              u.isActive ? 'bg-brand text-brand-contrast' : 'bg-slate-300 text-white',
                            )}
                          >
                            {u.firstName[0]}
                            {u.lastName[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate font-medium text-slate-800">
                              {u.fullName}
                              {!u.isActive && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                                  Deactivated
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-600">{roleLabel(u.role)}</span>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setForm({ open: true, editing: u })}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            Edit
                          </button>
                          {u.isActive ? (
                            <button
                              onClick={() => setActive.mutate({ id: u.id, isActive: false })}
                              disabled={isSelf || setActive.isPending}
                              title={isSelf ? 'You cannot deactivate your own account' : undefined}
                              className="text-xs font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => setActive.mutate({ id: u.id, isActive: true })}
                              disabled={setActive.isPending}
                              className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                      No users match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <UserFormModal
        open={form.open}
        editing={form.editing}
        onClose={() => setForm({ open: false, editing: null })}
      />
    </div>
  );
}

// ── Add / edit form ───────────────────────────────────────────────────────────
interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  role: AssignableRole;
  employeeId: string;
  phone: string;
  isContractor: boolean;
  password: string;
}

function fromUser(u: ManagedUser | null): FormState {
  return {
    firstName: u?.firstName ?? '',
    lastName: u?.lastName ?? '',
    email: u?.email ?? '',
    role: (u && u.role !== 'platform_admin' ? u.role : 'worker') as AssignableRole,
    employeeId: u?.employeeId ?? '',
    phone: u?.phone ?? '',
    isContractor: u?.isContractor ?? false,
    password: '',
  };
}

function UserFormModal({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: ManagedUser | null;
  onClose: () => void;
}) {
  const create = useCreateUser();
  const update = useUpdateUser();
  const [form, setForm] = useState<FormState>(fromUser(null));

  useEffect(() => {
    if (open) setForm(fromUser(editing));
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const valid = form.firstName.trim() && form.lastName.trim() && /.+@.+\..+/.test(form.email);
  const pending = create.isPending || update.isPending;

  function submit() {
    if (!valid) return;
    const payload: NewUser = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      role: form.role,
      employeeId: form.employeeId.trim() || undefined,
      phone: form.phone.trim() || undefined,
      isContractor: form.isContractor,
    };
    if (editing) {
      update.mutate({ id: editing.id, body: payload }, { onSuccess: onClose });
    } else {
      create.mutate({ ...payload, password: form.password.trim() || undefined }, { onSuccess: onClose });
    }
  }

  return (
    <Modal
      isOpen={open}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? 'Edit user' : 'Add user'}
      description={
        editing
          ? `Update ${editing.fullName}'s profile and role.`
          : 'New members can sign in with the default password (Passw0rd!) unless you set one.'
      }
      footer={
        <>
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={submit} isDisabled={!valid || pending}>
            {pending ? 'Saving…' : editing ? 'Save changes' : 'Add user'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input className={inputCls} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </Field>
        <Field label="Last name">
          <input className={inputCls} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </Field>
        <Field label="Email" full>
          <input
            type="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="name@brand.safeshift.app"
          />
        </Field>
        <Field label="Role">
          <select
            className={inputCls}
            value={form.role}
            onChange={(e) => {
              const role = e.target.value as AssignableRole;
              setForm((f) => ({ ...f, role, isContractor: role === 'contractor' ? true : f.isContractor }));
            }}
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Employee ID">
          <input className={inputCls} value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Phone">
          <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Optional" />
        </Field>
        {!editing && (
          <Field label="Temporary password">
            <input
              type="text"
              className={inputCls}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Defaults to Passw0rd!"
            />
          </Field>
        )}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.isContractor}
          onChange={(e) => set('isContractor', e.target.checked)}
        />
        Contractor (ISN-gated site access)
      </label>
    </Modal>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={cn('block', full && 'sm:col-span-2')}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
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

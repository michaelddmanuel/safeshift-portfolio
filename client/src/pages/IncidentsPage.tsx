import { useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard } from '../components/Card';
import { Button } from '../components/Button';
import { StatGridSkeleton, ListSkeleton } from '../components/Skeleton';
import { AlertTriangleIcon, ShieldIcon, ClipboardIcon, BarChartIcon } from '../components/Icons';
import { useCreateIncident, useIncidentSummary, useIncidents, useUpdateIncident } from '../lib/queries';
import { formatDate, formatDateTime } from '../lib/utils';
import type { IncidentUpdate } from '../api/endpoints';
import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  InjuryCategory,
  NewIncident,
  OshaClassification,
} from '../types';

const ADMIN_ROLES = ['platform_admin', 'hse_manager', 'supervisor'];

const TYPE_OPTIONS: { value: IncidentType; label: string }[] = [
  { value: 'injury', label: 'Injury' },
  { value: 'illness', label: 'Illness' },
  { value: 'near-miss', label: 'Near miss' },
  { value: 'property-damage', label: 'Property damage' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'first-aid', label: 'First aid' },
];
const SEVERITY_OPTIONS: IncidentSeverity[] = ['low', 'medium', 'high', 'critical'];
const STATUS_OPTIONS: IncidentStatus[] = ['open', 'investigating', 'action-pending', 'closed'];
const CLASS_OPTIONS: { value: OshaClassification; label: string }[] = [
  { value: 'death', label: 'Death (col. G)' },
  { value: 'days-away', label: 'Days away from work (col. H)' },
  { value: 'restricted', label: 'Restricted / transfer (col. I)' },
  { value: 'other-recordable', label: 'Other recordable (col. J)' },
];
const INJURY_OPTIONS: { value: InjuryCategory; label: string }[] = [
  { value: 'injury', label: 'Injury' },
  { value: 'skin-disorder', label: 'Skin disorder' },
  { value: 'respiratory', label: 'Respiratory condition' },
  { value: 'poisoning', label: 'Poisoning' },
  { value: 'hearing-loss', label: 'Hearing loss' },
  { value: 'other-illness', label: 'Other illness' },
];

export function IncidentsPage() {
  const { user } = useAuth();
  const isAdmin = user ? ADMIN_ROLES.includes(user.role) : false;
  const { data: incidents = [], isLoading } = useIncidents();
  const { data: summary } = useIncidentSummary();
  const [view, setView] = useState<'list' | 'osha'>('list');
  const [reporting, setReporting] = useState(false);

  const recordables = incidents.filter((i) => i.oshaRecordable);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Incident &amp; Investigation</h1>
          <p className="page-subtitle">
            Report near misses through recordable injuries, investigate root cause and corrective
            actions, and auto-build your OSHA 300 Log (29 CFR 1904).
          </p>
        </div>
        <Button onPress={() => setReporting((v) => !v)}>
          {reporting ? 'Close' : 'Report incident'}
        </Button>
      </div>

      {reporting && <ReportForm onDone={() => setReporting(false)} />}

      {summary ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total incidents" value={summary.total} hint="this period" icon={AlertTriangleIcon} accent />
          <StatCard label="OSHA recordable" value={summary.recordable} hint="on the 300 Log" icon={ShieldIcon} />
          <StatCard label="Open cases" value={summary.open} hint="awaiting closure" icon={ClipboardIcon} />
          <StatCard
            label="Days away / restricted"
            value={`${summary.daysAway} / ${summary.daysRestricted}`}
            hint={`${summary.nearMiss} near miss${summary.nearMiss === 1 ? '' : 'es'}`}
            icon={BarChartIcon}
          />
        </div>
      ) : (
        <div className="mt-6">
          <StatGridSkeleton />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <ViewTab active={view === 'list'} onClick={() => setView('list')}>
          Incidents ({incidents.length})
        </ViewTab>
        <ViewTab active={view === 'osha'} onClick={() => setView('osha')}>
          OSHA 300 Log ({recordables.length})
        </ViewTab>
      </div>

      {isLoading ? (
        <div className="mt-6">
          <ListSkeleton />
        </div>
      ) : view === 'list' ? (
        <div className="mt-6 space-y-3">
          {incidents.map((i) => (
            <IncidentCard key={i.id} incident={i} canManage={isAdmin} />
          ))}
          {incidents.length === 0 && (
            <p className="text-sm text-slate-400">No incidents reported. Stay safe out there.</p>
          )}
        </div>
      ) : (
        <Osha300Log incidents={recordables} />
      )}
    </div>
  );
}

// ── Report form ───────────────────────────────────────────────────────────────
function ReportForm({ onDone }: { onDone: () => void }) {
  const create = useCreateIncident();
  const [form, setForm] = useState<NewIncident>({
    type: 'near-miss',
    severity: 'low',
    title: '',
    description: '',
    occurredAt: new Date().toISOString().slice(0, 16),
    location: '',
    oshaRecordable: false,
  });

  function set<K extends keyof NewIncident>(key: K, value: NewIncident[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    if (!form.title.trim()) return;
    const payload: NewIncident = {
      ...form,
      occurredAt: new Date(form.occurredAt).toISOString(),
    };
    create.mutate(payload, { onSuccess: onDone });
  }

  return (
    <Card className="mt-6">
      <p className="text-sm font-semibold text-slate-700">Report an incident</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Select value={form.type} onChange={(v) => set('type', v as IncidentType)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Severity">
          <Select value={form.severity ?? 'low'} onChange={(v) => set('severity', v as IncidentSeverity)}>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s} value={s}>{cap(s)}</option>
            ))}
          </Select>
        </Field>
        <Field label="What happened?" full>
          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Short summary (e.g. Hand laceration during valve maintenance)"
          />
        </Field>
        <Field label="Details" full>
          <textarea
            className={inputCls}
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Describe the sequence of events, contributing factors, and immediate actions taken."
          />
        </Field>
        <Field label="When">
          <input
            type="datetime-local"
            className={inputCls}
            value={form.occurredAt}
            onChange={(e) => set('occurredAt', e.target.value)}
          />
        </Field>
        <Field label="Location">
          <input
            className={inputCls}
            value={form.location ?? ''}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Unit / area"
          />
        </Field>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.oshaRecordable ?? false}
          onChange={(e) => set('oshaRecordable', e.target.checked)}
        />
        Potentially OSHA recordable (HSE will confirm)
      </label>

      {form.oshaRecordable && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Classification">
            <Select
              value={form.oshaClassification ?? 'other-recordable'}
              onChange={(v) => set('oshaClassification', v as OshaClassification)}
            >
              {CLASS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Days away">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.daysAway ?? 0}
              onChange={(e) => set('daysAway', Number(e.target.value))}
            />
          </Field>
          <Field label="Days restricted">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.daysRestricted ?? 0}
              onChange={(e) => set('daysRestricted', Number(e.target.value))}
            />
          </Field>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <Button onPress={submit} isDisabled={create.isPending || !form.title.trim()}>
          {create.isPending ? 'Submitting…' : 'Submit report'}
        </Button>
        <Button variant="outline" onPress={onDone}>Cancel</Button>
      </div>
    </Card>
  );
}

// ── Incident card + admin investigation editor ───────────────────────────────
function IncidentCard({ incident, canManage }: { incident: Incident; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {incident.caseNumber}
            </span>
            <TypeBadge type={incident.type} />
            <SeverityBadge severity={incident.severity} />
            {incident.oshaRecordable && (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                OSHA recordable
              </span>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold text-slate-900">{incident.title}</h3>
          {incident.description && <p className="mt-1 text-sm text-slate-500">{incident.description}</p>}
          <p className="mt-1 text-xs text-slate-400">
            {formatDateTime(incident.occurredAt)}
            {incident.location ? ` · ${incident.location}` : ''}
            {incident.affected ? ` · ${incident.affected.fullName}` : ''}
            {incident.reporter ? ` · reported by ${incident.reporter.fullName}` : ''}
          </p>
        </div>
        <StatusBadge status={incident.status} />
      </div>

      {(incident.rootCause || incident.correctiveAction) && (
        <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          {incident.rootCause && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Root cause</p>
              <p className="mt-1 text-sm text-slate-700">{incident.rootCause}</p>
            </div>
          )}
          {incident.correctiveAction && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Corrective action (CAPA)</p>
              <p className="mt-1 text-sm text-slate-700">{incident.correctiveAction}</p>
            </div>
          )}
        </div>
      )}

      {canManage && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {open ? 'Close investigation' : 'Manage investigation'}
          </button>
          {open && <InvestigationEditor incident={incident} onSaved={() => setOpen(false)} />}
        </div>
      )}
    </Card>
  );
}

function InvestigationEditor({ incident, onSaved }: { incident: Incident; onSaved: () => void }) {
  const update = useUpdateIncident();
  const [draft, setDraft] = useState<IncidentUpdate>({
    status: incident.status,
    oshaRecordable: incident.oshaRecordable,
    oshaClassification: incident.oshaClassification ?? undefined,
    daysAway: incident.daysAway,
    daysRestricted: incident.daysRestricted,
    rootCause: incident.rootCause ?? '',
    correctiveAction: incident.correctiveAction ?? '',
  });

  function set<K extends keyof IncidentUpdate>(key: K, value: IncidentUpdate[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          <Select value={draft.status ?? 'open'} onChange={(v) => set('status', v as IncidentStatus)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </Select>
        </Field>
        <Field label="OSHA recordable">
          <Select
            value={draft.oshaRecordable ? 'yes' : 'no'}
            onChange={(v) => set('oshaRecordable', v === 'yes')}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </Field>
        <Field label="Classification">
          <Select
            value={draft.oshaClassification ?? 'other-recordable'}
            onChange={(v) => set('oshaClassification', v as OshaClassification)}
          >
            {CLASS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Days away">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={draft.daysAway ?? 0}
            onChange={(e) => set('daysAway', Number(e.target.value))}
          />
        </Field>
        <Field label="Days restricted">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={draft.daysRestricted ?? 0}
            onChange={(e) => set('daysRestricted', Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Root cause" full>
        <textarea
          className={`${inputCls} mt-1`}
          rows={2}
          value={draft.rootCause ?? ''}
          onChange={(e) => set('rootCause', e.target.value)}
        />
      </Field>
      <Field label="Corrective action (CAPA)" full>
        <textarea
          className={`${inputCls} mt-1`}
          rows={2}
          value={draft.correctiveAction ?? ''}
          onChange={(e) => set('correctiveAction', e.target.value)}
        />
      </Field>
      <div className="mt-4">
        <Button
          onPress={() => update.mutate({ id: incident.id, body: draft }, { onSuccess: onSaved })}
          isDisabled={update.isPending}
        >
          {update.isPending ? 'Saving…' : 'Save investigation'}
        </Button>
      </div>
    </div>
  );
}

// ── OSHA 300 Log ─────────────────────────────────────────────────────────────
function Osha300Log({ incidents }: { incidents: Incident[] }) {
  return (
    <Card className="mt-6 overflow-hidden p-0">
      <div className="border-b border-slate-200 p-5">
        <p className="text-sm font-semibold text-slate-700">OSHA Form 300 — Log of Work-Related Injuries and Illnesses</p>
        <p className="mt-1 text-xs text-slate-500">Recordable cases only (29 CFR 1904). Export to 300A summary at year-end.</p>
      </div>
      {incidents.length === 0 ? (
        <p className="p-5 text-sm text-slate-400">No recordable cases — nothing to log.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Case</th>
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Where</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Classification</th>
                <th className="px-4 py-3 font-semibold">Away</th>
                <th className="px-4 py-3 font-semibold">Restr.</th>
                <th className="px-4 py-3 font-semibold">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.map((i) => (
                <tr key={i.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{i.caseNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{i.affected?.fullName ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(i.occurredAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{i.location ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {i.title}
                    {i.bodyPart ? <span className="text-slate-400"> · {i.bodyPart}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{classLabel(i.oshaClassification)}</td>
                  <td className="px-4 py-3 text-slate-600">{i.daysAway || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{i.daysRestricted || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{injuryLabel(i.injuryCategory)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ── Small UI helpers ──────────────────────────────────────────────────────────
const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );
}

function ViewTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-lg border px-3 py-1.5 text-sm font-medium transition ' +
        (active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
      }
    >
      {children}
    </button>
  );
}

function TypeBadge({ type }: { type: IncidentType }) {
  const label = TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{label}</span>
  );
}

function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const map: Record<IncidentSeverity, string> = {
    low: 'border-slate-200 bg-slate-50 text-slate-600',
    medium: 'border-amber-200 bg-amber-50 text-amber-700',
    high: 'border-orange-200 bg-orange-50 text-orange-700',
    critical: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[severity]}`}>{cap(severity)}</span>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const map: Record<IncidentStatus, string> = {
    open: 'border-amber-200 bg-amber-50 text-amber-700',
    investigating: 'border-blue-200 bg-blue-50 text-blue-700',
    'action-pending': 'border-orange-200 bg-orange-50 text-orange-700',
    closed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${map[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function statusLabel(s: IncidentStatus): string {
  return s === 'action-pending' ? 'Action pending' : cap(s);
}
function classLabel(c: OshaClassification | null): string {
  if (!c) return '—';
  return CLASS_OPTIONS.find((o) => o.value === c)?.label.replace(/ \(col\..*\)/, '') ?? c;
}
function injuryLabel(c: InjuryCategory | null): string {
  if (!c) return '—';
  return INJURY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

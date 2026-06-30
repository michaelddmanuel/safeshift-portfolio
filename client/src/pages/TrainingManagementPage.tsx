import { useEffect, useState } from 'react';
import { trainingApi } from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Pill } from '../components/StatusBadge';
import { formatDateTime } from '../lib/utils';
import type { NewTraining, Training } from '../types';

const COURSE_CODES = [
  'OSHA10',
  'OSHA30',
  'HAZWOPER40',
  'HAZWOPER8',
  'H2S',
  'CONFINED',
  'LOTO',
  'FALLPROT',
  'FIRSTAID',
  'FORKLIFT',
];

const EMPTY: NewTraining = {
  title: '',
  description: '',
  courseCode: '',
  scheduledAt: '',
  location: '',
  facilitator: '',
  mandatory: false,
  isVirtual: false,
};

export function TrainingManagementPage() {
  const { activeTenant } = useTenant();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewTraining>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    trainingApi
      .list()
      .then(setTrainings)
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeTenant?.slug]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: NewTraining = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        courseCode: form.courseCode || undefined,
        description: form.description || undefined,
        location: form.location || undefined,
        facilitator: form.facilitator || undefined,
      };
      await trainingApi.create(payload);
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          'Could not create training',
      );
    } finally {
      setSaving(false);
    }
  }

  const upd = <K extends keyof NewTraining>(k: K, v: NewTraining[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Training Management</h1>
          <p className="page-subtitle">
            Schedule courses; completions feed the certification tracker.
          </p>
        </div>
        <Button onPress={() => setShowForm((s) => !s)}>
          {showForm ? 'Close' : '+ New training'}
        </Button>
      </div>

      {showForm && (
        <Card className="mt-6 relative overflow-hidden">
          <span className="brand-accent-stripe absolute inset-x-0 top-0 h-1" />
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <input
                required
                value={form.title}
                onChange={(e) => upd('title', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => upd('description', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Course code (grants a cert)">
              <select
                value={form.courseCode}
                onChange={(e) => upd('courseCode', e.target.value)}
                className={inputCls}
              >
                <option value="">— none —</option>
                {COURSE_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Scheduled at">
              <input
                required
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => upd('scheduledAt', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => upd('location', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Facilitator">
              <input
                value={form.facilitator}
                onChange={(e) => upd('facilitator', e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="flex items-center gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.mandatory}
                  onChange={(e) => upd('mandatory', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                Mandatory
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.isVirtual}
                  onChange={(e) => upd('isVirtual', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                Virtual
              </label>
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
                {error}
              </p>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" isDisabled={saving}>
                {saving ? 'Saving…' : 'Create training'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {trainings.map((t) => (
            <Card
              key={t.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{t.title}</h3>
                  {t.mandatory && <Pill>Mandatory</Pill>}
                  {t.isVirtual && <Pill>Virtual</Pill>}
                  {t.courseCode && <Pill>{t.courseCode}</Pill>}
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {formatDateTime(t.scheduledAt)}
                  {t.location ? ` · ${t.location}` : ''}
                  {t.facilitator ? ` · ${t.facilitator}` : ''}
                </p>
              </div>
              <Pill>{t.status}</Pill>
            </Card>
          ))}
          {trainings.length === 0 && (
            <p className="text-sm text-slate-400">No training scheduled yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

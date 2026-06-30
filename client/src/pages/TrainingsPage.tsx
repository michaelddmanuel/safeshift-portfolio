import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trainingApi } from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Pill } from '../components/StatusBadge';
import { formatDateTime } from '../lib/utils';
import type { Training } from '../types';

const STATUS_FILTERS = ['all', 'scheduled', 'in-progress', 'completed', 'cancelled'] as const;
type TrainingStatusFilter = (typeof STATUS_FILTERS)[number];

export function TrainingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTenant } = useTenant();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<Set<string>>(new Set());
  const statusFilter = (searchParams.get('status') ?? 'all') as TrainingStatusFilter;

  const filteredTrainings = trainings.filter(
    (t) => statusFilter === 'all' || t.status === statusFilter,
  );

  function setStatusFilter(next: TrainingStatusFilter) {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'all') nextParams.delete('status');
    else nextParams.set('status', next);
    setSearchParams(nextParams, { replace: true });
  }

  function load() {
    setLoading(true);
    trainingApi
      .list()
      .then(setTrainings)
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeTenant?.slug]);

  async function attend(t: Training) {
    setBusyId(t.id);
    try {
      await trainingApi.attend(t.id);
      setSignedIn((prev) => new Set(prev).add(t.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="page-title">Training</h1>
      <p className="page-subtitle">
        Scheduled sessions, toolbox talks, and certification courses.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
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

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredTrainings.map((t) => {
            const upcoming = t.status === 'scheduled';
            const done = signedIn.has(t.id);
            return (
              <Card
                key={t.id}
                className="relative flex flex-col gap-3 overflow-hidden sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="brand-accent-stripe absolute inset-x-0 top-0 h-1" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{t.title}</h3>
                    {t.mandatory && <Pill>Mandatory</Pill>}
                    {t.isVirtual && <Pill>Virtual</Pill>}
                    {t.courseCode && <Pill>{t.courseCode}</Pill>}
                  </div>
                  {t.description && (
                    <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(t.scheduledAt)}
                    {t.location ? ` · ${t.location}` : ''}
                    {t.Site ? ` · ${t.Site.name}` : ''}
                    {t.facilitator ? ` · ${t.facilitator}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Pill>{t.status}</Pill>
                  {upcoming && (
                    <Button
                      variant={done ? 'outline' : 'brand'}
                      isDisabled={busyId === t.id || done}
                      onPress={() => attend(t)}
                    >
                      {done ? 'Signed in ✓' : busyId === t.id ? 'Signing in…' : 'Sign in'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {filteredTrainings.length === 0 && (
            <p className="text-sm text-slate-400">No training scheduled.</p>
          )}
        </div>
      )}
    </div>
  );
}

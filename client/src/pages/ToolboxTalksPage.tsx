import { useEffect, useState } from 'react';
import { toolboxApi } from '../api/endpoints';
import { useTenant } from '../context/TenantContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { formatDateTime } from '../lib/utils';
import type { ToolboxTalk } from '../types';

export function ToolboxTalksPage() {
  const { activeTenant } = useTenant();
  const [talks, setTalks] = useState<ToolboxTalk[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<Set<string>>(new Set());

  function load() {
    setLoading(true);
    toolboxApi
      .list()
      .then(setTalks)
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeTenant?.slug]);

  async function signin(talk: ToolboxTalk) {
    setBusyId(talk.id);
    try {
      await toolboxApi.signin(talk.id);
      setSignedIn((prev) => new Set(prev).add(talk.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="page-title">Toolbox Talks</h1>
      <p className="page-subtitle">
        Daily pre-shift safety briefings and digital sign-in.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-3">
          {talks.map((talk) => {
            const done = signedIn.has(talk.id);
            const isUpcoming = new Date(talk.scheduledAt) > new Date();
            return (
              <Card
                key={talk.id}
                className="relative flex flex-col gap-3 overflow-hidden sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="brand-accent-stripe absolute inset-x-0 top-0 h-1" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{talk.topic}</h3>
                  </div>
                  {talk.description && (
                    <p className="mt-1 text-sm text-slate-500">{talk.description}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(talk.scheduledAt)}
                    {talk.location ? ` · ${talk.location}` : ''}
                    {talk.site ? ` · ${talk.site.name}` : ''}
                    {talk.facilitator ? ` · ${talk.facilitator}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {isUpcoming && (
                    <Button
                      variant={done ? 'outline' : 'brand'}
                      isDisabled={busyId === talk.id || done}
                      onPress={() => signin(talk)}
                    >
                      {done ? 'Signed in ✓' : busyId === talk.id ? 'Signing in…' : 'Sign in'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {talks.length === 0 && (
            <p className="text-sm text-slate-400">No toolbox talks scheduled.</p>
          )}
        </div>
      )}
    </div>
  );
}

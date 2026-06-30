import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ListSkeleton } from '../components/Skeleton';
import { useSigninToolbox, useToolboxTalks } from '../lib/queries';
import { formatDateTime } from '../lib/utils';
import type { ToolboxTalk } from '../types';

export function ToolboxTalksPage() {
  const { data: talks = [], isLoading } = useToolboxTalks();
  const signinMut = useSigninToolbox();
  const [signedIn, setSignedIn] = useState<Set<string>>(new Set());

  function onSignin(talk: ToolboxTalk) {
    signinMut.mutate(talk.id, { onSuccess: () => setSignedIn((prev) => new Set(prev).add(talk.id)) });
  }

  return (
    <div>
      <h1 className="page-title">Toolbox Talks</h1>
      <p className="page-subtitle">
        Daily pre-shift safety briefings and digital sign-in.
      </p>

      {isLoading ? (
        <div className="mt-6">
          <ListSkeleton />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {talks.map((talk) => {
            const done = signedIn.has(talk.id);
            const isUpcoming = new Date(talk.scheduledAt) > new Date();
            const busy = signinMut.isPending && signinMut.variables === talk.id;
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
                      isDisabled={busy || done}
                      onPress={() => onSignin(talk)}
                    >
                      {done ? 'Signed in ✓' : busy ? 'Signing in…' : 'Sign in'}
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

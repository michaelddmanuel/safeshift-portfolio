import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped context carried through the async call chain.
 * Set once by `resolveTenant` middleware, then read by Sequelize hooks
 * (see models/tenantScoped.ts) so every query is automatically scoped to
 * the active tenant — app code cannot accidentally leak across tenants (§5.2).
 */
export interface RequestContext {
  tenantId: string | null;
  userId: string | null;
  role: string | null;
  /** When true, tenant auto-scoping is bypassed (platform-admin / seed / cron). */
  bypassTenantScope: boolean;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getTenantId(): string | null {
  const ctx = storage.getStore();
  if (!ctx || ctx.bypassTenantScope) return null;
  return ctx.tenantId;
}

/** Run a function with tenant auto-scoping disabled (platform admin, cron, seed). */
export function runUnscoped<T>(fn: () => T): T {
  const current = storage.getStore();
  return storage.run(
    {
      tenantId: current?.tenantId ?? null,
      userId: current?.userId ?? null,
      role: current?.role ?? null,
      bypassTenantScope: true,
    },
    fn,
  );
}

import { Op, type ModelStatic, type Model } from 'sequelize';
import { getTenantId } from '../context/tenantContext';

/**
 * Attaches tenant-isolation hooks to a model so that every read is filtered by
 * the active tenant and every write is stamped with it — automatically, from the
 * request context (§5.2). This is the application-layer half of "defense in depth";
 * Postgres Row-Level Security is the recommended DB-layer backstop for production.
 *
 * Bypassed when the request context sets `bypassTenantScope` (platform admin / cron / seed).
 */
export function applyTenantScope<M extends Model>(model: ModelStatic<M>): void {
  const injectWhere = (options: { where?: unknown }) => {
    const tenantId = getTenantId();
    if (!tenantId) return;
    options.where = options.where
      ? { [Op.and]: [options.where, { tenantId }] }
      : { tenantId };
  };

  model.addHook('beforeFind', (options) => injectWhere(options as { where?: unknown }));
  model.addHook('beforeCount', (options) => injectWhere(options as { where?: unknown }));
  model.addHook('beforeBulkUpdate', (options) => injectWhere(options as { where?: unknown }));
  model.addHook('beforeBulkDestroy', (options) => injectWhere(options as { where?: unknown }));

  const stamp = (instance: M) => {
    const tenantId = getTenantId();
    const anyInstance = instance as unknown as { tenantId?: string | null };
    if (tenantId && !anyInstance.tenantId) anyInstance.tenantId = tenantId;
  };

  // Stamp on beforeValidate (NOT beforeCreate): Sequelize validates BEFORE the
  // beforeCreate hook, so a `notNull` tenantId check would otherwise fire first.
  model.addHook('beforeValidate', (instance) => stamp(instance as M));
  model.addHook('beforeUpsert', (values) => {
    const tenantId = getTenantId();
    const v = values as unknown as { tenantId?: string | null };
    if (tenantId && !v.tenantId) v.tenantId = tenantId;
  });
  model.addHook('beforeBulkCreate', (instances) => {
    for (const instance of instances as M[]) stamp(instance);
  });
}

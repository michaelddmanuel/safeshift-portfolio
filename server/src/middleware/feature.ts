import type { NextFunction, Request, Response } from 'express';
import { runUnscoped } from '../context/tenantContext';
import { Tenant } from '../models/Tenant';
import { HttpError } from './error';
import { ROLES, type FeatureFlag } from '../constants';

/**
 * Blocks a route unless the active tenant has the feature switched on (§5.4).
 * "Never trust the client" — the frontend hides modules, but this is the real gate.
 * Platform admins in cross-tenant mode (no active tenant) are allowed through.
 */
export function requireFeature(flag: FeatureFlag) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { tenantId, role } = req.ctx ?? {};

    if (!tenantId) {
      if (role === ROLES.PLATFORM_ADMIN) return next();
      throw new HttpError(400, 'No active tenant');
    }

    const tenant = await runUnscoped(() => Tenant.findByPk(tenantId));
    if (!tenant) throw new HttpError(404, 'Tenant not found');

    if (!tenant.features?.[flag]) {
      throw new HttpError(403, `Module "${flag}" is not enabled for ${tenant.displayName}`);
    }
    next();
  };
}

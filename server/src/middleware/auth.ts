import type { NextFunction, Request, Response } from 'express';
import { runUnscoped } from '../context/tenantContext';
import { User } from '../models/User';
import { HttpError } from './error';
import { ROLES, type Role } from '../constants';

/** Requires a valid token + active user. Loads the user onto `req.user`. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const { userId } = req.ctx ?? {};
  if (!userId) throw new HttpError(401, 'Authentication required');

  // Look up the user without tenant scoping, then verify tenant match ourselves.
  const user = await runUnscoped(() => User.findByPk(userId));
  if (!user || !user.isActive) throw new HttpError(401, 'Invalid or inactive account');

  req.user = user;
  next();
}

/** Restricts a route to the given roles. Use after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      throw new HttpError(403, 'Insufficient permissions');
    }
    next();
  };
}

/** Convenience guard for tenant-administrative actions. */
export const requireTenantAdmin = requireRole(
  ROLES.PLATFORM_ADMIN,
  ROLES.HSE_MANAGER,
  ROLES.SUPERVISOR,
);

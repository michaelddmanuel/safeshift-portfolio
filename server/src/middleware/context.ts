import type { NextFunction, Request, Response } from 'express';
import { runWithContext, type RequestContext } from '../context/tenantContext';
import { verifyToken } from '../auth/jwt';
import { Tenant } from '../models/Tenant';
import { ROLES } from '../constants';

/** Extract a tenant slug hint from an explicit header or a subdomain. */
function tenantSlugFromRequest(req: Request): string | null {
  const headerSlug = req.header('x-tenant');
  if (headerSlug) return headerSlug.toLowerCase();

  const host = req.hostname; // e.g. shell.safeshift.app
  const parts = host.split('.');
  if (parts.length >= 3) {
    const sub = parts[0]?.toLowerCase();
    if (sub && !['www', 'app', 'api', 'localhost'].includes(sub)) return sub;
  }
  return null;
}

/**
 * Establishes the per-request tenant context (§5.1) and runs the rest of the
 * request inside an AsyncLocalStorage scope so Sequelize hooks auto-isolate data.
 *
 * Resolution order: JWT → tenant-slug hint (subdomain/header) → none.
 * Platform admins may "act as" a tenant via the X-Tenant header (3-way brand
 * toggle); without one they get cross-tenant reach. Non-admins are always pinned
 * to their JWT tenant — the client can never widen its own scope.
 */
export async function resolveTenant(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
  let userId: string | null = null;
  let tenantId: string | null = null;
  let role: string | null = null;

  const authHeader = req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(authHeader.slice(7));
      userId = payload.sub;
      tenantId = payload.tenantId;
      role = payload.role;
    } catch {
      // Invalid/expired token → treat as anonymous; protected routes reject later.
    }
  }

  let bypassTenantScope = false;

  if (role === ROLES.PLATFORM_ADMIN) {
    const slug = tenantSlugFromRequest(req);
    if (slug) {
      const tenant = await Tenant.findOne({ where: { slug } });
      tenantId = tenant ? tenant.id : null;
      bypassTenantScope = false; // acting within the selected tenant
    } else {
      bypassTenantScope = true; // cross-tenant platform view
    }
  } else if (!tenantId) {
    // Anonymous request — resolve a tenant hint only for theming the login page.
    const slug = tenantSlugFromRequest(req);
    if (slug) {
      const tenant = await Tenant.findOne({ where: { slug } });
      tenantId = tenant ? tenant.id : null;
    }
  }

  const ctx: RequestContext = { tenantId, userId, role, bypassTenantScope };
  req.ctx = ctx;
  runWithContext(ctx, () => next());
  } catch (err) {
    next(err);
  }
}

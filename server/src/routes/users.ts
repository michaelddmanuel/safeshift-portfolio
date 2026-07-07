import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { Certification, computeCertStatus } from '../models/Certification';
import { asyncHandler, HttpError } from '../middleware/error';
import { requireAuth, requireTenantAdmin } from '../middleware/auth';
import { parseBody } from '../middleware/validate';
import { publicUser } from '../serializers';
import { runUnscoped } from '../context/tenantContext';
import { ROLES } from '../constants';

const router = Router();
router.use(requireAuth);

const DEFAULT_PASSWORD = 'Passw0rd!';

/**
 * Tenant admins can assign every role EXCEPT platform_admin (that account is
 * global and provisioned out-of-band) — this prevents privilege escalation.
 */
const assignableRole = z.enum(['hse_manager', 'supervisor', 'worker', 'contractor', 'auditor']);

const createSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: assignableRole,
  employeeId: z.string().trim().max(64).optional().or(z.literal('')),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  isContractor: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

const updateSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().email(),
    role: assignableRole,
    employeeId: z.string().trim().max(64).optional().or(z.literal('')),
    phone: z.string().trim().max(32).optional().or(z.literal('')),
    isContractor: z.boolean(),
    isActive: z.boolean(),
  })
  .partial();

const nullifyEmpty = (v: string | undefined): string | null => (v && v.trim() ? v.trim() : null);

/** Global email-uniqueness check (emails are unique across all tenants). */
async function emailTaken(email: string, exceptId?: string): Promise<boolean> {
  const existing = await runUnscoped(() =>
    User.findOne({ where: { email: email.toLowerCase() } }),
  );
  return Boolean(existing && existing.id !== exceptId);
}

/**
 * Admin User Management (§12) — list the active tenant's workforce with a
 * lightweight cert-readiness rollup per person. Auto tenant-scoped.
 */
router.get(
  '/',
  requireTenantAdmin,
  asyncHandler(async (_req, res) => {
    const [users, certs] = await Promise.all([
      User.findAll({ order: [['lastName', 'ASC']] }),
      Certification.findAll(),
    ]);

    const now = new Date();
    const byUser = new Map<string, { active: number; expiring: number; expired: number }>();
    for (const c of certs) {
      const bucket = byUser.get(c.userId) ?? { active: 0, expiring: 0, expired: 0 };
      bucket[computeCertStatus(c.expiresAt, now)] += 1;
      byUser.set(c.userId, bucket);
    }

    const rows = users.map((u) => ({
      ...publicUser(u),
      certs: byUser.get(u.id) ?? { active: 0, expiring: 0, expired: 0 },
    }));

    res.json({ users: rows });
  }),
);

/** Create a workforce member within the active tenant. */
router.post(
  '/',
  requireTenantAdmin,
  asyncHandler(async (req, res) => {
    const body = parseBody(createSchema, req);

    // A tenant context is required so the new user is owned by a brand. Platform
    // admins must pick a brand (X-Tenant) via the toggle before adding people.
    if (!req.ctx.tenantId) {
      throw new HttpError(400, 'Select a brand before adding a user.');
    }
    if (await emailTaken(body.email)) {
      throw new HttpError(409, 'A user with that email already exists.');
    }

    const user = await User.create({
      email: body.email.toLowerCase(),
      passwordHash: await User.hashPassword(body.password ?? DEFAULT_PASSWORD),
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      employeeId: nullifyEmpty(body.employeeId),
      phone: nullifyEmpty(body.phone),
      isContractor: body.isContractor ?? body.role === ROLES.CONTRACTOR,
    });

    res.status(201).json({
      user: { ...publicUser(user), certs: { active: 0, expiring: 0, expired: 0 } },
    });
  }),
);

/** Edit a workforce member (tenant-scoped: findByPk is auto-filtered). */
router.patch(
  '/:id',
  requireTenantAdmin,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw new HttpError(400, 'User id is required');
    const body = parseBody(updateSchema, req);

    const user = await User.findByPk(id);
    if (!user) throw new HttpError(404, 'User not found');

    if (body.email && body.email.toLowerCase() !== user.email) {
      if (await emailTaken(body.email, user.id)) {
        throw new HttpError(409, 'A user with that email already exists.');
      }
      user.email = body.email.toLowerCase();
    }
    if (body.firstName !== undefined) user.firstName = body.firstName;
    if (body.lastName !== undefined) user.lastName = body.lastName;
    if (body.role !== undefined) user.role = body.role;
    if (body.employeeId !== undefined) user.employeeId = nullifyEmpty(body.employeeId);
    if (body.phone !== undefined) user.phone = nullifyEmpty(body.phone);
    if (body.isContractor !== undefined) user.isContractor = body.isContractor;
    if (body.isActive !== undefined) {
      if (!body.isActive && user.id === req.user!.id) {
        throw new HttpError(400, 'You cannot deactivate your own account.');
      }
      user.isActive = body.isActive;
    }

    await user.save();

    const certs = await Certification.findAll({ where: { userId: user.id } });
    const now = new Date();
    const rollup = { active: 0, expiring: 0, expired: 0 };
    for (const c of certs) rollup[computeCertStatus(c.expiresAt, now)] += 1;

    res.json({ user: { ...publicUser(user), certs: rollup } });
  }),
);

/**
 * Remove a worker from the active roster. This is a SOFT delete (deactivate):
 * HSE records (certifications, incident history) must be preserved for audit,
 * and a deactivated account can no longer sign in. Reactivate via PATCH.
 */
router.delete(
  '/:id',
  requireTenantAdmin,
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) throw new HttpError(400, 'User id is required');

    const user = await User.findByPk(id);
    if (!user) throw new HttpError(404, 'User not found');
    if (user.id === req.user!.id) {
      throw new HttpError(400, 'You cannot remove your own account.');
    }

    user.isActive = false;
    await user.save();
    res.status(204).end();
  }),
);

export default router;

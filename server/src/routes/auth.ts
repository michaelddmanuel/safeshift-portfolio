import { Router } from 'express';
import { z } from 'zod';
import { runUnscoped } from '../context/tenantContext';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { signToken } from '../auth/jwt';
import { asyncHandler, HttpError } from '../middleware/error';
import { requireAuth } from '../middleware/auth';
import { parseBody } from '../middleware/validate';
import { publicTenant, publicUser } from '../serializers';
import { ROLES } from '../constants';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  tenantSlug: z.string().min(1),
  isContractor: z.boolean().optional(),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = parseBody(loginSchema, req);
    const user = await runUnscoped(() =>
      User.findOne({ where: { email: email.toLowerCase() } }),
    );
    if (!user || !user.isActive || !(await user.verifyPassword(password))) {
      throw new HttpError(401, 'Invalid email or password');
    }
    const tenant = user.tenantId
      ? await runUnscoped(() => Tenant.findByPk(user.tenantId as string))
      : null;
    const token = signToken({ sub: user.id, tenantId: user.tenantId, role: user.role });
    res.json({
      token,
      user: publicUser(user),
      tenant: tenant ? publicTenant(tenant) : null,
    });
  }),
);

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = parseBody(registerSchema, req);
    const tenant = await runUnscoped(() =>
      Tenant.findOne({ where: { slug: body.tenantSlug.toLowerCase() } }),
    );
    if (!tenant) throw new HttpError(404, 'Unknown company');

    const existing = await runUnscoped(() =>
      User.findOne({ where: { email: body.email.toLowerCase() } }),
    );
    if (existing) throw new HttpError(409, 'An account with that email already exists');

    const user = await runUnscoped(async () =>
      User.create({
        tenantId: tenant.id,
        email: body.email.toLowerCase(),
        passwordHash: await User.hashPassword(body.password),
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.isContractor ? ROLES.CONTRACTOR : ROLES.WORKER,
        isContractor: body.isContractor ?? false,
      }),
    );

    const token = signToken({ sub: user.id, tenantId: user.tenantId, role: user.role });
    res.status(201).json({ token, user: publicUser(user), tenant: publicTenant(tenant) });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const tenant = user.tenantId
      ? await runUnscoped(() => Tenant.findByPk(user.tenantId as string))
      : null;
    res.json({ user: publicUser(user), tenant: tenant ? publicTenant(tenant) : null });
  }),
);

export default router;

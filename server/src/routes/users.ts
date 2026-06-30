import { Router } from 'express';
import { User } from '../models/User';
import { Certification, computeCertStatus } from '../models/Certification';
import { asyncHandler } from '../middleware/error';
import { requireAuth, requireTenantAdmin } from '../middleware/auth';
import { publicUser } from '../serializers';

const router = Router();
router.use(requireAuth);

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

export default router;

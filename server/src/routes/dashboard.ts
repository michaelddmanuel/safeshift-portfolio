import { Router } from 'express';
import { Op } from 'sequelize';
import { runUnscoped } from '../context/tenantContext';
import { User } from '../models/User';
import { Training } from '../models/Training';
import { Certification, computeCertStatus } from '../models/Certification';
import { Tenant } from '../models/Tenant';
import { asyncHandler } from '../middleware/error';
import { requireAuth } from '../middleware/auth';
import { ROLES } from '../constants';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Platform admin with no active tenant → cross-tenant overview.
    if (!req.ctx.tenantId && req.user!.role === ROLES.PLATFORM_ADMIN) {
      const tenants = await runUnscoped(() => Tenant.findAll({ order: [['displayName', 'ASC']] }));
      const overview = await Promise.all(
        tenants.map(async (t) => ({
          slug: t.slug,
          displayName: t.displayName,
          users: await runUnscoped(() => User.count({ where: { tenantId: t.id } })),
          trainings: await runUnscoped(() => Training.count({ where: { tenantId: t.id } })),
          certifications: await runUnscoped(() => Certification.count({ where: { tenantId: t.id } })),
        })),
      );
      res.json({ scope: 'platform', tenants: overview });
      return;
    }

    const now = new Date();
    const [workforce, upcoming, completed, certs] = await Promise.all([
      User.count(),
      Training.count({ where: { scheduledAt: { [Op.gte]: now }, status: 'scheduled' } }),
      Training.count({ where: { status: 'completed' } }),
      Certification.findAll(),
    ]);

    const certStats = { active: 0, expiring: 0, expired: 0 };
    for (const cert of certs) certStats[computeCertStatus(cert.expiresAt, now)] += 1;
    const auditReadiness =
      certs.length === 0 ? 100 : Math.round((certStats.active / certs.length) * 100);

    const recentTrainings = await Training.findAll({
      order: [['scheduledAt', 'DESC']],
      limit: 5,
    });

    res.json({
      scope: 'tenant',
      stats: {
        workforce,
        upcomingTrainings: upcoming,
        completedTrainings: completed,
        certifications: certs.length,
        certStatus: certStats,
        auditReadiness,
      },
      recentTrainings,
    });
  }),
);

export default router;

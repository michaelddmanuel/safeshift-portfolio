import { Router } from 'express';
import { z } from 'zod';
import { Certification } from '../models/Certification';
import { User } from '../models/User';
import { asyncHandler, HttpError } from '../middleware/error';
import { requireAuth, requireTenantAdmin } from '../middleware/auth';
import { requireFeature } from '../middleware/feature';
import { parseBody } from '../middleware/validate';
import { publicCertification } from '../serializers';
import { scanCertifications } from '../services/certScanner';
import { computeCertStatus, daysToExpiry } from '../models/Certification';
import { ROLES } from '../constants';

const router = Router();
router.use(requireAuth);
router.use(requireFeature('certTracker')); // module gate (§5.4)

const createSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  courseCode: z.string().optional(),
  issuer: z.string().optional(),
  issuedAt: z.coerce.date(),
  expiresAt: z.coerce.date().optional(),
  fileUrl: z.string().url().optional(),
});

/** Workers/contractors see only their own certs; HSE staff see the whole tenant. */
function isSelfOnly(role: string): boolean {
  return role === ROLES.WORKER || role === ROLES.CONTRACTOR;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = isSelfOnly(req.user!.role) ? { userId: req.user!.id } : {};
    const certs = await Certification.findAll({
      where,
      order: [['expiresAt', 'ASC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'role'] }],
    });
    const now = new Date();
    res.json({
      certifications: certs.map((c) => {
        const user = (c as unknown as { user?: User }).user;
        return {
          ...publicCertification(c, now),
          user: user
            ? { id: user.id, fullName: `${user.firstName} ${user.lastName}`, role: user.role }
            : null,
        };
      }),
    });
  }),
);

/** Audit-readiness snapshot (§13): status counts + 30/60/90-day expiry horizon. */
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const where = isSelfOnly(req.user!.role) ? { userId: req.user!.id } : {};
    const certs = await Certification.findAll({ where });
    const now = new Date();

    const summary = {
      total: certs.length,
      active: 0,
      expiring: 0,
      expired: 0,
      expiringIn30: 0,
      expiringIn60: 0,
      expiringIn90: 0,
    };

    for (const cert of certs) {
      const status = computeCertStatus(cert.expiresAt, now);
      summary[status] += 1;
      const d = daysToExpiry(cert.expiresAt, now);
      if (d !== null && d >= 0) {
        if (d <= 30) summary.expiringIn30 += 1;
        if (d <= 60) summary.expiringIn60 += 1;
        if (d <= 90) summary.expiringIn90 += 1;
      }
    }
    res.json({ summary });
  }),
);

router.post(
  '/',
  requireTenantAdmin,
  asyncHandler(async (req, res) => {
    const body = parseBody(createSchema, req);
    const toDateString = (d: Date) => d.toISOString().slice(0, 10);
    const cert = await Certification.create({
      userId: body.userId,
      name: body.name,
      courseCode: body.courseCode,
      issuer: body.issuer,
      issuedAt: toDateString(body.issuedAt),
      expiresAt: body.expiresAt ? toDateString(body.expiresAt) : null,
      fileUrl: body.fileUrl,
      status: computeCertStatus(body.expiresAt ?? null),
    });
    res.status(201).json({ certification: publicCertification(cert) });
  }),
);

/** Manually trigger the expiry scan (demo/ops convenience). */
router.post(
  '/scan',
  requireTenantAdmin,
  asyncHandler(async (_req, res) => {
    const result = await scanCertifications();
    res.json({ result });
  }),
);

router.delete(
  '/:id',
  requireTenantAdmin,
  asyncHandler(async (req, res) => {
    const cert = await Certification.findByPk(req.params.id);
    if (!cert) throw new HttpError(404, 'Certification not found');
    await cert.destroy();
    res.status(204).end();
  }),
);

export default router;

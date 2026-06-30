import { Router } from 'express';
import { runUnscoped } from '../context/tenantContext';
import { Tenant } from '../models/Tenant';
import { asyncHandler, HttpError } from '../middleware/error';
import { publicTenant } from '../serializers';

const router = Router();

/**
 * Public branding catalog — powers the login-page theme and the 3-way brand
 * toggle. Branding (logo text, colors, program labels, feature set) is not
 * secret; tenant *data* remains isolated behind auth + scoping.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const tenants = await runUnscoped(() => Tenant.findAll({ order: [['displayName', 'ASC']] }));
    res.json({ tenants: tenants.map(publicTenant) });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = (req.params.slug ?? '').toLowerCase();
    const tenant = await runUnscoped(() => Tenant.findOne({ where: { slug } }));
    if (!tenant) throw new HttpError(404, 'Tenant not found');
    res.json({ tenant: publicTenant(tenant) });
  }),
);

export default router;

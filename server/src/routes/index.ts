import { Router } from 'express';
import authRoutes from './auth';
import tenantRoutes from './tenants';
import trainingRoutes from './trainings';
import toolboxTalkRoutes from './toolbox-talks';
import certificationRoutes from './certifications';
import dashboardRoutes from './dashboard';
import userRoutes from './users';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, service: 'safeshift-api' }));

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/trainings', trainingRoutes);
router.use('/toolbox-talks', toolboxTalkRoutes);
router.use('/certifications', certificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { ToolboxTalk } from '../models/ToolboxTalk';
import { ToolboxSignin } from '../models/ToolboxSignin';
import { Site } from '../models/Site';
import { User } from '../models/User';
import { asyncHandler, HttpError } from '../middleware/error';
import { requireAuth, requireTenantAdmin } from '../middleware/auth';
import { requireFeature } from '../middleware/feature';
import { parseBody } from '../middleware/validate';
import { ATTENDANCE_METHODS } from '../constants';

const router = Router();
router.use(requireAuth);
router.use(requireFeature('toolboxTalks'));

const createSchema = z.object({
  siteId: z.string().uuid(),
  topic: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.coerce.date(),
  location: z.string().optional(),
  facilitator: z.string().optional(),
});

const signInSchema = z.object({
  method: z.enum(ATTENDANCE_METHODS).default('manual'),
});

// List toolbox talks for the active tenant (auto-scoped).
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const talks = await ToolboxTalk.findAll({
      order: [['scheduledAt', 'DESC']],
      include: [
        { model: Site, as: 'site', attributes: ['id', 'name', 'type'] },
        {
          model: ToolboxSignin,
          as: 'signins',
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
    });
    res.json({ talks });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const talk = await ToolboxTalk.findByPk(req.params.id, {
      include: [
        { model: Site, as: 'site', attributes: ['id', 'name', 'type'] },
        {
          model: ToolboxSignin,
          as: 'signins',
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'role'] }],
        },
      ],
    });
    if (!talk) throw new HttpError(404, 'Toolbox talk not found');
    res.json({ talk });
  }),
);

router.post(
  '/',
  requireTenantAdmin,
  asyncHandler(async (req, res) => {
    const body = parseBody(createSchema, req);
    const talk = await ToolboxTalk.create(body);
    res.status(201).json({ talk });
  }),
);

// Current user signs in to a toolbox talk.
router.post(
  '/:id/signin',
  asyncHandler(async (req, res) => {
    const { method } = parseBody(signInSchema, req);
    const talk = await ToolboxTalk.findByPk(req.params.id);
    if (!talk) throw new HttpError(404, 'Toolbox talk not found');

    const [signin] = await ToolboxSignin.findOrCreate({
      where: { toolboxTalkId: talk.id, userId: req.user!.id },
      defaults: {
        toolboxTalkId: talk.id,
        userId: req.user!.id,
        method,
        signedInAt: new Date(),
      },
    });
    res.status(201).json({ signin });
  }),
);

export default router;

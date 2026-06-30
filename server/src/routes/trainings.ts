import { Router } from 'express';
import { z } from 'zod';
import { Training } from '../models/Training';
import { Attendance } from '../models/Attendance';
import { Site } from '../models/Site';
import { User } from '../models/User';
import { asyncHandler, HttpError } from '../middleware/error';
import { requireAuth, requireTenantAdmin } from '../middleware/auth';
import { parseBody } from '../middleware/validate';
import { ATTENDANCE_METHODS } from '../constants';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  courseCode: z.string().optional(),
  siteId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date(),
  location: z.string().optional(),
  isVirtual: z.boolean().optional(),
  meetingLink: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  mandatory: z.boolean().optional(),
  facilitator: z.string().optional(),
});

const attendSchema = z.object({
  method: z.enum(ATTENDANCE_METHODS).default('self-declared'),
});

// List trainings for the active tenant (auto-scoped).
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const trainings = await Training.findAll({
      order: [['scheduledAt', 'DESC']],
      include: [{ model: Site, attributes: ['id', 'name', 'type'] }],
    });
    res.json({ trainings });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const training = await Training.findByPk(req.params.id, {
      include: [
        { model: Site, attributes: ['id', 'name', 'type'] },
        {
          model: Attendance,
          as: 'attendances',
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'role'] }],
        },
      ],
    });
    if (!training) throw new HttpError(404, 'Training not found');
    res.json({ training });
  }),
);

router.post(
  '/',
  requireTenantAdmin,
  asyncHandler(async (req, res) => {
    const body = parseBody(createSchema, req);
    const training = await Training.create(body);
    res.status(201).json({ training });
  }),
);

// Current user records their attendance (toolbox-talk / self-declared sign-in §8.2).
router.post(
  '/:id/attend',
  asyncHandler(async (req, res) => {
    const { method } = parseBody(attendSchema, req);
    const training = await Training.findByPk(req.params.id);
    if (!training) throw new HttpError(404, 'Training not found');

    const [attendance] = await Attendance.findOrCreate({
      where: { trainingId: training.id, userId: req.user!.id },
      defaults: {
        trainingId: training.id,
        userId: req.user!.id,
        status: 'present',
        method,
        checkInAt: new Date(),
      },
    });
    res.status(201).json({ attendance });
  }),
);

export default router;

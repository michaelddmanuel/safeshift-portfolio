import { Router } from 'express';
import { z } from 'zod';
import { Incident } from '../models/Incident';
import { Site } from '../models/Site';
import { User } from '../models/User';
import { asyncHandler, HttpError } from '../middleware/error';
import { requireAuth, requireTenantAdmin } from '../middleware/auth';
import { requireFeature } from '../middleware/feature';
import { parseBody } from '../middleware/validate';
import {
  INCIDENT_TYPES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  OSHA_CLASSIFICATIONS,
  INJURY_CATEGORIES,
} from '../constants';

const router = Router();
router.use(requireAuth);
router.use(requireFeature('incidentReporting'));

const createSchema = z.object({
  type: z.enum(INCIDENT_TYPES),
  severity: z.enum(INCIDENT_SEVERITIES).default('low'),
  title: z.string().min(1),
  description: z.string().optional(),
  occurredAt: z.coerce.date(),
  location: z.string().optional(),
  siteId: z.string().uuid().optional(),
  affectedUserId: z.string().uuid().optional(),
  oshaRecordable: z.boolean().optional(),
  oshaClassification: z.enum(OSHA_CLASSIFICATIONS).optional(),
  daysAway: z.number().int().min(0).optional(),
  daysRestricted: z.number().int().min(0).optional(),
  injuryCategory: z.enum(INJURY_CATEGORIES).optional(),
  bodyPart: z.string().optional(),
});

const updateSchema = z.object({
  status: z.enum(INCIDENT_STATUSES).optional(),
  severity: z.enum(INCIDENT_SEVERITIES).optional(),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
  oshaRecordable: z.boolean().optional(),
  oshaClassification: z.enum(OSHA_CLASSIFICATIONS).nullable().optional(),
  daysAway: z.number().int().min(0).optional(),
  daysRestricted: z.number().int().min(0).optional(),
  injuryCategory: z.enum(INJURY_CATEGORIES).nullable().optional(),
  bodyPart: z.string().optional(),
});

type IncidentWithRefs = Incident & {
  site?: Site | null;
  affected?: User | null;
  reporter?: User | null;
};

function personRef(u: User | null | undefined) {
  if (!u) return null;
  return { id: u.id, fullName: `${u.firstName} ${u.lastName}`, role: u.role };
}

function serialize(incident: Incident) {
  const i = incident as IncidentWithRefs;
  return {
    id: i.id,
    caseNumber: i.caseNumber,
    type: i.type,
    severity: i.severity,
    title: i.title,
    description: i.description,
    occurredAt: i.occurredAt,
    location: i.location,
    status: i.status,
    oshaRecordable: i.oshaRecordable,
    oshaClassification: i.oshaClassification,
    daysAway: i.daysAway,
    daysRestricted: i.daysRestricted,
    injuryCategory: i.injuryCategory,
    bodyPart: i.bodyPart,
    rootCause: i.rootCause,
    correctiveAction: i.correctiveAction,
    site: i.site ? { id: i.site.id, name: i.site.name, type: i.site.type } : null,
    affected: personRef(i.affected),
    reporter: personRef(i.reporter),
  };
}

const INCLUDES = [
  { model: Site, as: 'site', attributes: ['id', 'name', 'type'] },
  { model: User, as: 'affected', attributes: ['id', 'firstName', 'lastName', 'role'] },
  { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'role'] },
];

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const incidents = await Incident.findAll({ include: INCLUDES, order: [['occurredAt', 'DESC']] });
    res.json({ incidents: incidents.map(serialize) });
  }),
);

/** OSHA-style rollup + leading/lagging counts. */
router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const incidents = await Incident.findAll();
    const summary = {
      total: incidents.length,
      recordable: 0,
      open: 0,
      nearMiss: 0,
      daysAway: 0,
      daysRestricted: 0,
    };
    for (const i of incidents) {
      if (i.oshaRecordable) summary.recordable += 1;
      if (i.status !== 'closed') summary.open += 1;
      if (i.type === 'near-miss') summary.nearMiss += 1;
      summary.daysAway += i.daysAway;
      summary.daysRestricted += i.daysRestricted;
    }
    res.json({ summary });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parseBody(createSchema, req);
    const count = await Incident.count();
    const caseNumber = `${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    const incident = await Incident.create({
      ...body,
      caseNumber,
      reportedById: req.user!.id,
    });
    const created = await Incident.findByPk(incident.id, { include: INCLUDES });
    res.status(201).json({ incident: serialize(created!) });
  }),
);

router.patch(
  '/:id',
  requireTenantAdmin,
  asyncHandler(async (req, res) => {
    const body = parseBody(updateSchema, req);
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) throw new HttpError(404, 'Incident not found');
    await incident.update(body);
    const updated = await Incident.findByPk(incident.id, { include: INCLUDES });
    res.json({ incident: serialize(updated!) });
  }),
);

export default router;

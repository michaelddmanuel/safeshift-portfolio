import { sequelize, Tenant, User, Site, CourseCatalog, Training, Certification, ToolboxTalk } from '../models';
import { computeCertStatus } from '../models/Certification';
import { ROLES } from '../constants';
import type { FeatureMap, SiteType } from '../constants';
import type { TenantTheme, SafetyProgramLabels } from '../models/Tenant';

const PASSWORD = 'Passw0rd!';

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}
function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface TenantSeed {
  slug: string;
  displayName: string;
  theme: TenantTheme;
  features: FeatureMap;
  safetyProgramLabels: SafetyProgramLabels;
  sites: { name: string; type: SiteType; city: string; state: string }[];
}

const TENANTS: TenantSeed[] = [
  {
    slug: 'shell',
    displayName: 'SafeShift Shell',
    theme: { logoText: 'Shell', primary: '#DD1D21', secondary: '#FBCE07', accent: '#FBCE07' },
    features: {
      certTracker: true,
      toolboxTalks: true,
      incidentReporting: true,
      stopWorkAuthority: true,
      safetyObservations: false,
      permitToWork: true,
      contractorCompliance: true,
      sdsLibrary: true,
      auditsInspections: false,
      fleetGarageSafety: false,
      emergencyDrills: true,
    },
    safetyProgramLabels: {
      signOff: 'Life-Saving Rules acknowledgement',
      programName: 'Life-Saving Rules · Goal Zero',
      slogan: 'Goal Zero — no harm, no leaks',
    },
    sites: [
      { name: 'Deer Park Refinery', type: 'refinery', city: 'Deer Park', state: 'TX' },
      { name: 'Sewaren Terminal', type: 'terminal', city: 'Sewaren', state: 'NJ' },
    ],
  },
  {
    slug: 'exxon',
    displayName: 'SafeShift ExxonMobil',
    theme: { logoText: 'ExxonMobil', primary: '#CE1126', secondary: '#0054A4', accent: '#0054A4' },
    features: {
      certTracker: true,
      toolboxTalks: true,
      incidentReporting: true,
      stopWorkAuthority: false,
      safetyObservations: true,
      permitToWork: true,
      contractorCompliance: true,
      sdsLibrary: true,
      auditsInspections: true,
      fleetGarageSafety: false,
      emergencyDrills: false,
    },
    safetyProgramLabels: {
      signOff: 'OIMS attestation',
      programName: 'Operations Integrity Management System',
      slogan: 'Nobody Gets Hurt',
    },
    sites: [
      { name: 'Baytown Refinery', type: 'refinery', city: 'Baytown', state: 'TX' },
      { name: 'Joliet Refinery', type: 'refinery', city: 'Channahon', state: 'IL' },
    ],
  },
  {
    slug: 'chevron',
    displayName: 'SafeShift Chevron',
    theme: { logoText: 'Chevron', primary: '#0066B2', secondary: '#ED1C24', accent: '#ED1C24' },
    features: {
      certTracker: true,
      toolboxTalks: true,
      incidentReporting: true,
      stopWorkAuthority: true,
      safetyObservations: true,
      permitToWork: false,
      contractorCompliance: true,
      sdsLibrary: false,
      auditsInspections: true,
      fleetGarageSafety: true,
      emergencyDrills: false,
    },
    safetyProgramLabels: {
      signOff: 'OE / Tenets sign-off',
      programName: 'Operational Excellence',
      slogan: 'Tenets of Operation · Stop Work Authority',
    },
    sites: [
      { name: 'Richmond Refinery', type: 'refinery', city: 'Richmond', state: 'CA' },
      { name: 'Pascagoula Refinery', type: 'refinery', city: 'Pascagoula', state: 'MS' },
      { name: 'Chevron Station #4471', type: 'station', city: 'San Ramon', state: 'CA' },
    ],
  },
];

const COURSES = [
  { code: 'OSHA10', name: 'OSHA 10-Hour General Industry', category: 'OSHA', validityMonths: 36 },
  { code: 'OSHA30', name: 'OSHA 30-Hour Construction', category: 'OSHA', validityMonths: 36 },
  { code: 'HAZWOPER40', name: 'HAZWOPER 40-Hour', category: 'HAZWOPER', validityMonths: 12 },
  { code: 'HAZWOPER8', name: 'HAZWOPER 8-Hour Refresher', category: 'HAZWOPER', validityMonths: 12 },
  { code: 'H2S', name: 'H2S Awareness', category: 'Process Safety', validityMonths: 12 },
  { code: 'CONFINED', name: 'Confined Space Entry', category: 'Permits', validityMonths: 12 },
  { code: 'LOTO', name: 'Lockout/Tagout (LOTO)', category: 'Hazardous Energy', validityMonths: 24 },
  { code: 'FALLPROT', name: 'Fall Protection', category: 'PPE', validityMonths: 24 },
  { code: 'FIRSTAID', name: 'First Aid / CPR', category: 'Medical', validityMonths: 24 },
  { code: 'FORKLIFT', name: 'Powered Industrial Truck', category: 'Equipment', validityMonths: 36 },
];

async function seed(): Promise<void> {
  console.log('Resetting schema…');
  await sequelize.sync({ force: true });

  // Global platform admin (operates across all tenants; brand toggle preview).
  await User.create({
    tenantId: null,
    email: 'admin@safeshift.app',
    passwordHash: await User.hashPassword(PASSWORD),
    firstName: 'Platform',
    lastName: 'Admin',
    role: ROLES.PLATFORM_ADMIN,
  });

  const now = new Date();

  for (const spec of TENANTS) {
    const tenant = await Tenant.create({
      slug: spec.slug,
      displayName: spec.displayName,
      theme: spec.theme,
      features: spec.features,
      safetyProgramLabels: spec.safetyProgramLabels,
    });

    const sites = await Promise.all(
      spec.sites.map((s) =>
        Site.create({ tenantId: tenant.id, name: s.name, type: s.type, city: s.city, state: s.state }),
      ),
    );

    await CourseCatalog.bulkCreate(
      COURSES.map((c) => ({ ...c, tenantId: tenant.id })),
    );

    const mk = async (
      role: (typeof ROLES)[keyof typeof ROLES],
      local: string,
      firstName: string,
      lastName: string,
      isContractor = false,
    ) =>
      User.create({
        tenantId: tenant.id,
        email: `${local}@${spec.slug}.safeshift.app`,
        passwordHash: await User.hashPassword(PASSWORD),
        firstName,
        lastName,
        role,
        isContractor,
        employeeId: `${spec.slug.toUpperCase()}-${local.toUpperCase()}`,
      });

    const hse = await mk(ROLES.HSE_MANAGER, 'hse', 'Dana', 'Reyes');
    await mk(ROLES.SUPERVISOR, 'supervisor', 'Marcus', 'Hale');
    const worker = await mk(ROLES.WORKER, 'worker', 'Sam', 'Carter');
    await mk(ROLES.CONTRACTOR, 'contractor', 'Jordan', 'Pike', true);
    void hse;

    const supervisorUser = await User.findOne({
      where: { tenantId: tenant.id, role: ROLES.SUPERVISOR },
    });

    // Trainings (upcoming + completed).
    await Training.bulkCreate([
      {
        tenantId: tenant.id,
        title: 'HAZWOPER 8-Hour Annual Refresher',
        description: 'Mandatory annual refresher for site hazmat workers.',
        courseCode: 'HAZWOPER8',
        siteId: sites[0]!.id,
        scheduledAt: addDays(now, 14),
        location: `${sites[0]!.name} — Training Center`,
        mandatory: true,
        facilitator: 'Dana Reyes',
        status: 'scheduled',
      },
      {
        tenantId: tenant.id,
        title: `Toolbox Talk: ${spec.safetyProgramLabels.programName}`,
        description: 'Pre-shift safety briefing with digital sign-in.',
        courseCode: null,
        siteId: sites[0]!.id,
        scheduledAt: addDays(now, 2),
        isVirtual: true,
        meetingLink: 'https://meet.safeshift.app/toolbox',
        mandatory: false,
        facilitator: 'Marcus Hale',
        status: 'scheduled',
      },
      {
        tenantId: tenant.id,
        title: 'OSHA 30-Hour General Industry',
        description: 'Completed certification course.',
        courseCode: 'OSHA30',
        siteId: sites[0]!.id,
        scheduledAt: addDays(now, -30),
        location: `${sites[0]!.name} — Room 101`,
        mandatory: true,
        facilitator: 'Dana Reyes',
        status: 'completed',
      },
    ]);

    // Certifications — deliberate spread so the tracker shows active/expiring/expired.
    const certSpecs: {
      user: User;
      code: string;
      name: string;
      issuedOffset: number;
      expiresOffset: number;
    }[] = [
      { user: worker, code: 'OSHA10', name: 'OSHA 10-Hour General Industry', issuedOffset: -300, expiresOffset: 400 },
      { user: worker, code: 'H2S', name: 'H2S Awareness', issuedOffset: -350, expiresOffset: 20 },
      { user: worker, code: 'CONFINED', name: 'Confined Space Entry', issuedOffset: -380, expiresOffset: -10 },
    ];
    if (supervisorUser) {
      certSpecs.push(
        { user: supervisorUser, code: 'OSHA30', name: 'OSHA 30-Hour Construction', issuedOffset: -200, expiresOffset: 500 },
        { user: supervisorUser, code: 'HAZWOPER8', name: 'HAZWOPER 8-Hour Refresher', issuedOffset: -340, expiresOffset: 45 },
        { user: supervisorUser, code: 'FALLPROT', name: 'Fall Protection', issuedOffset: -800, expiresOffset: -90 },
      );
    }

    for (const c of certSpecs) {
      const expiresAt = addDays(now, c.expiresOffset);
      await Certification.create({
        tenantId: tenant.id,
        userId: c.user.id,
        courseCode: c.code,
        name: c.name,
        issuer: 'SafeLandUSA',
        issuedAt: dateOnly(addDays(now, c.issuedOffset)),
        expiresAt: dateOnly(expiresAt),
        status: computeCertStatus(expiresAt, now),
      });
    }

    // Toolbox Talks (§8.2) — daily pre-shift briefings with digital sign-in.
    await ToolboxTalk.bulkCreate([
      {
        tenantId: tenant.id,
        siteId: sites[0]!.id,
        topic: 'Pre-Shift Safety Briefing',
        description: 'Daily hazard review, PPE check, and job-specific hazards.',
        scheduledAt: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        location: `${sites[0]!.name} — Muster Point A`,
        facilitator: 'Marcus Hale',
      },
      {
        tenantId: tenant.id,
        siteId: sites[0]!.id,
        topic: 'Heat Stress Awareness',
        description: 'Recognizing and preventing heat-related illness on site.',
        scheduledAt: addDays(now, 1),
        location: `${sites[0]!.name} — Unit 4`,
        facilitator: 'Dana Reyes',
      },
      {
        tenantId: tenant.id,
        siteId: sites[0]!.id,
        topic: `${spec.safetyProgramLabels.programName} Refresher`,
        description: 'Program-specific safety briefing and crew Q&A.',
        scheduledAt: addDays(now, 2),
        location: sites[0]!.name,
        facilitator: 'Dana Reyes',
      },
    ]);

    console.log(`  ✓ ${spec.displayName} (${spec.slug})`);
  }

  console.log('\nSeed complete. Demo logins (password for all: ' + PASSWORD + '):');
  console.log('  Platform admin   admin@safeshift.app');
  for (const t of TENANTS) {
    console.log(`  ${t.displayName}:`);
    console.log(`    HSE manager    hse@${t.slug}.safeshift.app`);
    console.log(`    Supervisor     supervisor@${t.slug}.safeshift.app`);
    console.log(`    Worker         worker@${t.slug}.safeshift.app`);
    console.log(`    Contractor     contractor@${t.slug}.safeshift.app`);
  }
}

seed()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });

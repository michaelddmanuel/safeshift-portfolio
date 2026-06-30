/**
 * Demo data layer (offline / no-backend mode).
 *
 * The production web build is a static SPA with no reachable API, so we resolve
 * the same endpoints the UI calls from seeded, in-memory fixtures that mirror
 * `server/src/db/seed.ts`. This is only active when the app is built WITHOUT a
 * real `VITE_API_URL` (see api/client.ts). Local `npm run dev` keeps hitting the
 * real Express API via the Vite proxy — this file is never used there.
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type {
  Certification,
  CertStatus,
  CertSummary,
  Dashboard,
  ManagedUser,
  Role,
  Tenant,
  Training,
  ToolboxTalk,
  User,
} from '../types';
import { getActiveTenantSlug } from './client';

const EXPIRING_WINDOW_DAYS = 60;
const DEMO_SESSION_KEY = 'safeshift.demo.session';
const NOW = new Date();

function addDays(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d;
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function computeStatus(expiresAt: string | null): CertStatus {
  if (!expiresAt) return 'active';
  const days = Math.floor((new Date(expiresAt).getTime() - NOW.getTime()) / 86_400_000);
  if (days < 0) return 'expired';
  if (days <= EXPIRING_WINDOW_DAYS) return 'expiring';
  return 'active';
}
function daysToExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.floor((new Date(expiresAt).getTime() - NOW.getTime()) / 86_400_000);
}

interface TenantSeed {
  slug: string;
  displayName: string;
  theme: Tenant['theme'];
  features: Tenant['features'];
  safetyProgramLabels: Tenant['safetyProgramLabels'];
  siteName: string;
}

const TENANT_SEEDS: TenantSeed[] = [
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
    siteName: 'Deer Park Refinery',
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
    siteName: 'Baytown Refinery',
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
    siteName: 'Richmond Refinery',
  },
];

function publicTenant(seed: TenantSeed): Tenant {
  return {
    id: seed.slug,
    slug: seed.slug,
    displayName: seed.displayName,
    theme: seed.theme,
    features: seed.features,
    safetyProgramLabels: seed.safetyProgramLabels,
  };
}

const TENANTS: Tenant[] = TENANT_SEEDS.map(publicTenant);

function makeUser(
  slug: string,
  local: 'hse' | 'supervisor' | 'worker' | 'contractor',
  firstName: string,
  lastName: string,
  role: Role,
  isContractor = false,
): User {
  return {
    id: `${slug}-${local}`,
    tenantId: slug,
    email: `${local}@${slug}.safeshift.app`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    role,
    employeeId: `${slug.toUpperCase()}-${local.toUpperCase()}`,
    phone: null,
    isContractor,
  };
}

interface TenantData {
  users: User[];
  trainings: Training[];
  certifications: Certification[];
  toolboxTalks: ToolboxTalk[];
}

const dataCache = new Map<string, TenantData>();

function buildTenantData(seed: TenantSeed): TenantData {
  const slug = seed.slug;
  const site = { id: `${slug}-site`, name: seed.siteName, type: 'refinery' };

  const hse = makeUser(slug, 'hse', 'Dana', 'Reyes', 'hse_manager');
  const supervisor = makeUser(slug, 'supervisor', 'Marcus', 'Hale', 'supervisor');
  const worker = makeUser(slug, 'worker', 'Sam', 'Carter', 'worker');
  const contractor = makeUser(slug, 'contractor', 'Jordan', 'Pike', 'contractor', true);
  const users = [hse, supervisor, worker, contractor];

  const trainings: Training[] = [
    {
      id: `${slug}-tr-1`,
      title: 'HAZWOPER 8-Hour Annual Refresher',
      description: 'Mandatory annual refresher for site hazmat workers.',
      courseCode: 'HAZWOPER8',
      siteId: site.id,
      scheduledAt: addDays(14).toISOString(),
      location: `${seed.siteName} — Training Center`,
      isVirtual: false,
      meetingLink: null,
      capacity: 30,
      mandatory: true,
      facilitator: 'Dana Reyes',
      status: 'scheduled',
      Site: site,
    },
    {
      id: `${slug}-tr-2`,
      title: `Toolbox Talk: ${seed.safetyProgramLabels.programName}`,
      description: 'Pre-shift safety briefing with digital sign-in.',
      courseCode: null,
      siteId: site.id,
      scheduledAt: addDays(2).toISOString(),
      location: null,
      isVirtual: true,
      meetingLink: 'https://meet.safeshift.app/toolbox',
      capacity: null,
      mandatory: false,
      facilitator: 'Marcus Hale',
      status: 'scheduled',
      Site: site,
    },
    {
      id: `${slug}-tr-3`,
      title: 'OSHA 30-Hour General Industry',
      description: 'Completed certification course.',
      courseCode: 'OSHA30',
      siteId: site.id,
      scheduledAt: addDays(-30).toISOString(),
      location: `${seed.siteName} — Room 101`,
      isVirtual: false,
      meetingLink: null,
      capacity: 25,
      mandatory: true,
      facilitator: 'Dana Reyes',
      status: 'completed',
      Site: site,
    },
  ];

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
    { user: supervisor, code: 'OSHA30', name: 'OSHA 30-Hour Construction', issuedOffset: -200, expiresOffset: 500 },
    { user: supervisor, code: 'HAZWOPER8', name: 'HAZWOPER 8-Hour Refresher', issuedOffset: -340, expiresOffset: 45 },
    { user: supervisor, code: 'FALLPROT', name: 'Fall Protection', issuedOffset: -800, expiresOffset: -90 },
  ];

  const certifications: Certification[] = certSpecs.map((c, i) => {
    const expiresAt = isoDate(addDays(c.expiresOffset));
    return {
      id: `${slug}-cert-${i + 1}`,
      userId: c.user.id,
      courseCode: c.code,
      name: c.name,
      issuer: 'SafeLandUSA',
      issuedAt: isoDate(addDays(c.issuedOffset)),
      expiresAt,
      fileUrl: null,
      status: computeStatus(expiresAt),
      daysToExpiry: daysToExpiry(expiresAt),
      user: { id: c.user.id, fullName: c.user.fullName, role: c.user.role },
    };
  });

  const toolboxTalks: ToolboxTalk[] = [
    {
      id: `${slug}-tb-1`,
      siteId: site.id,
      topic: 'Pre-Shift Safety Briefing',
      description: 'Daily hazard review and PPE check.',
      scheduledAt: addDays(1).toISOString(),
      location: `${seed.siteName} — Muster Point A`,
      facilitator: 'Marcus Hale',
      site,
    },
    {
      id: `${slug}-tb-2`,
      siteId: site.id,
      topic: 'Heat Stress Awareness',
      description: 'Recognizing and preventing heat-related illness on site.',
      scheduledAt: addDays(3).toISOString(),
      location: `${seed.siteName} — Unit 4`,
      facilitator: 'Dana Reyes',
      site,
    },
  ];

  return { users, trainings, certifications, toolboxTalks };
}

function tenantData(slug: string): TenantData {
  const cached = dataCache.get(slug);
  if (cached) return cached;
  const seed = TENANT_SEEDS.find((t) => t.slug === slug) ?? TENANT_SEEDS[0];
  const built = buildTenantData(seed);
  dataCache.set(seed.slug, built);
  return built;
}

// ── Demo session persistence ────────────────────────────────────────────────
interface DemoSession {
  token: string;
  email: string;
  role: Role;
  tenantSlug: string | null;
}

function readSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}
function writeSession(session: DemoSession): void {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}
export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_SESSION_KEY);
}

function adminUser(email: string): User {
  return {
    id: 'platform-admin',
    tenantId: null,
    email,
    firstName: 'Platform',
    lastName: 'Admin',
    fullName: 'Platform Admin',
    role: 'platform_admin',
    employeeId: null,
    phone: null,
    isContractor: false,
  };
}

function resolveIdentity(email: string): { user: User; tenant: Tenant | null; role: Role; slug: string | null } | null {
  const normalized = email.trim().toLowerCase();
  if (normalized === 'admin@safeshift.app') {
    return { user: adminUser(normalized), tenant: null, role: 'platform_admin', slug: null };
  }
  const match = /^(hse|supervisor|worker|contractor)@(shell|exxon|chevron)\.safeshift\.app$/.exec(normalized);
  if (!match) return null;
  const slug = match[2];
  const data = tenantData(slug);
  const user = data.users.find((u) => u.email === normalized)!;
  const tenant = TENANTS.find((t) => t.slug === slug) ?? null;
  return { user, tenant, role: user.role, slug };
}

// ── Endpoint resolution ─────────────────────────────────────────────────────
function isSelfOnly(role: Role): boolean {
  return role === 'worker' || role === 'contractor';
}

function activeSlugForRequest(): string {
  const session = readSession();
  return getActiveTenantSlug() ?? session?.tenantSlug ?? 'shell';
}

function filteredCerts(slug: string): Certification[] {
  const session = readSession();
  const data = tenantData(slug);
  if (session && isSelfOnly(session.role)) {
    return data.certifications.filter((c) => c.userId === `${slug}-${session.role === 'worker' ? 'worker' : 'contractor'}`);
  }
  return data.certifications;
}

function buildSummary(certs: Certification[]): CertSummary {
  const summary: CertSummary = {
    total: certs.length,
    active: 0,
    expiring: 0,
    expired: 0,
    expiringIn30: 0,
    expiringIn60: 0,
    expiringIn90: 0,
  };
  for (const c of certs) {
    summary[c.status] += 1;
    const d = c.daysToExpiry;
    if (d !== null && d >= 0) {
      if (d <= 30) summary.expiringIn30 += 1;
      if (d <= 60) summary.expiringIn60 += 1;
      if (d <= 90) summary.expiringIn90 += 1;
    }
  }
  return summary;
}

function dashboardFor(slug: string): Dashboard {
  const data = tenantData(slug);
  const certs = data.certifications;
  const certStatus = { active: 0, expiring: 0, expired: 0 };
  for (const c of certs) certStatus[c.status] += 1;
  const upcoming = data.trainings.filter(
    (t) => t.status === 'scheduled' && new Date(t.scheduledAt).getTime() >= NOW.getTime(),
  ).length;
  const auditReadiness = certs.length === 0 ? 100 : Math.round((certStatus.active / certs.length) * 100);
  const recentTrainings = [...data.trainings].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
  return {
    scope: 'tenant',
    stats: {
      workforce: data.users.length,
      upcomingTrainings: upcoming,
      completedTrainings: data.trainings.filter((t) => t.status === 'completed').length,
      certifications: certs.length,
      certStatus,
      auditReadiness,
    },
    recentTrainings,
  };
}

function platformDashboard(): Dashboard {
  return {
    scope: 'platform',
    tenants: TENANT_SEEDS.map((seed) => {
      const data = tenantData(seed.slug);
      return {
        slug: seed.slug,
        displayName: seed.displayName,
        users: data.users.length,
        trainings: data.trainings.length,
        certifications: data.certifications.length,
      };
    }),
  };
}

function managedUsers(slug: string): ManagedUser[] {
  const data = tenantData(slug);
  return data.users.map((u) => {
    const certs = data.certifications.filter((c) => c.userId === u.id);
    const summary = { active: 0, expiring: 0, expired: 0 };
    for (const c of certs) summary[c.status] += 1;
    return { ...u, certs: summary };
  });
}

function ok<T>(config: InternalAxiosRequestConfig, data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  } as AxiosResponse<T>;
}

function fail(config: InternalAxiosRequestConfig, status: number, error: string): never {
  const err = new Error(error) as Error & {
    isAxiosError: boolean;
    response: { data: { error: string }; status: number; statusText: string; headers: object; config: InternalAxiosRequestConfig };
    config: InternalAxiosRequestConfig;
  };
  err.isAxiosError = true;
  err.config = config;
  err.response = { data: { error }, status, statusText: 'Error', headers: {}, config };
  throw err;
}

/** Main entry point: resolve an axios request against the demo fixtures. */
export function resolveDemoRequest(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const method = (config.method ?? 'get').toLowerCase();
  const path = (config.url ?? '').split('?')[0];

  // Auth
  if (path === '/auth/login' && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data ?? {};
    const identity = resolveIdentity(String(body.email ?? ''));
    if (!identity || !String(body.password ?? '').length) {
      return Promise.resolve().then(() => fail(config, 401, 'Invalid email or password'));
    }
    const token = `demo.${btoa(identity.user.email)}`;
    writeSession({ token, email: identity.user.email, role: identity.role, tenantSlug: identity.slug });
    return Promise.resolve(ok(config, { token, user: identity.user, tenant: identity.tenant }));
  }

  if (path === '/auth/me' && method === 'get') {
    const session = readSession();
    if (!session) return Promise.resolve().then(() => fail(config, 401, 'Authentication required'));
    const identity = resolveIdentity(session.email);
    if (!identity) return Promise.resolve().then(() => fail(config, 401, 'Authentication required'));
    return Promise.resolve(ok(config, { user: identity.user, tenant: identity.tenant }));
  }

  // Public branding catalog
  if (path === '/tenants' && method === 'get') {
    return Promise.resolve(ok(config, { tenants: TENANTS }));
  }

  // Dashboard
  if (path === '/dashboard' && method === 'get') {
    const session = readSession();
    const activeSlug = getActiveTenantSlug();
    if (session?.role === 'platform_admin' && !activeSlug) {
      return Promise.resolve(ok(config, platformDashboard()));
    }
    return Promise.resolve(ok(config, dashboardFor(activeSlugForRequest())));
  }

  // Trainings
  if (path === '/trainings' && method === 'get') {
    return Promise.resolve(ok(config, { trainings: tenantData(activeSlugForRequest()).trainings }));
  }
  if (/^\/trainings\/[^/]+\/attend$/.test(path) && method === 'post') {
    return Promise.resolve(ok(config, { ok: true }));
  }
  if (path === '/trainings' && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data ?? {};
    const slug = activeSlugForRequest();
    const training: Training = {
      id: `${slug}-tr-${Date.now()}`,
      title: String(body.title ?? 'New training'),
      description: body.description ?? null,
      courseCode: body.courseCode ?? null,
      siteId: body.siteId ?? null,
      scheduledAt: body.scheduledAt ?? addDays(7).toISOString(),
      location: body.location ?? null,
      isVirtual: Boolean(body.isVirtual),
      meetingLink: null,
      capacity: body.capacity ?? null,
      mandatory: Boolean(body.mandatory),
      facilitator: body.facilitator ?? null,
      status: 'scheduled',
      Site: null,
    };
    tenantData(slug).trainings.unshift(training);
    return Promise.resolve(ok(config, { training }));
  }

  // Certifications
  if (path === '/certifications' && method === 'get') {
    return Promise.resolve(ok(config, { certifications: filteredCerts(activeSlugForRequest()) }));
  }
  if (path === '/certifications/summary' && method === 'get') {
    return Promise.resolve(ok(config, { summary: buildSummary(filteredCerts(activeSlugForRequest())) }));
  }
  if (path === '/certifications/scan' && method === 'post') {
    const certs = filteredCerts(activeSlugForRequest());
    return Promise.resolve(
      ok(config, { result: { scanned: certs.length, updated: 0, alertsSent: certs.filter((c) => c.status !== 'active').length } }),
    );
  }

  // Toolbox talks
  if (path === '/toolbox-talks' && method === 'get') {
    return Promise.resolve(ok(config, { talks: tenantData(activeSlugForRequest()).toolboxTalks }));
  }
  if (/^\/toolbox-talks\/[^/]+$/.test(path) && method === 'get') {
    const id = path.split('/').pop();
    const talk = tenantData(activeSlugForRequest()).toolboxTalks.find((t) => t.id === id);
    if (!talk) return Promise.resolve().then(() => fail(config, 404, 'Toolbox talk not found'));
    return Promise.resolve(ok(config, { talk: { ...talk, signins: [] } }));
  }
  if (/^\/toolbox-talks\/[^/]+\/signin$/.test(path) && method === 'post') {
    return Promise.resolve(ok(config, { ok: true }));
  }

  // Users (admin)
  if (path === '/users' && method === 'get') {
    return Promise.resolve(ok(config, { users: managedUsers(activeSlugForRequest()) }));
  }

  // Health
  if (path === '/health') {
    return Promise.resolve(ok(config, { ok: true, service: 'safeshift-demo' }));
  }

  return Promise.resolve().then(() => fail(config, 404, `Demo: unhandled ${method.toUpperCase()} ${path}`));
}

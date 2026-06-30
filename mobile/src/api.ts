import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SafeShift mobile data layer.
 *
 * Worker-facing app: log in and confirm completion of tasks (toolbox sign-ins,
 * training attendance, safety acknowledgements).
 *
 * Modes:
 *  - DEMO (default): fully self-contained, seeded data + local confirmations in
 *    AsyncStorage. Works on any device / the web export with NO backend.
 *  - LIVE: set `EXPO_PUBLIC_API_URL` (e.g. https://api.example.com/api) to talk
 *    to the real SafeShift Express API.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
export const USE_DEMO = !API_URL;

const SESSION_KEY = 'safeshift.mobile.session.v2';
const CONFIRMS_KEY = 'safeshift.mobile.confirms.v2';
const DEMO_PASSWORD = 'Passw0rd!';

// ── Types ───────────────────────────────────────────────────────────────────
export interface BrandTheme {
  logoText: string;
  primary: string;
  secondary: string;
}
export interface SafetyLabels {
  signOff: string;
  programName: string;
  slogan: string;
}
export interface Tenant {
  id: string;
  slug: string;
  displayName: string;
  theme: BrandTheme;
  safetyProgramLabels: SafetyLabels;
}
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}
export interface Session {
  token: string;
  user: User;
  tenant: Tenant | null;
}
export type TaskKind = 'toolbox' | 'training' | 'acknowledgement';
export interface Task {
  id: string;
  kind: TaskKind;
  title: string;
  detail?: string;
  whenISO?: string;
  location?: string;
  mandatory?: boolean;
  confirmLabel: string;
}
export interface TaskView extends Task {
  confirmedAt: string | null;
}
export type CertStatus = 'active' | 'expiring' | 'expired';
export interface Cert {
  id: string;
  name: string;
  issuer: string | null;
  status: CertStatus;
  expiresAt: string | null;
  daysToExpiry: number | null;
}

// ── Demo fixtures (mirror server/src/db/seed.ts) ────────────────────────────
const NOW = new Date();
function addDays(days: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d;
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function daysTo(dateISO: string | null): number | null {
  if (!dateISO) return null;
  return Math.floor((new Date(dateISO).getTime() - NOW.getTime()) / 86_400_000);
}
function certStatus(dateISO: string | null): CertStatus {
  const d = daysTo(dateISO);
  if (d === null) return 'active';
  if (d < 0) return 'expired';
  if (d <= 60) return 'expiring';
  return 'active';
}

interface TenantSeed extends Tenant {
  siteName: string;
}

const TENANTS: TenantSeed[] = [
  {
    id: 'shell',
    slug: 'shell',
    displayName: 'SafeShift Shell',
    theme: { logoText: 'Shell', primary: '#DD1D21', secondary: '#FBCE07' },
    safetyProgramLabels: {
      signOff: 'Life-Saving Rules acknowledgement',
      programName: 'Life-Saving Rules · Goal Zero',
      slogan: 'Goal Zero — no harm, no leaks',
    },
    siteName: 'Deer Park Refinery',
  },
  {
    id: 'exxon',
    slug: 'exxon',
    displayName: 'SafeShift ExxonMobil',
    theme: { logoText: 'ExxonMobil', primary: '#CE1126', secondary: '#0054A4' },
    safetyProgramLabels: {
      signOff: 'OIMS attestation',
      programName: 'Operations Integrity Management System',
      slogan: 'Nobody Gets Hurt',
    },
    siteName: 'Baytown Refinery',
  },
  {
    id: 'chevron',
    slug: 'chevron',
    displayName: 'SafeShift Chevron',
    theme: { logoText: 'Chevron', primary: '#0066B2', secondary: '#ED1C24' },
    safetyProgramLabels: {
      signOff: 'OE / Tenets sign-off',
      programName: 'Operational Excellence',
      slogan: 'Tenets of Operation · Stop Work Authority',
    },
    siteName: 'Richmond Refinery',
  },
];

const NAMES: Record<string, { first: string; last: string; role: string }> = {
  hse: { first: 'Dana', last: 'Reyes', role: 'hse_manager' },
  supervisor: { first: 'Marcus', last: 'Hale', role: 'supervisor' },
  worker: { first: 'Sam', last: 'Carter', role: 'worker' },
  contractor: { first: 'Jordan', last: 'Pike', role: 'contractor' },
};

export function tenantList(): Tenant[] {
  return TENANTS.map(({ siteName: _siteName, ...t }) => t);
}

function findTenant(slug: string | null): TenantSeed | null {
  return TENANTS.find((t) => t.slug === slug) ?? null;
}

function demoTasks(slug: string): Task[] {
  const t = findTenant(slug) ?? TENANTS[0];
  return [
    {
      id: `${slug}-tb-1`,
      kind: 'toolbox',
      title: 'Pre-Shift Safety Briefing',
      detail: 'Daily hazard review and PPE check.',
      whenISO: addDays(0).toISOString(),
      location: `${t.siteName} — Muster Point A`,
      confirmLabel: 'Sign in',
    },
    {
      id: `${slug}-tb-2`,
      kind: 'toolbox',
      title: 'Heat Stress Awareness',
      detail: 'Recognizing and preventing heat-related illness on site.',
      whenISO: addDays(0).toISOString(),
      location: `${t.siteName} — Unit 4`,
      confirmLabel: 'Sign in',
    },
    {
      id: `${slug}-tr-1`,
      kind: 'training',
      title: 'HAZWOPER 8-Hour Annual Refresher',
      detail: 'Mandatory annual refresher for site hazmat workers.',
      whenISO: addDays(2).toISOString(),
      location: `${t.siteName} — Training Center`,
      mandatory: true,
      confirmLabel: 'Confirm attendance',
    },
    {
      id: `${slug}-ack-1`,
      kind: 'acknowledgement',
      title: t.safetyProgramLabels.signOff,
      detail: t.safetyProgramLabels.slogan,
      mandatory: true,
      confirmLabel: 'Acknowledge',
    },
  ];
}

function demoCerts(slug: string): Cert[] {
  const specs = [
    { name: 'OSHA 10-Hour General Industry', off: 400 },
    { name: 'H2S Awareness', off: 20 },
    { name: 'Confined Space Entry', off: -10 },
  ];
  return specs.map((s, i) => {
    const expires = isoDate(addDays(s.off));
    return {
      id: `${slug}-cert-${i + 1}`,
      name: s.name,
      issuer: 'SafeLandUSA',
      status: certStatus(expires),
      expiresAt: expires,
      daysToExpiry: daysTo(expires),
    };
  });
}

function identityFromEmail(email: string): { user: User; tenant: Tenant | null } | null {
  const e = email.trim().toLowerCase();
  if (e === 'admin@safeshift.app') {
    return { user: { id: 'platform-admin', email: e, fullName: 'Platform Admin', role: 'platform_admin' }, tenant: null };
  }
  const m = /^(hse|supervisor|worker|contractor)@(shell|exxon|chevron)\.safeshift\.app$/.exec(e);
  if (!m) return null;
  const who = NAMES[m[1]];
  const tenant = tenantList().find((t) => t.slug === m[2]) ?? null;
  return {
    user: { id: `${m[2]}-${m[1]}`, email: e, fullName: `${who.first} ${who.last}`, role: who.role },
    tenant,
  };
}

// ── Confirmations (local, works in both modes) ──────────────────────────────
type ConfirmMap = Record<string, Record<string, string>>; // userId -> taskId -> atISO

async function readConfirms(): Promise<ConfirmMap> {
  try {
    const raw = await AsyncStorage.getItem(CONFIRMS_KEY);
    return raw ? (JSON.parse(raw) as ConfirmMap) : {};
  } catch {
    return {};
  }
}
async function writeConfirms(map: ConfirmMap): Promise<void> {
  await AsyncStorage.setItem(CONFIRMS_KEY, JSON.stringify(map));
}

// ── Live API helpers ────────────────────────────────────────────────────────
async function apiRequest<T>(
  path: string,
  opts: { method?: 'GET' | 'POST'; session?: Session | null; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.session?.token) headers.Authorization = `Bearer ${opts.session.token}`;
  if (opts.session?.tenant?.slug) headers['X-Tenant'] = opts.session.tenant.slug;
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) message = j.error;
    } catch {
      /* noop */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

// ── Public API ──────────────────────────────────────────────────────────────
export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function login(email: string, password: string): Promise<Session> {
  if (USE_DEMO) {
    const identity = identityFromEmail(email);
    if (!identity || !password) throw new Error('Invalid email or password');
    const session: Session = {
      token: `demo.${identity.user.id}`,
      user: identity.user,
      tenant: identity.tenant,
    };
    await saveSession(session);
    return session;
  }
  const data = await apiRequest<{ token: string; user: { id: string; fullName: string; role: string; email: string }; tenant: Tenant | null }>(
    '/auth/login',
    { method: 'POST', body: { email: email.trim().toLowerCase(), password } },
  );
  const session: Session = {
    token: data.token,
    user: { id: data.user.id, email: data.user.email, fullName: data.user.fullName, role: data.user.role },
    tenant: data.tenant,
  };
  await saveSession(session);
  return session;
}

export async function getTasks(session: Session): Promise<TaskView[]> {
  const slug = session.tenant?.slug ?? 'shell';
  let tasks: Task[];
  if (USE_DEMO) {
    tasks = demoTasks(slug);
  } else {
    const [tr, tb] = await Promise.all([
      apiRequest<{ trainings: { id: string; title: string; description: string | null; scheduledAt: string; location: string | null; mandatory: boolean; status: string }[] }>('/trainings', { session }),
      apiRequest<{ talks: { id: string; topic: string; description: string | null; scheduledAt: string; location: string | null }[] }>('/toolbox-talks', { session }),
    ]);
    const trainingTasks: Task[] = tr.trainings
      .filter((t) => t.status === 'scheduled')
      .map((t) => ({
        id: t.id,
        kind: 'training',
        title: t.title,
        detail: t.description ?? undefined,
        whenISO: t.scheduledAt,
        location: t.location ?? undefined,
        mandatory: t.mandatory,
        confirmLabel: 'Confirm attendance',
      }));
    const toolboxTasks: Task[] = tb.talks.map((t) => ({
      id: t.id,
      kind: 'toolbox',
      title: t.topic,
      detail: t.description ?? undefined,
      whenISO: t.scheduledAt,
      location: t.location ?? undefined,
      confirmLabel: 'Sign in',
    }));
    tasks = [...toolboxTasks, ...trainingTasks];
  }
  const confirms = await readConfirms();
  const mine = confirms[session.user.id] ?? {};
  return tasks.map((t) => ({ ...t, confirmedAt: mine[t.id] ?? null }));
}

export async function confirmTask(session: Session, task: Task): Promise<string> {
  const atISO = new Date().toISOString();
  // Persist locally so the confirmation survives reloads in any mode.
  const confirms = await readConfirms();
  const mine = confirms[session.user.id] ?? {};
  mine[task.id] = atISO;
  confirms[session.user.id] = mine;
  await writeConfirms(confirms);

  // Best-effort sync to the live backend.
  if (!USE_DEMO) {
    try {
      if (task.kind === 'training') {
        await apiRequest(`/trainings/${task.id}/attend`, { method: 'POST', session, body: { method: 'self-declared' } });
      } else if (task.kind === 'toolbox') {
        await apiRequest(`/toolbox-talks/${task.id}/signin`, { method: 'POST', session, body: { method: 'manual' } });
      }
    } catch {
      /* keep local confirmation even if the network call fails */
    }
  }
  return atISO;
}

export async function getCerts(session: Session): Promise<Cert[]> {
  const slug = session.tenant?.slug ?? 'shell';
  if (USE_DEMO) return demoCerts(slug);
  const data = await apiRequest<{ certifications: { id: string; name: string; issuer: string | null; status: CertStatus; expiresAt: string | null; daysToExpiry: number | null }[] }>(
    '/certifications',
    { session },
  );
  return data.certifications.map((c) => ({
    id: c.id,
    name: c.name,
    issuer: c.issuer,
    status: c.status,
    expiresAt: c.expiresAt,
    daysToExpiry: c.daysToExpiry,
  }));
}

export const DEMO_LOGIN = { email: 'worker@shell.safeshift.app', password: DEMO_PASSWORD };

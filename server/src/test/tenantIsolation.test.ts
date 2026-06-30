import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Certification, sequelize, Tenant, User } from '../models';
import { runUnscoped, runWithContext } from '../context/tenantContext';
import { ROLES } from '../constants';
import type { FeatureMap } from '../constants';

/**
 * Tenant-isolation integration test — the security-critical guarantee (§5.2):
 * application code can never read or write across tenants because Sequelize
 * hooks auto-scope every query from the request context.
 *
 * Requires a throwaway Postgres (CI provides one). Gated behind RUN_DB_TESTS=1
 * so the default `npm test` stays fast and DB-free.
 */
const RUN = process.env.RUN_DB_TESTS === '1';

const FEATURES: FeatureMap = {
  certTracker: true,
  toolboxTalks: true,
  incidentReporting: true,
  stopWorkAuthority: true,
  safetyObservations: true,
  permitToWork: true,
  contractorCompliance: true,
  sdsLibrary: true,
  auditsInspections: true,
  fleetGarageSafety: true,
  emergencyDrills: true,
};

function brandSeed(slug: string) {
  return {
    slug,
    displayName: `Test ${slug}`,
    theme: { logoText: slug, primary: '#000000', secondary: '#111111', accent: '#222222' },
    features: FEATURES,
    safetyProgramLabels: { signOff: 'sign', programName: 'program', slogan: 'slogan' },
  };
}

describe.runIf(RUN)('tenant isolation (DB)', () => {
  let alphaId = '';
  let betaId = '';
  let alphaUserId = '';
  let betaUserId = '';
  let betaCertId = '';

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await runUnscoped(async () => {
      const alpha = await Tenant.create(brandSeed('alpha'));
      const beta = await Tenant.create(brandSeed('beta'));
      alphaId = alpha.id;
      betaId = beta.id;

      const alphaUser = await User.create({
        tenantId: alpha.id,
        email: 'worker@alpha.test',
        passwordHash: 'x',
        firstName: 'Alpha',
        lastName: 'Worker',
        role: ROLES.WORKER,
      });
      const betaUser = await User.create({
        tenantId: beta.id,
        email: 'worker@beta.test',
        passwordHash: 'x',
        firstName: 'Beta',
        lastName: 'Worker',
        role: ROLES.WORKER,
      });
      alphaUserId = alphaUser.id;
      betaUserId = betaUser.id;

      await Certification.create({ tenantId: alpha.id, userId: alphaUser.id, name: 'Alpha cert', issuedAt: '2025-01-01' });
      const betaCert = await Certification.create({ tenantId: beta.id, userId: betaUser.id, name: 'Beta cert', issuedAt: '2025-01-01' });
      betaCertId = betaCert.id;
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const ctx = (tenantId: string) => ({
    tenantId,
    userId: null,
    role: ROLES.HSE_MANAGER as string,
    bypassTenantScope: false,
  });

  it('findAll only returns rows for the active tenant', async () => {
    const certs = await runWithContext(ctx(alphaId), () => Certification.findAll());
    expect(certs).toHaveLength(1);
    expect(certs.every((c) => c.tenantId === alphaId)).toBe(true);
  });

  it('cannot read another tenant row by primary key', async () => {
    const found = await runWithContext(ctx(alphaId), () => Certification.findByPk(betaCertId));
    expect(found).toBeNull();
  });

  it('auto-stamps tenantId from context on create', async () => {
    const cert = await runWithContext(ctx(betaId), () =>
      Certification.create({ userId: betaUserId, name: 'Beta cert 2', issuedAt: '2025-02-02' }),
    );
    expect(cert.tenantId).toBe(betaId);
  });

  it('counts are tenant-scoped', async () => {
    const alphaCount = await runWithContext(ctx(alphaId), () => Certification.count());
    const betaCount = await runWithContext(ctx(betaId), () => Certification.count());
    expect(alphaCount).toBe(1);
    expect(betaCount).toBe(2);
  });

  it('an unscoped (platform) context sees every tenant', async () => {
    const all = await runUnscoped(() => Certification.findAll());
    expect(all.length).toBeGreaterThanOrEqual(3);
    const tenantIds = new Set(all.map((c) => c.tenantId));
    expect(tenantIds.has(alphaId)).toBe(true);
    expect(tenantIds.has(betaId)).toBe(true);
  });

  it('prevents writing a user into another tenant by leaking through context', async () => {
    // Even if app code forgets to set tenantId, the hook stamps the active one.
    const user = await runWithContext(ctx(alphaId), () =>
      User.create({ email: 'leak@alpha.test', passwordHash: 'x', firstName: 'No', lastName: 'Leak', role: ROLES.WORKER }),
    );
    expect(user.tenantId).toBe(alphaId);
  });

  it('voids unused seed ids defensively', () => {
    expect(alphaUserId).not.toBe('');
  });
});

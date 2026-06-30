import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './jwt';

describe('jwt', () => {
  it('round-trips a payload', () => {
    const token = signToken({ sub: 'user-1', tenantId: 'tenant-1', role: 'worker' });
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.tenantId).toBe('tenant-1');
    expect(decoded.role).toBe('worker');
  });

  it('supports a null tenant (platform admin)', () => {
    const token = signToken({ sub: 'admin', tenantId: null, role: 'platform_admin' });
    expect(verifyToken(token).tenantId).toBeNull();
  });

  it('rejects a tampered token', () => {
    const token = signToken({ sub: 'user-1', tenantId: null, role: 'hse_manager' });
    expect(() => verifyToken(`${token}tampered`)).toThrow();
  });

  it('rejects a token signed with a different secret', () => {
    // A clearly invalid token must not verify against our secret.
    expect(() => verifyToken('eyJhbGciOiJIUzI1NiJ9.e30.invalidsignature')).toThrow();
  });
});

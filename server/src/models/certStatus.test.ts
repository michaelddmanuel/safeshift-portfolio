import { describe, expect, it } from 'vitest';
import { computeCertStatus, daysToExpiry } from './Certification';

const DAY = 86_400_000;
const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('computeCertStatus', () => {
  it('is active when expiry is more than 60 days out', () => {
    expect(computeCertStatus(new Date(NOW.getTime() + 90 * DAY), NOW)).toBe('active');
  });

  it('is expiring within the 60-day window', () => {
    expect(computeCertStatus(new Date(NOW.getTime() + 30 * DAY), NOW)).toBe('expiring');
    expect(computeCertStatus(new Date(NOW.getTime() + 60 * DAY), NOW)).toBe('expiring');
  });

  it('is expired once the date has passed', () => {
    expect(computeCertStatus(new Date(NOW.getTime() - DAY), NOW)).toBe('expired');
  });

  it('treats a null expiry as active (does not expire)', () => {
    expect(computeCertStatus(null, NOW)).toBe('active');
  });
});

describe('daysToExpiry', () => {
  it('computes whole days remaining', () => {
    expect(daysToExpiry(new Date(NOW.getTime() + 10 * DAY), NOW)).toBe(10);
  });

  it('is negative once overdue', () => {
    expect(daysToExpiry(new Date(NOW.getTime() - 5 * DAY), NOW)).toBe(-5);
  });

  it('is null when there is no expiry', () => {
    expect(daysToExpiry(null, NOW)).toBeNull();
  });
});

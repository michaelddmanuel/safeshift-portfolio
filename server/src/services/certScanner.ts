import { Op } from 'sequelize';
import { runUnscoped } from '../context/tenantContext';
import { Certification, computeCertStatus, daysToExpiry } from '../models/Certification';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import { sendMail } from './mailer';
import { CERT_EXPIRING_WINDOW_DAYS } from '../constants';

export interface CertScanResult {
  scanned: number;
  updated: number;
  expiringSoon: number;
  expired: number;
  alertsSent: number;
}

/**
 * Nightly cert-expiry scan (§14.9): recompute denormalized status on every
 * certification and email workers whose certs are expiring within the window or
 * already expired. Runs unscoped across all tenants (platform job).
 */
export async function scanCertifications(now: Date = new Date()): Promise<CertScanResult> {
  return runUnscoped(async () => {
    const certs = await Certification.findAll({ where: { expiresAt: { [Op.ne]: null } } });

    const result: CertScanResult = {
      scanned: certs.length,
      updated: 0,
      expiringSoon: 0,
      expired: 0,
      alertsSent: 0,
    };

    // Group at-risk certs by user so each person gets one digest email.
    const atRiskByUser = new Map<string, Certification[]>();

    for (const cert of certs) {
      const next = computeCertStatus(cert.expiresAt, now);
      if (next !== cert.status) {
        cert.status = next;
        await cert.save();
        result.updated += 1;
      }
      if (next === 'expiring') result.expiringSoon += 1;
      if (next === 'expired') result.expired += 1;
      if (next === 'expiring' || next === 'expired') {
        const list = atRiskByUser.get(cert.userId) ?? [];
        list.push(cert);
        atRiskByUser.set(cert.userId, list);
      }
    }

    for (const [userId, userCerts] of atRiskByUser) {
      const user = await User.findByPk(userId);
      if (!user || !user.isActive) continue;
      const tenant = user.tenantId ? await Tenant.findByPk(user.tenantId) : null;
      const brand = tenant?.displayName ?? 'SafeShift';

      const lines = userCerts
        .map((c) => {
          const d = daysToExpiry(c.expiresAt, now);
          const when = d === null ? '' : d < 0 ? `expired ${-d} day(s) ago` : `expires in ${d} day(s)`;
          return `  • ${c.name} — ${when} (${c.expiresAt})`;
        })
        .join('\n');

      await sendMail({
        to: user.email,
        subject: `[${brand}] Action needed: ${userCerts.length} certification(s) expiring`,
        text:
          `Hi ${user.firstName},\n\n` +
          `The following certifications need renewal to keep you audit-ready ` +
          `(within ${CERT_EXPIRING_WINDOW_DAYS} days):\n\n${lines}\n\n` +
          `Please schedule a refresher in SafeShift.\n\n— ${brand} HSE`,
      });
      result.alertsSent += 1;
    }

    return result;
  });
}

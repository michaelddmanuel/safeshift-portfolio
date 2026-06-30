import cron from 'node-cron';
import { env } from '../config/env';
import { scanCertifications } from '../services/certScanner';

/** Schedules the nightly certification-expiry scan (§14.9). */
export function startCertExpiryJob(): void {
  if (!cron.validate(env.certScanCron)) {
    console.warn(`[cron] Invalid CERT_SCAN_CRON "${env.certScanCron}" — cert scan disabled.`);
    return;
  }
  cron.schedule(env.certScanCron, async () => {
    try {
      const result = await scanCertifications();
      console.log('[cron] cert scan:', result);
    } catch (err) {
      console.error('[cron] cert scan failed:', err);
    }
  });
  console.log(`[cron] cert-expiry scan scheduled (${env.certScanCron}).`);
}

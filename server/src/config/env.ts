import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),

  db: {
    // A full connection string (e.g. Supabase) takes precedence over the
    // individual fields below when set. Format:
    //   postgresql://USER:PASSWORD@HOST:PORT/DBNAME
    url: process.env.DATABASE_URL ?? '',
    host: required('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 5544),
    name: required('DB_NAME', 'safeshift'),
    user: required('DB_USER', 'safeshift'),
    password: required('DB_PASSWORD', 'safeshift'),
    // Force TLS on/off. When unset we infer: on for remote hosts (Supabase
    // Cloud), off for localhost (Docker / Supabase local CLI).
    ssl: process.env.DB_SSL,
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev-only-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',

  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.MAIL_FROM ?? 'SafeShift HSE <no-reply@safeshift.app>',
  },

  certScanCron: process.env.CERT_SCAN_CRON ?? '0 7 * * *',
};

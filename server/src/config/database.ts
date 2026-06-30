import { Sequelize, type Options } from 'sequelize';
import { env } from './env';

/**
 * Managed Postgres (Supabase Cloud, Neon, RDS…) requires TLS; local Docker and
 * the Supabase local CLI do not. Honor DB_SSL when set, else infer from host.
 */
function resolveSsl(host: string): boolean {
  if (env.db.ssl !== undefined) return env.db.ssl === 'true';
  const local = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  return !local;
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

const useUrl = env.db.url.length > 0;
const sslEnabled = resolveSsl(useUrl ? hostFromUrl(env.db.url) : env.db.host);

const commonOptions: Options = {
  dialect: 'postgres',
  logging: env.isProd
    ? false
    : (msg) => {
        // Keep SQL noise low; uncomment for deep debugging.
        if (process.env.SQL_DEBUG === 'true') console.log(msg);
      },
  define: {
    underscored: true,
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 0,
    idle: 10_000,
  },
  // rejectUnauthorized:false lets us connect to Supabase's pooler without
  // bundling its CA chain — fine for dev/demo. Provide the CA to harden prod.
  dialectOptions: sslEnabled ? { ssl: { require: true, rejectUnauthorized: false } } : {},
};

export const sequelize = useUrl
  ? new Sequelize(env.db.url, commonOptions)
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      ...commonOptions,
      host: env.db.host,
      port: env.db.port,
    });

export async function assertDbConnection(): Promise<void> {
  await sequelize.authenticate();
}

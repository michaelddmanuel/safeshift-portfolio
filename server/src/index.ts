import './models'; // register models + associations
import { createApp } from './app';
import { env } from './config/env';
import { assertDbConnection, sequelize } from './config/database';
import { startCertExpiryJob } from './jobs/certExpiryJob';

async function main(): Promise<void> {
  await assertDbConnection();
  // Dev convenience: keep schema in sync with models. Use migrations in prod.
  await sequelize.sync({ alter: !env.isProd });

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`\n  SafeShift API → http://localhost:${env.port}/api/health`);
    console.log(`  Web origin    → ${env.webOrigin}\n`);
  });

  startCertExpiryJob();
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

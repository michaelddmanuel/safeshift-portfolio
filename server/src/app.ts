import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { resolveTenant } from './middleware/context';
import { errorHandler } from './middleware/error';
import routes from './routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.webOrigin,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant'],
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  if (!env.isProd) app.use(morgan('dev'));

  // Establish per-request tenant context (must precede any scoped DB access).
  app.use(resolveTenant);

  app.use('/api', routes);

  app.use(errorHandler);
  return app;
}

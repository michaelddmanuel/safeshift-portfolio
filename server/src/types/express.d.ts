import type { RequestContext } from '../context/tenantContext';
import type { User } from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ctx: RequestContext;
      user?: User;
    }
  }
}

export {};

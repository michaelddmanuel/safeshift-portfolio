import type { Request } from 'express';
import { z, type ZodTypeAny } from 'zod';

/** Parse+validate a request body against a Zod schema (throws ZodError → 422). */
export function parseBody<T extends ZodTypeAny>(schema: T, req: Request): z.infer<T> {
  return schema.parse(req.body);
}

/** Parse+validate query params. */
export function parseQuery<T extends ZodTypeAny>(schema: T, req: Request): z.infer<T> {
  return schema.parse(req.query);
}

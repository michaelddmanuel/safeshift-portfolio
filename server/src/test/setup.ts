/**
 * Vitest global setup. Provides safe defaults so unit tests never depend on a
 * developer's local .env. DB-backed tests are gated behind RUN_DB_TESTS=1.
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

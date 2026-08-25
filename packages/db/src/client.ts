import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Connection pool for long-running server (API, worker)
const pool = postgres(connectionString, {
  max: parseInt(process.env['DATABASE_POOL_MAX'] ?? '10', 10),
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(pool, {
  schema,
  logger: process.env['NODE_ENV'] === 'development',
});

export type Database = typeof db;

// Re-export schema for convenience
export * from './schema/index.js';

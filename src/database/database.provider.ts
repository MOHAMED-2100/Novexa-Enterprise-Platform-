import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';
export const PG_POOL_PROVIDER = 'PG_POOL_PROVIDER';

export type DrizzleDB = NodePgDatabase<typeof schema>;

export interface DatabaseHealthResult {
  connected: boolean;
  latencyMs: number;
  serverVersion?: string;
  error?: string;
}

export function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return 'postgres://novexa:novexa_secret@localhost:5432/novexa_db';
  }
  // Extract clean postgresql:// or postgres:// URL if pasted with comments, quotes, or multiple lines
  const match = raw.match(/postgres(?:ql)?:\/\/[^\s"']+/);
  return match ? match[0] : raw.trim();
}

let poolInstance: pg.Pool | null = null;
let dbInstance: DrizzleDB | null = null;

export function getPgPool(): pg.Pool {
  if (!poolInstance) {
    const connectionString = resolveDatabaseUrl();
    const isCloudDatabase =
      connectionString.includes('sslmode=') ||
      connectionString.includes('neon.tech') ||
      connectionString.includes('supabase.co') ||
      (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

    poolInstance = new Pool({
      connectionString,
      ssl: isCloudDatabase ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      max: 10,
    });

    poolInstance.on('error', (err) => {
      // Log unexpected pool errors without crashing application process
      console.error('[PostgreSQL Pool Error]', err.message);
    });
  }
  return poolInstance;
}

export function getDrizzleDb(): DrizzleDB {
  if (!dbInstance) {
    const pool = getPgPool();
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

/**
 * Executes an active probe on the PostgreSQL connection to verify readiness.
 */
export async function testDatabaseConnection(): Promise<DatabaseHealthResult> {
  const pool = getPgPool();
  const startTime = Date.now();

  try {
    const client = await pool.connect();
    try {
      const res = await client.query<{ version: string }>('SELECT version();');
      const latencyMs = Date.now() - startTime;
      return {
        connected: true,
        latencyMs,
        serverVersion: res.rows[0]?.version?.split(' ')?.[1] ?? 'PostgreSQL',
      };
    } finally {
      client.release();
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return {
      connected: false,
      latencyMs,
      error: error?.message || 'Database connection refused',
    };
  }
}

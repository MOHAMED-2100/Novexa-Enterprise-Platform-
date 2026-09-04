import 'dotenv/config';
import pg from 'pg';
import { resolveDatabaseUrl } from './database.provider.js';

const { Pool } = pg;

export async function runMigrations() {
  const connectionString = resolveDatabaseUrl();
  const isCloudDatabase =
    connectionString.includes('sslmode=') ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase.co') ||
    (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

  console.log(`[Migration] Connecting to PostgreSQL at ${connectionString.replace(/:[^:@]+@/, ':****@')}...`);

  const pool = new Pool({
    connectionString,
    ssl: isCloudDatabase ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    console.log('[Migration] Applying schema for Phase 0: modules table...');

    // Create modules table per architecture specifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        code VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        "group" VARCHAR(64) NOT NULL,
        depends_on JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create index on group and status for rapid filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_modules_group ON modules ("group");
      CREATE INDEX IF NOT EXISTS idx_modules_status ON modules (status);
    `);

    // Seed baseline platform modules if table is empty
    const { rows } = await client.query('SELECT COUNT(*)::int as count FROM modules;');
    if (rows[0].count === 0) {
      console.log('[Migration] Seeding initial core platform modules...');
      await client.query(`
        INSERT INTO modules (code, name, "group", depends_on, status)
        VALUES
          ('core', 'Novexa Enterprise Core', 'platform', '[]'::jsonb, 'active'),
          ('health', 'System Diagnostics & Telemetry', 'system', '["core"]'::jsonb, 'active'),
          ('i18n', 'Architectural Multi-Language Engine', 'system', '["core"]'::jsonb, 'active')
        ON CONFLICT (code) DO NOTHING;
      `);
    }

    console.log('[Migration] Schema migration completed successfully.');
  } catch (error: any) {
    console.error('[Migration] Failed to execute database migrations:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow direct CLI execution: tsx src/database/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

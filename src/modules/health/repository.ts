import { Inject, Injectable } from '@nestjs/common';
import pg from 'pg';
import { PG_POOL_PROVIDER, DRIZZLE_PROVIDER } from '../../database/database.provider.js';
import type { DrizzleDB } from '../../database/database.provider.js';
import { DatabaseHealthEntity, ModulesHealthEntity } from './entity.js';

@Injectable()
export class HealthRepository {
  constructor(
    @Inject(PG_POOL_PROVIDER) private readonly pool: pg.Pool,
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB,
  ) {}

  /**
   * Probes the PostgreSQL database actively with SELECT version()
   */
  async checkDatabase(): Promise<DatabaseHealthEntity> {
    const startTime = Date.now();
    const rawTarget = (this.pool as any).options?.connectionString || '';
    const maskedTarget = rawTarget.replace(/:[^:@]+@/, ':****@').trim();
    // Keep host and db if it is a long URI
    const connectionTarget = maskedTarget.length > 70
      ? maskedTarget.slice(0, 70) + '...'
      : (maskedTarget || 'PostgreSQL Server');

    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query<{ version: string }>('SELECT version();');
        const latencyMs = Date.now() - startTime;
        const versionString = result.rows[0]?.version?.split(' ')?.[1] || 'PostgreSQL';

        return {
          connected: true,
          status: 'connected',
          latencyMs,
          serverVersion: versionString,
          connectionTarget,
        };
      } finally {
        client.release();
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      return {
        connected: false,
        status: 'disconnected',
        latencyMs,
        error: error?.message || 'Connection refused',
        connectionTarget,
      };
    }
  }

  /**
   * Checks whether the architectural `modules` table exists in PostgreSQL and returns its row count
   */
  async checkModulesTable(): Promise<ModulesHealthEntity> {
    try {
      const client = await this.pool.connect();
      try {
        const tableCheck = await client.query<{ exists: boolean }>(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'modules'
          );
        `);

        const tableExists = !!tableCheck.rows[0]?.exists;
        let totalRegistered = 0;

        if (tableExists) {
          const countRes = await client.query<{ count: string }>('SELECT COUNT(*)::int as count FROM modules;');
          totalRegistered = parseInt(countRes.rows[0]?.count || '0', 10);
        }

        return {
          tableExists,
          totalRegistered,
        };
      } finally {
        client.release();
      }
    } catch {
      return {
        tableExists: false,
        totalRegistered: 0,
      };
    }
  }
}

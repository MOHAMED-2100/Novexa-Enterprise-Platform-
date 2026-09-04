import { Injectable, Inject } from '@nestjs/common';
import pg from 'pg';
import { PG_POOL_PROVIDER } from '../../database/database.provider.js';
import { TenantModuleStatus } from './entity.js';

@Injectable()
export class AdminRepository {
  constructor(@Inject(PG_POOL_PROVIDER) private readonly pool: pg.Pool) {}

  async getAllModulesWithTenantStatus(tenantId: string): Promise<TenantModuleStatus[]> {
    const query = `
      SELECT
        m.code,
        m.name,
        m."group",
        m.depends_on,
        m.status,
        (tem.module_code IS NOT NULL) AS "isEnabled",
        tem.enabled_at AS "enabledAt",
        tem.enabled_by AS "enabledBy"
      FROM modules m
      LEFT JOIN tenant_enabled_modules tem
        ON tem.module_code = m.code AND tem.tenant_id = $1
      ORDER BY m.group ASC, m.code ASC;
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows.map((row) => ({
      code: row.code,
      name: row.name,
      group: row.group,
      depends_on: Array.isArray(row.depends_on) ? row.depends_on : [],
      status: row.status,
      isEnabled: Boolean(row.isEnabled),
      enabledAt: row.enabledAt || null,
      enabledBy: row.enabledBy || null,
    }));
  }

  async findModule(code: string): Promise<{ code: string; name: string; depends_on: string[] } | null> {
    const query = 'SELECT code, name, depends_on FROM modules WHERE code = $1 LIMIT 1;';
    const result = await this.pool.query(query, [code]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      code: row.code,
      name: row.name,
      depends_on: Array.isArray(row.depends_on) ? row.depends_on : [],
    };
  }

  async getTenantEnabledModules(tenantId: string): Promise<string[]> {
    const query = 'SELECT module_code FROM tenant_enabled_modules WHERE tenant_id = $1;';
    const result = await this.pool.query<{ module_code: string }>(query, [tenantId]);
    return result.rows.map((r) => r.module_code);
  }

  async enableModule(tenantId: string, moduleCode: string, enabledBy: string): Promise<void> {
    const query = `
      INSERT INTO tenant_enabled_modules (tenant_id, module_code, enabled_by, enabled_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (tenant_id, module_code) DO NOTHING;
    `;
    await this.pool.query(query, [tenantId, moduleCode, enabledBy]);
  }

  async disableModule(tenantId: string, moduleCode: string): Promise<void> {
    const query = 'DELETE FROM tenant_enabled_modules WHERE tenant_id = $1 AND module_code = $2;';
    await this.pool.query(query, [tenantId, moduleCode]);
  }

  async findDependentActiveModules(tenantId: string, moduleCode: string): Promise<string[]> {
    // Find all modules enabled for this tenant that declare moduleCode in their depends_on
    const query = `
      SELECT tem.module_code, m.name
      FROM tenant_enabled_modules tem
      INNER JOIN modules m ON m.code = tem.module_code
      WHERE tem.tenant_id = $1
        AND tem.module_code != $2
        AND m.depends_on ? $2;
    `;
    const result = await this.pool.query<{ module_code: string }>(query, [tenantId, moduleCode]);
    return result.rows.map((r) => r.module_code);
  }
}

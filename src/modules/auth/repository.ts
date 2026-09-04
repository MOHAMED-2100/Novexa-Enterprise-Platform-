import { Injectable, Inject } from '@nestjs/common';
import pg from 'pg';
import { PG_POOL_PROVIDER } from '../../database/database.provider.js';
import { UserEntity } from './entity.js';

@Injectable()
export class AuthRepository {
  constructor(@Inject(PG_POOL_PROVIDER) private readonly pool: pg.Pool) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;';
    const result = await this.pool.query<UserEntity>(query, [email.trim()]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const query = 'SELECT * FROM users WHERE id = $1 LIMIT 1;';
    const result = await this.pool.query<UserEntity>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Directly retrieves actual database-backed permissions for a given user.
   * Joins user_roles -> role_permissions -> permissions.
   * Guarantees that permissions are verified from the database and not trusted from client payloads.
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT p.code
      FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id = p.id
      INNER JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = $1;
    `;
    const result = await this.pool.query<{ code: string }>(query, [userId]);
    return result.rows.map((row) => row.code);
  }

  /**
   * Retrieves active assigned roles for a given user.
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT r.code
      FROM roles r
      INNER JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = $1;
    `;
    const result = await this.pool.query<{ code: string }>(query, [userId]);
    return result.rows.map((row) => row.code);
  }

  /**
   * Retrieves list of module codes enabled for a specific tenant.
   */
  async getTenantEnabledModules(tenantId: string): Promise<string[]> {
    const query = `
      SELECT tem.module_code
      FROM tenant_enabled_modules tem
      WHERE tem.tenant_id = $1
      ORDER BY tem.module_code ASC;
    `;
    const result = await this.pool.query<{ module_code: string }>(query, [tenantId]);
    return result.rows.map((row) => row.module_code);
  }

  /**
   * Checks whether a specific module is enabled for a tenant.
   */
  async isModuleEnabled(tenantId: string, moduleCode: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM tenant_enabled_modules
      WHERE tenant_id = $1 AND module_code = $2
      LIMIT 1;
    `;
    const result = await this.pool.query(query, [tenantId, moduleCode]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Checks dependencies of a module from the modules table.
   */
  async getModuleDependencies(moduleCode: string): Promise<string[]> {
    const query = `
      SELECT depends_on FROM modules
      WHERE code = $1
      LIMIT 1;
    `;
    const result = await this.pool.query<{ depends_on: string[] }>(query, [moduleCode]);
    if (!result.rows[0] || !result.rows[0].depends_on) {
      return [];
    }
    const deps = result.rows[0].depends_on;
    return Array.isArray(deps) ? deps : [];
  }
}

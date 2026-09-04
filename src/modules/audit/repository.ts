import { Injectable, Inject } from '@nestjs/common';
import pg from 'pg';
import { PG_POOL_PROVIDER } from '../../database/database.provider.js';
import { AuditLogEntity, CreateAuditLogDto } from './entity.js';

@Injectable()
export class AuditRepository {
  constructor(@Inject(PG_POOL_PROVIDER) private readonly pool: pg.Pool) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLogEntity> {
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const query = `
      INSERT INTO audit_logs (
        id, tenant_id, user_id, action, entity_name, entity_id,
        before_state, after_state, ip_address, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `;
    const values = [
      id,
      dto.tenant_id,
      dto.user_id || null,
      dto.action,
      dto.entity_name,
      dto.entity_id || null,
      dto.before_state ? JSON.stringify(dto.before_state) : null,
      dto.after_state ? JSON.stringify(dto.after_state) : null,
      dto.ip_address || null,
    ];

    const result = await this.pool.query<AuditLogEntity>(query, values);
    return result.rows[0];
  }

  async findByTenant(tenantId: string, limit = 50): Promise<AuditLogEntity[]> {
    const query = `
      SELECT * FROM audit_logs
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const result = await this.pool.query<AuditLogEntity>(query, [tenantId, limit]);
    return result.rows;
  }
}

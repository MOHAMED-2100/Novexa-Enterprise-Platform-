import { Injectable, Inject, Logger } from '@nestjs/common';
import { AuditRepository } from './repository.js';
import { AuditLogEntity, CreateAuditLogDto } from './entity.js';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(AuditRepository) private readonly auditRepo: AuditRepository) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLogEntity | null> {
    try {
      const entry = await this.auditRepo.create(dto);
      this.logger.log(`[Audit] Action=${dto.action} Entity=${dto.entity_name} Tenant=${dto.tenant_id} User=${dto.user_id || 'anonymous'}`);
      return entry;
    } catch (err: any) {
      this.logger.error(`[Audit Failure] Failed to record audit log: ${err.message}`, err.stack);
      return null;
    }
  }

  async getLogs(tenantId: string, limit = 50): Promise<AuditLogEntity[]> {
    return this.auditRepo.findByTenant(tenantId, limit);
  }
}

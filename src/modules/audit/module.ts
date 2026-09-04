import { Module, Global } from '@nestjs/common';
import { AuditRepository } from './repository.js';
import { AuditService } from './service.js';

@Global()
@Module({
  providers: [AuditRepository, AuditService],
  exports: [AuditService, AuditRepository],
})
export class AuditModule {}

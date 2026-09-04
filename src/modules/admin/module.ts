import { Module } from '@nestjs/common';
import { AdminRepository } from './repository.js';
import { AdminService } from './service.js';
import { AdminController } from './controller.js';
import { AuditModule } from '../audit/module.js';

@Module({
  imports: [AuditModule],
  controllers: [AdminController],
  providers: [AdminRepository, AdminService],
  exports: [AdminService, AdminRepository],
})
export class AdminModule {}

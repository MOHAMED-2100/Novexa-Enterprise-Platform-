import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { I18nModule } from '../i18n/i18n.module.js';
import { HealthModule } from '../modules/health/module.js';
import { ModulesModule } from '../modules/modules/module.js';
import { AuditModule } from '../modules/audit/module.js';
import { AuthModule } from '../modules/auth/module.js';
import { AdminModule } from '../modules/admin/module.js';
import { FinanceModule } from '../modules/finance/module.js';

@Module({
  imports: [
    DatabaseModule,
    I18nModule,
    AuditModule,
    AuthModule,
    AdminModule,
    FinanceModule,
    HealthModule,
    ModulesModule,
  ],
})
export class AppModule {}


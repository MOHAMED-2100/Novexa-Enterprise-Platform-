import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { I18nModule } from '../i18n/i18n.module.js';
import { HealthModule } from '../modules/health/module.js';
import { ModulesModule } from '../modules/modules/module.js';

@Module({
  imports: [
    DatabaseModule,
    I18nModule,
    HealthModule,
    ModulesModule,
  ],
})
export class AppModule {}

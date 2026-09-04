import { Inject, Injectable } from '@nestjs/common';
import { HealthRepository } from './repository.js';
import { HealthStatusEntity } from './entity.js';
import { I18nService } from '../../i18n/i18n.service.js';

@Injectable()
export class HealthService {
  constructor(
    @Inject(HealthRepository) private readonly repository: HealthRepository,
    @Inject(I18nService) private readonly i18nService: I18nService,
  ) {}

  async getHealth(langHeader?: string): Promise<HealthStatusEntity> {
    const lang = this.i18nService.resolveLanguage(langHeader);
    const dbHealth = await this.repository.checkDatabase();
    const modulesHealth = dbHealth.connected
      ? await this.repository.checkModulesTable()
      : { tableExists: false, totalRegistered: 0 };

    const isHealthy = dbHealth.connected;
    const localizedMessage = isHealthy
      ? this.i18nService.translate('system.status.healthy', lang)
      : this.i18nService.translate('system.status.unavailable', lang);

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      language: lang,
      localizedMessage,
      database: dbHealth,
      modules: modulesHealth,
    };
  }
}

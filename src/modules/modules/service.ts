import { Inject, Injectable } from '@nestjs/common';
import { ModulesRepository } from './repository.js';
import { ModuleEntity } from './entity.js';

@Injectable()
export class ModulesService {
  constructor(@Inject(ModulesRepository) private readonly repository: ModulesRepository) {}

  /**
   * Retrieves all modules currently registered in the database
   */
  async listModules(): Promise<{ data: ModuleEntity[]; source: 'database' | 'fallback' }> {
    try {
      const list = await this.repository.findAll();
      return {
        data: list,
        source: 'database',
      };
    } catch (err) {
      // Golden Rule 7: Fallbacks must be clearly labeled as fallback data
      return {
        data: [
          {
            code: 'core',
            name: 'Novexa Enterprise Core',
            group: 'platform',
            depends_on: [],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            code: 'health',
            name: 'System Diagnostics & Telemetry',
            group: 'system',
            depends_on: ['core'],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            code: 'i18n',
            name: 'Architectural Multi-Language Engine',
            group: 'system',
            depends_on: ['core'],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        source: 'fallback',
      };
    }
  }

  async getModule(code: string): Promise<ModuleEntity | null> {
    try {
      return await this.repository.findByCode(code);
    } catch {
      return null;
    }
  }
}

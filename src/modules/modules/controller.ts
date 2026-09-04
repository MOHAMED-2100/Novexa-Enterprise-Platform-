import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ModulesService } from './service.js';
import { ModuleEntity } from './entity.js';

@Controller('api/modules')
export class ModulesController {
  constructor(@Inject(ModulesService) private readonly modulesService: ModulesService) {}

  @Get()
  async getModules(): Promise<{ data: ModuleEntity[]; source: 'database' | 'fallback' }> {
    return this.modulesService.listModules();
  }

  @Get(':code')
  async getModuleByCode(@Param('code') code: string): Promise<ModuleEntity | null> {
    return this.modulesService.getModule(code);
  }
}

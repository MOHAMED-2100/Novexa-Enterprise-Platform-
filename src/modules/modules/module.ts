import { Module } from '@nestjs/common';
import { ModulesController } from './controller.js';
import { ModulesService } from './service.js';
import { ModulesRepository } from './repository.js';

@Module({
  controllers: [ModulesController],
  providers: [ModulesService, ModulesRepository],
  exports: [ModulesService],
})
export class ModulesModule {}

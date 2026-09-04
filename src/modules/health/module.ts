import { Module } from '@nestjs/common';
import { HealthController } from './controller.js';
import { HealthService } from './service.js';
import { HealthRepository } from './repository.js';

@Module({
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
  exports: [HealthService],
})
export class HealthModule {}

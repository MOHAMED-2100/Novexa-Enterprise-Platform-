import { Module } from '@nestjs/common';
import { FinanceController } from './controller.js';

@Module({
  controllers: [FinanceController],
})
export class FinanceModule {}

import { Global, Module } from '@nestjs/common';
import {
  DRIZZLE_PROVIDER,
  PG_POOL_PROVIDER,
  getDrizzleDb,
  getPgPool,
} from './database.provider.js';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_PROVIDER,
      useFactory: () => getDrizzleDb(),
    },
    {
      provide: PG_POOL_PROVIDER,
      useFactory: () => getPgPool(),
    },
  ],
  exports: [DRIZZLE_PROVIDER, PG_POOL_PROVIDER],
})
export class DatabaseModule {}

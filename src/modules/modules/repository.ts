import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from '../../database/database.provider.js';
import type { DrizzleDB } from '../../database/database.provider.js';
import { modulesTable } from '../../database/schema.js';
import { ModuleEntity } from './entity.js';

@Injectable()
export class ModulesRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDB) {}

  /**
   * Fetches all registered platform modules from the PostgreSQL database
   */
  async findAll(): Promise<ModuleEntity[]> {
    const records = await this.db.select().from(modulesTable);
    return records.map((r) => ({
      code: r.code,
      name: r.name,
      group: r.group,
      depends_on: r.depends_on || [],
      status: r.status as 'active' | 'inactive' | 'pending',
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  /**
   * Finds a specific module by its architectural code
   */
  async findByCode(code: string): Promise<ModuleEntity | null> {
    const records = await this.db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.code, code))
      .limit(1);

    if (!records.length) return null;
    const r = records[0];
    return {
      code: r.code,
      name: r.name,
      group: r.group,
      depends_on: r.depends_on || [],
      status: r.status as 'active' | 'inactive' | 'pending',
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }
}

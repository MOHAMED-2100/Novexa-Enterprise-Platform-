import { pgTable, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Core modules table storing architectural components of the Novexa Modular Monolith.
 * Structure per Enterprise Architecture Phase 0:
 * - code: Unique identifier for the module (e.g., 'core', 'health', 'iam', 'fi')
 * - name: Human-readable module name
 * - group: Functional cluster (e.g., 'platform', 'system', 'financial', 'supply-chain')
 * - depends_on: Array of module codes required as dependencies
 * - status: Current module registration status ('active', 'inactive', 'pending')
 */
export const modulesTable = pgTable('modules', {
  code: varchar('code', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  group: varchar('group', { length: 64 }).notNull(),
  depends_on: jsonb('depends_on').$type<string[]>().default([]).notNull(),
  status: varchar('status', { length: 32 }).default('active').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Module = typeof modulesTable.$inferSelect;
export type NewModule = typeof modulesTable.$inferInsert;

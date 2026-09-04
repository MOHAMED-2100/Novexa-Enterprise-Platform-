import { pgTable, varchar, jsonb, timestamp, text, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Core modules table storing architectural components of the Novexa Modular Monolith.
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

/**
 * Multi-tenant Users table for authentication
 */
export const usersTable = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  tenant_id: varchar('tenant_id', { length: 64 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

/**
 * Roles table
 */
export const rolesTable = pgTable('roles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 64 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  tenant_id: varchar('tenant_id', { length: 64 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Role = typeof rolesTable.$inferSelect;
export type NewRole = typeof rolesTable.$inferInsert;

/**
 * Permissions table
 */
export const permissionsTable = pgTable('permissions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Permission = typeof permissionsTable.$inferSelect;
export type NewPermission = typeof permissionsTable.$inferInsert;

/**
 * Many-to-Many: Role <-> Permission
 */
export const rolePermissionsTable = pgTable(
  'role_permissions',
  {
    role_id: varchar('role_id', { length: 64 })
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    permission_id: varchar('permission_id', { length: 64 })
      .notNull()
      .references(() => permissionsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.role_id, t.permission_id] })]
);

/**
 * Many-to-Many: User <-> Role
 */
export const userRolesTable = pgTable(
  'user_roles',
  {
    user_id: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    role_id: varchar('role_id', { length: 64 })
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.user_id, t.role_id] })]
);

/**
 * Audit Log table automatically recording create/update/delete operations
 */
export const auditLogsTable = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenant_id: varchar('tenant_id', { length: 64 }).notNull(),
  user_id: varchar('user_id', { length: 64 }),
  action: varchar('action', { length: 64 }).notNull(),
  entity_name: varchar('entity_name', { length: 64 }).notNull(),
  entity_id: varchar('entity_id', { length: 64 }),
  before_state: jsonb('before_state'),
  after_state: jsonb('after_state'),
  ip_address: varchar('ip_address', { length: 64 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type NewAuditLog = typeof auditLogsTable.$inferInsert;

/**
 * Tenant Enabled Modules table tracking which modules are active for each tenant
 */
export const tenantEnabledModulesTable = pgTable(
  'tenant_enabled_modules',
  {
    tenant_id: varchar('tenant_id', { length: 64 }).notNull(),
    module_code: varchar('module_code', { length: 64 })
      .notNull()
      .references(() => modulesTable.code, { onDelete: 'cascade' }),
    enabled_at: timestamp('enabled_at', { withTimezone: true }).defaultNow().notNull(),
    enabled_by: varchar('enabled_by', { length: 64 }),
  },
  (t) => [primaryKey({ columns: [t.tenant_id, t.module_code] })]
);

export type TenantEnabledModule = typeof tenantEnabledModulesTable.$inferSelect;
export type NewTenantEnabledModule = typeof tenantEnabledModulesTable.$inferInsert;

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  roles: many(userRolesTable),
}));

export const rolesRelations = relations(rolesTable, ({ many }) => ({
  users: many(userRolesTable),
  permissions: many(rolePermissionsTable),
}));

export const permissionsRelations = relations(permissionsTable, ({ many }) => ({
  roles: many(rolePermissionsTable),
}));

export const userRolesRelations = relations(userRolesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userRolesTable.user_id],
    references: [usersTable.id],
  }),
  role: one(rolesTable, {
    fields: [userRolesTable.role_id],
    references: [rolesTable.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissionsTable, ({ one }) => ({
  role: one(rolesTable, {
    fields: [rolePermissionsTable.role_id],
    references: [rolesTable.id],
  }),
  permission: one(permissionsTable, {
    fields: [rolePermissionsTable.permission_id],
    references: [permissionsTable.id],
  }),
}));


import 'dotenv/config';
import pg from 'pg';
import { resolveDatabaseUrl } from './database.provider.js';

const { Pool } = pg;

export async function runMigrations() {
  const connectionString = resolveDatabaseUrl();
  const isCloudDatabase =
    connectionString.includes('sslmode=') ||
    connectionString.includes('neon.tech') ||
    connectionString.includes('supabase.co') ||
    (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

  console.log(`[Migration] Connecting to PostgreSQL at ${connectionString.replace(/:[^:@]+@/, ':****@')}...`);

  const pool = new Pool({
    connectionString,
    ssl: isCloudDatabase ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    console.log('[Migration] Applying schema for Phase 0 & Phase 1: modules, users, roles, permissions, audit_logs, tenant_enabled_modules...');

    // 1. Modules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        code VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        "group" VARCHAR(64) NOT NULL,
        depends_on JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_modules_group ON modules ("group");
      CREATE INDEX IF NOT EXISTS idx_modules_status ON modules (status);
    `);

    // 2. Multi-tenant Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_tenant ON users (tenant_id);
    `);

    // 3. Roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles (tenant_id);
    `);

    // 4. Permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Many-to-Many: role_permissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );
    `);

    // 6. Many-to-Many: user_roles
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );
    `);

    // 7. Audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64),
        action VARCHAR(64) NOT NULL,
        entity_name VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64),
        before_state JSONB,
        after_state JSONB,
        ip_address VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_tenant_action ON audit_logs (tenant_id, action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
    `);

    // 8. Tenant Enabled Modules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_enabled_modules (
        tenant_id VARCHAR(64) NOT NULL,
        module_code VARCHAR(64) NOT NULL REFERENCES modules(code) ON DELETE CASCADE,
        enabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        enabled_by VARCHAR(64),
        PRIMARY KEY (tenant_id, module_code)
      );
      CREATE INDEX IF NOT EXISTS idx_tenant_modules ON tenant_enabled_modules (tenant_id);
    `);

    // Seed modules
    await client.query(`
      INSERT INTO modules (code, name, "group", depends_on, status)
      VALUES
        ('core', 'Novexa Enterprise Core', 'platform', '[]'::jsonb, 'active'),
        ('health', 'System Diagnostics & Telemetry', 'system', '["core"]'::jsonb, 'active'),
        ('i18n', 'Architectural Multi-Language Engine', 'system', '["core"]'::jsonb, 'active'),
        ('auth', 'Identity & Access Management (RBAC)', 'security', '["core"]'::jsonb, 'active'),
        ('finance', 'Financial Accounting (FI/CO)', 'financial', '["core"]'::jsonb, 'active'),
        ('inventory', 'Inventory Management (MM/WM)', 'operations', '["core"]'::jsonb, 'active'),
        ('procurement', 'Sourcing & Procurement', 'operations', '["inventory"]'::jsonb, 'active'),
        ('hrm', 'Human Capital Management', 'hcm', '["core"]'::jsonb, 'active')
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        "group" = EXCLUDED."group",
        depends_on = EXCLUDED.depends_on,
        status = EXCLUDED.status;
    `);

    // Seed permissions
    await client.query(`
      INSERT INTO permissions (id, code, name, description)
      VALUES
        ('perm_admin_modules', 'admin.modules.manage', 'Manage Enterprise Modules', 'Permission to enable or disable modules for tenants'),
        ('perm_admin_audit', 'admin.audit.view', 'View Audit Logs', 'Permission to view audit trails and compliance records'),
        ('perm_system_view', 'system.view', 'View System Diagnostics', 'Permission to view system telemetry and health metrics'),
        ('perm_finance_view', 'finance.view', 'View Financial Records', 'Permission to view financial charts and balances')
      ON CONFLICT (code) DO NOTHING;
    `);

    // Seed roles for tenant_default
    await client.query(`
      INSERT INTO roles (id, code, name, tenant_id)
      VALUES
        ('role_super_admin', 'super_admin', 'Super Administrator', 'tenant_default'),
        ('role_standard_user', 'standard_user', 'Standard User', 'tenant_default')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Link role permissions
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES
        ('role_super_admin', 'perm_admin_modules'),
        ('role_super_admin', 'perm_admin_audit'),
        ('role_super_admin', 'perm_system_view'),
        ('role_super_admin', 'perm_finance_view'),
        ('role_standard_user', 'perm_system_view')
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    `);

    // Seed default users:
    // Admin: admin@novexa.com / Admin123!
    // User:  user@novexa.com  / User123!
    await client.query(`
      INSERT INTO users (id, email, password_hash, tenant_id)
      VALUES
        ('usr_admin_001', 'admin@novexa.com', '$2b$10$MMwyH6N5vaROZm/P6t77uO8/IDhVTGdfhvwoaAUz/unoOJ8oc5tpG', 'tenant_default'),
        ('usr_standard_001', 'user@novexa.com', '$2b$10$Sy/X/q9tUXrixKk13UlDYuDYe6f1i6ZWFaoTE6sv4gB9N9NfMGk1u', 'tenant_default')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Link users to roles
    await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES
        ('usr_admin_001', 'role_super_admin'),
        ('usr_standard_001', 'role_standard_user')
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `);

    // Seed default enabled modules for tenant_default: core, health, i18n, auth
    await client.query(`
      INSERT INTO tenant_enabled_modules (tenant_id, module_code, enabled_by)
      VALUES
        ('tenant_default', 'core', 'system'),
        ('tenant_default', 'health', 'system'),
        ('tenant_default', 'i18n', 'system'),
        ('tenant_default', 'auth', 'system')
      ON CONFLICT (tenant_id, module_code) DO NOTHING;
    `);

    console.log('[Migration] Schema migration and Phase 1 seeding completed successfully.');
  } catch (error: any) {
    console.error('[Migration] Failed to execute database migrations:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow direct CLI execution: tsx src/database/migrate.ts
if (process.argv[1] && (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js'))) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

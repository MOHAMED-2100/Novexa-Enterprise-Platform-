import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Ip,
  Query,
  Inject,
} from '@nestjs/common';
import { AdminService } from './service.js';
import { AuditService } from '../audit/service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RequirePermissions, CurrentUser } from '../auth/guards/decorators.js';
import type { AuthenticatedUser } from '../auth/entity.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /**
   * GET /admin/tenants/:id/modules & GET /api/admin/tenants/:id/modules
   * Lists all enterprise modules and their active status for this tenant.
   */
  @Get(['admin/tenants/:id/modules', 'api/admin/tenants/:id/modules'])
  @RequirePermissions('admin.modules.manage')
  async getTenantModules(@Param('id') tenantId: string) {
    const modules = await this.adminService.getModulesForTenant(tenantId);
    return {
      tenant_id: tenantId,
      modules,
    };
  }

  /**
   * POST /admin/tenants/:id/modules/:code/enable & POST /api/admin/tenants/:id/modules/:code/enable
   * Enables an enterprise module, enforcing dependency checks (depends_on).
   * Requirement 9.
   */
  @Post(['admin/tenants/:id/modules/:code/enable', 'api/admin/tenants/:id/modules/:code/enable'])
  @RequirePermissions('admin.modules.manage')
  async enableModule(
    @Param('id') tenantId: string,
    @Param('code') moduleCode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ipAddress: string
  ) {
    return this.adminService.enableModule(tenantId, moduleCode, user.id, ipAddress);
  }

  /**
   * POST /admin/tenants/:id/modules/:code/disable & POST /api/admin/tenants/:id/modules/:code/disable
   * Disables an enterprise module, preventing breaking active dependents.
   * Requirement 9.
   */
  @Post(['admin/tenants/:id/modules/:code/disable', 'api/admin/tenants/:id/modules/:code/disable'])
  @RequirePermissions('admin.modules.manage')
  async disableModule(
    @Param('id') tenantId: string,
    @Param('code') moduleCode: string,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ipAddress: string
  ) {
    return this.adminService.disableModule(tenantId, moduleCode, user.id, ipAddress);
  }

  /**
   * GET /admin/audit-logs & GET /api/admin/audit-logs
   * Retrieves audit logs for the current tenant.
   * Requirement 6.
   */
  @Get(['admin/audit-logs', 'api/admin/audit-logs'])
  @RequirePermissions('admin.audit.view')
  async getAuditLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const logs = await this.auditService.getLogs(user.tenant_id, parsedLimit);
    return {
      tenant_id: user.tenant_id,
      count: logs.length,
      logs,
    };
  }
}

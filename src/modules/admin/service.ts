import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AdminRepository } from './repository.js';
import { AuditService } from '../audit/service.js';
import { ModuleOperationResult, TenantModuleStatus } from './entity.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(AdminRepository) private readonly adminRepo: AdminRepository,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  async getModulesForTenant(tenantId: string): Promise<TenantModuleStatus[]> {
    return this.adminRepo.getAllModulesWithTenantStatus(tenantId);
  }

  /**
   * Enables a module for a tenant after strictly checking all depends_on requirements.
   * Requirement 8 & 9.
   */
  async enableModule(
    tenantId: string,
    moduleCode: string,
    userId: string,
    ipAddress?: string
  ): Promise<ModuleOperationResult> {
    const mod = await this.adminRepo.findModule(moduleCode);
    if (!mod) {
      throw new NotFoundException(`Module with code '${moduleCode}' does not exist`);
    }

    // Check module dependencies against current tenant enabled modules
    const enabledModules = await this.adminRepo.getTenantEnabledModules(tenantId);

    if (mod.depends_on && mod.depends_on.length > 0) {
      const missingDependencies = mod.depends_on.filter(
        (dep) => !enabledModules.includes(dep)
      );

      if (missingDependencies.length > 0) {
        const errorMsg = `Cannot enable module '${moduleCode}': required dependency '${missingDependencies.join(
          ', '
        )}' is not enabled for tenant '${tenantId}'`;
        this.logger.warn(`[Module Dependency Blocked] ${errorMsg}`);
        throw new BadRequestException(errorMsg);
      }
    }

    const wasEnabled = enabledModules.includes(moduleCode);
    await this.adminRepo.enableModule(tenantId, moduleCode, userId);

    // Record audit log
    await this.auditService.log({
      tenant_id: tenantId,
      user_id: userId,
      action: 'MODULE_ENABLE',
      entity_name: 'tenant_enabled_modules',
      entity_id: moduleCode,
      before_state: { isEnabled: wasEnabled, module_code: moduleCode },
      after_state: { isEnabled: true, module_code: moduleCode, enabled_by: userId },
      ip_address: ipAddress || null,
    });

    return {
      success: true,
      message: `Module '${moduleCode}' enabled successfully for tenant '${tenantId}'`,
      tenant_id: tenantId,
      module_code: moduleCode,
    };
  }

  /**
   * Disables a module for a tenant after checking that no active modules depend on it.
   */
  async disableModule(
    tenantId: string,
    moduleCode: string,
    userId: string,
    ipAddress?: string
  ): Promise<ModuleOperationResult> {
    const mod = await this.adminRepo.findModule(moduleCode);
    if (!mod) {
      throw new NotFoundException(`Module with code '${moduleCode}' does not exist`);
    }

    // Check if any currently enabled module depends on this one
    const activeDependents = await this.adminRepo.findDependentActiveModules(
      tenantId,
      moduleCode
    );

    if (activeDependents.length > 0) {
      const errorMsg = `Cannot disable module '${moduleCode}': active module(s) [${activeDependents.join(
        ', '
      )}] depend on it`;
      this.logger.warn(`[Module Disable Blocked] ${errorMsg}`);
      throw new BadRequestException(errorMsg);
    }

    const enabledModules = await this.adminRepo.getTenantEnabledModules(tenantId);
    const wasEnabled = enabledModules.includes(moduleCode);

    await this.adminRepo.disableModule(tenantId, moduleCode);

    // Record audit log
    await this.auditService.log({
      tenant_id: tenantId,
      user_id: userId,
      action: 'MODULE_DISABLE',
      entity_name: 'tenant_enabled_modules',
      entity_id: moduleCode,
      before_state: { isEnabled: wasEnabled, module_code: moduleCode },
      after_state: { isEnabled: false, module_code: moduleCode },
      ip_address: ipAddress || null,
    });

    return {
      success: true,
      message: `Module '${moduleCode}' disabled successfully for tenant '${tenantId}'`,
      tenant_id: tenantId,
      module_code: moduleCode,
    };
  }
}

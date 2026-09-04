import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from './decorators.js';
import { AuthRepository } from '../repository.js';

@Injectable()
export class ModuleEnabledGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthRepository) private readonly authRepo: AuthRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<string>(
      MODULE_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no module constraint is defined on this controller/handler, allow
    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // Resolve tenantId: from authenticated user first, then header/param/query, or fallback to default
    const tenantId =
      request.user?.tenant_id ||
      request.headers['x-tenant-id'] ||
      request.params?.tenantId ||
      request.params?.id ||
      request.query?.tenantId ||
      'tenant_default';

    // 1. Verify module is enabled for this tenant
    const isEnabled = await this.authRepo.isModuleEnabled(tenantId, requiredModule);
    if (!isEnabled) {
      throw new ForbiddenException(
        `Module '${requiredModule}' is not enabled for tenant '${tenantId}'`
      );
    }

    // 2. Verify all module dependencies (depends_on) are enabled
    const dependencies = await this.authRepo.getModuleDependencies(requiredModule);
    if (dependencies.length > 0) {
      const enabledModules = await this.authRepo.getTenantEnabledModules(tenantId);
      const missingDeps = dependencies.filter((dep) => !enabledModules.includes(dep));

      if (missingDeps.length > 0) {
        throw new ForbiddenException(
          `Module '${requiredModule}' cannot be accessed: missing required dependency '${missingDeps.join(
            ', '
          )}' for tenant '${tenantId}'`
        );
      }
    }

    return true;
  }
}

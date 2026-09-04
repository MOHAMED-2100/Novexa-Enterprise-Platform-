import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../entity.js';

export const PERMISSIONS_KEY = 'permissions';
export const MODULE_KEY = 'module_code';

/**
 * Decorator to require specific permissions on an endpoint.
 * Checked via database-backed PermissionsGuard.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to require that a specific module is enabled for the tenant.
 * Checked via ModuleEnabledGuard.
 */
export const RequireModule = (moduleCode: string) =>
  SetMetadata(MODULE_KEY, moduleCode);

/**
 * Parameter decorator to inject the authenticated user into controller methods.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

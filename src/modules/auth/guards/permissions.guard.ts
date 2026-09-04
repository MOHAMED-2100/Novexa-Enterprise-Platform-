import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators.js';
import { AuthenticatedUser } from '../entity.js';
import { AuthRepository } from '../repository.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthRepository) private readonly authRepo: AuthRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If endpoint has no specific permission requirement, allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }

    // Always query database directly for current authoritative permissions
    // This strictly adheres to: "never trust permission data coming from the client itself"
    const livePermissions = await this.authRepo.getUserPermissions(user.id);

    const hasAllRequired = requiredPermissions.every((permission) =>
      livePermissions.includes(permission)
    );

    if (!hasAllRequired) {
      const missing = requiredPermissions.filter(
        (permission) => !livePermissions.includes(permission)
      );
      throw new ForbiddenException(
        `Forbidden: Access denied. Missing required permission(s): ${missing.join(', ')}`
      );
    }

    return true;
  }
}

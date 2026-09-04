import { Module, Global } from '@nestjs/common';
import { AuthRepository } from './repository.js';
import { AuthService } from './service.js';
import { AuthController } from './controller.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { ModuleEnabledGuard } from './guards/module-enabled.guard.js';
import { AuditModule } from '../audit/module.js';

@Global()
@Module({
  imports: [AuditModule],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    JwtAuthGuard,
    PermissionsGuard,
    ModuleEnabledGuard,
  ],
  exports: [
    AuthRepository,
    AuthService,
    JwtAuthGuard,
    PermissionsGuard,
    ModuleEnabledGuard,
  ],
})
export class AuthModule {}

import { Injectable, Inject, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './repository.js';
import { AuditService } from '../audit/service.js';
import {
  AuthenticatedUser,
  AuthResponseDto,
  AuthTokens,
  JwtTokenPayload,
  LoginDto,
} from './entity.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly accessSecret =
    process.env.JWT_ACCESS_SECRET || 'novexa_super_secret_jwt_access_key_change_in_production';
  private readonly refreshSecret =
    process.env.JWT_REFRESH_SECRET || 'novexa_super_secret_jwt_refresh_key_change_in_production';

  constructor(
    @Inject(AuthRepository) private readonly authRepo: AuthRepository,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /**
   * Authenticates user with email and password via bcrypt.
   */
  async login(dto: LoginDto, ipAddress?: string): Promise<{ tokens: AuthTokens; user: AuthenticatedUser }> {
    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) {
      this.logger.warn(`Failed login attempt: non-existent email ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt: wrong password for user ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Load actual database permissions & roles
    const [roles, permissions] = await Promise.all([
      this.authRepo.getUserRoles(user.id),
      this.authRepo.getUserPermissions(user.id),
    ]);

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      roles,
      permissions,
    };

    const tokens = this.generateTokens(authenticatedUser);

    // Record audit log for successful login
    await this.auditService.log({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'USER_LOGIN_SUCCESS',
      entity_name: 'auth',
      entity_id: user.id,
      after_state: { email: user.email, roles },
      ip_address: ipAddress || null,
    });

    return { tokens, user: authenticatedUser };
  }

  /**
   * Generates a 15-minute JWT access token and 7-day refresh token.
   */
  generateTokens(user: AuthenticatedUser): AuthTokens {
    const accessPayload: JwtTokenPayload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      type: 'access',
    };

    const refreshPayload: JwtTokenPayload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      type: 'refresh',
    };

    const accessToken = jwt.sign(accessPayload, this.accessSecret, {
      expiresIn: '15m', // 15 minutes validity
    });

    const refreshToken = jwt.sign(refreshPayload, this.refreshSecret, {
      expiresIn: '7d', // 7 days validity
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 900 seconds
      tokenType: 'Bearer',
    };
  }

  /**
   * Refreshes access token given a valid refresh token.
   */
  async refresh(refreshToken: string, ipAddress?: string): Promise<{ tokens: AuthTokens; user: AuthenticatedUser }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: JwtTokenPayload;
    try {
      payload = jwt.verify(refreshToken, this.refreshSecret) as JwtTokenPayload;
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.authRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const [roles, permissions] = await Promise.all([
      this.authRepo.getUserRoles(user.id),
      this.authRepo.getUserPermissions(user.id),
    ]);

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      roles,
      permissions,
    };

    const tokens = this.generateTokens(authenticatedUser);

    await this.auditService.log({
      tenant_id: user.tenant_id,
      user_id: user.id,
      action: 'TOKEN_REFRESH_SUCCESS',
      entity_name: 'auth',
      entity_id: user.id,
      ip_address: ipAddress || null,
    });

    return { tokens, user: authenticatedUser };
  }

  /**
   * Verifies access token and loads current user context with live permissions from DB.
   */
  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    let payload: JwtTokenPayload;
    try {
      payload = jwt.verify(token, this.accessSecret) as JwtTokenPayload;
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.authRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const [roles, permissions] = await Promise.all([
      this.authRepo.getUserRoles(user.id),
      this.authRepo.getUserPermissions(user.id),
    ]);

    return {
      id: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      roles,
      permissions,
    };
  }

  /**
   * Fetches user profile with live permissions directly from the database.
   */
  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const [roles, permissions] = await Promise.all([
      this.authRepo.getUserRoles(user.id),
      this.authRepo.getUserPermissions(user.id),
    ]);

    return {
      id: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      roles,
      permissions,
    };
  }

  /**
   * Returns list of enabled module codes for tenant.
   */
  async getEnabledModulesForTenant(tenantId: string): Promise<string[]> {
    return this.authRepo.getTenantEnabledModules(tenantId);
  }
}

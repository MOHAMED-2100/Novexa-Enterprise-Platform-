import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Ip,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './service.js';
import { LoginDto, RefreshTokenDto, AuthResponseDto } from './entity.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './guards/decorators.js';
import type { AuthenticatedUser } from './entity.js';

@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * POST /auth/login & POST /api/auth/login
   * Authenticates user, returns JWT tokens and sets httpOnly cookies.
   */
  @Post(['auth/login', 'api/auth/login'])
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string
  ): Promise<AuthResponseDto> {
    const { tokens, user } = await this.authService.login(dto, ipAddress);

    // Set secure httpOnly cookies
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  /**
   * POST /auth/refresh & POST /api/auth/refresh
   * Issues new access token using a valid refresh token.
   */
  @Post(['auth/refresh', 'api/auth/refresh'])
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ipAddress: string
  ): Promise<AuthResponseDto> {
    const tokenFromReq = body?.refreshToken || req.cookies?.refresh_token;
    const { tokens, user } = await this.authService.refresh(tokenFromReq, ipAddress);

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  /**
   * POST /auth/logout & POST /api/auth/logout
   * Clears httpOnly authentication cookies.
   */
  @Post(['auth/logout', 'api/auth/logout'])
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return { status: 'ok', message: 'Logged out successfully' };
  }

  /**
   * GET /auth/me & GET /api/auth/me
   * Returns current authenticated user and live database-backed permissions.
   */
  @Get(['auth/me', 'api/auth/me'])
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      status: 'ok',
      user: {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  /**
   * GET /me/enabled-modules & GET /api/me/enabled-modules
   * Requirement 10: Fetch the tenant's enabled modules after login.
   */
  @Get(['me/enabled-modules', 'api/me/enabled-modules'])
  @UseGuards(JwtAuthGuard)
  async getMyEnabledModules(@CurrentUser() user: AuthenticatedUser) {
    const enabledModules = await this.authService.getEnabledModulesForTenant(user.tenant_id);
    return {
      tenant_id: user.tenant_id,
      enabled_modules: enabledModules,
    };
  }
}

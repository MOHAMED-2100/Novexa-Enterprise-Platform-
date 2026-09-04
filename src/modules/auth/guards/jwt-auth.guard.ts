import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      const user = await this.authService.verifyAccessToken(token);
      // Attach verified database-backed user context to request
      (request as any).user = user;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid or expired authentication token');
    }
  }

  private extractTokenFromRequest(request: Request): string | null {
    // 1. Check Authorization header: Bearer <token>
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 2. Check httpOnly cookie: access_token
    if (request.cookies && request.cookies.access_token) {
      return request.cookies.access_token;
    }

    return null;
  }
}

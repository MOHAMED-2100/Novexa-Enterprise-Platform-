import { Controller, Get, Headers, HttpStatus, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './service.js';
import { HealthStatusEntity } from './entity.js';

@Controller()
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  /**
   * Root verification endpoint required by Phase 0 architecture:
   * GET /health
   * Returns HTTP 200 when database connection succeeds.
   * Returns HTTP 503 Service Unavailable when database connection fails.
   */
  @Get('health')
  async getHealth(
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthStatusEntity> {
    const health = await this.healthService.getHealth(acceptLanguage);
    if (health.status !== 'ok') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    } else {
      res.status(HttpStatus.OK);
    }
    return health;
  }

  /**
   * Alias endpoint for frontend API client proxy
   * GET /api/health
   */
  @Get('api/health')
  async getApiHealth(
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthStatusEntity> {
    return this.getHealth(acceptLanguage, res);
  }
}

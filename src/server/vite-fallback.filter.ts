import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Catch(NotFoundException)
export class ViteFallbackFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const next = ctx.getNext<NextFunction>();

    // If it's an API route or the health endpoint, preserve standard API 404 JSON response
    if (req.path.startsWith('/api') || req.path === '/health') {
      return res.status(404).json({
        statusCode: 404,
        message: `Cannot ${req.method} ${req.path}`,
        error: 'Not Found',
      });
    }

    // For all client-side / asset requests, delegate to next Express handler (Vite or static server)
    if (typeof next === 'function') {
      return next();
    }

    return res.status(404).send('Not Found');
  }
}

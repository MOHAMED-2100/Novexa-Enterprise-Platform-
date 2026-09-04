import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './src/server/app.module.js';
import { ViteFallbackFilter } from './src/server/vite-fallback.filter.js';
import { runMigrations } from './src/database/migrate.js';

async function bootstrap() {
  const expressApp = express();
  expressApp.use(cookieParser());
  expressApp.use(express.json());

  // Run database migration to ensure tables exist in target database
  try {
    await runMigrations();
  } catch (migErr: any) {
    console.warn('[Novexa] Database migration deferred or offline:', migErr.message);
  }

  // Create NestJS instance attached to Express
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    cors: {
      origin: true,
      credentials: true,
    },
    logger: ['error', 'warn', 'log'],
  });

  // Enable request DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  // Apply global filter allowing non-API requests to cascade to Vite/static frontend
  app.useGlobalFilters(new ViteFallbackFilter());

  // Initialize all NestJS modules, controllers, and services
  await app.init();

  // Mount Vite development server middleware or production static assets
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`[Novexa] Enterprise Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Novexa] Active Health Check: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error('[Novexa] Fatal startup error:', err);
  process.exit(1);
});

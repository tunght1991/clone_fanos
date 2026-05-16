import 'reflect-metadata';

import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

import { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';

import { API_RUNTIME_TOKEN } from './http.tokens.js';
import { AppModule } from './app.module.js';
import {
  ApiHttpExceptionFilter,
  createRateLimitMiddleware,
  createRequestIdMiddleware,
  createRequestLoggingMiddleware,
  createSecurityHeadersMiddleware,
  parseCorsOrigins,
  resolveCorsOrigin,
} from './hardening.js';
import { createGracefulShutdownHandler } from './shutdown.js';
import type { ApiRuntime } from '../main.js';

export async function bootstrapNestHttpServer(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const runtime = app.get<ApiRuntime>(API_RUNTIME_TOKEN);
  const shutdown = createGracefulShutdownHandler(app, runtime);
  const nodeEnv = process.env.NODE_ENV ?? process.env.APP_ENV ?? 'development';
  const allowedCorsOrigins = parseCorsOrigins(process.env.API_CORS_ORIGINS, nodeEnv);

  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: false, limit: '1mb', parameterLimit: 100 }));
  app.use(createSecurityHeadersMiddleware());

  app.use(createRequestIdMiddleware());
  app.use(createRequestLoggingMiddleware());
  app.use(createRateLimitMiddleware());
  app.useGlobalFilters(new ApiHttpExceptionFilter());

  if (allowedCorsOrigins.length > 0) {
    app.enableCors({
      origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean | string) => void) {
        const decision = resolveCorsOrigin(origin ?? undefined, allowedCorsOrigins);
        callback(null, decision.allowed ? decision.origin : false);
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'X-User-Id', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      maxAge: 600,
    });
  }

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });
  // eslint-disable-next-line no-console
  console.log(`clone-fanos-api listening on port ${port}`);
}

const cliEntryUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;

if (cliEntryUrl && import.meta.url === cliEntryUrl) {
  bootstrapNestHttpServer().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  });
}

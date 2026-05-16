import { randomUUID } from 'node:crypto';

import { HttpException, HttpStatus, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';

export interface HttpLoggerLike {
  log(message: string): void;
  warn(message: string): void;
  error(message: string, trace?: string): void;
}

export interface HttpRequestLike {
  method?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  headers?: Record<string, unknown>;
  socket?: {
    remoteAddress?: string | null;
  };
  requestId?: string;
}

export interface HttpResponseLike {
  status(code: number): HttpResponseLike;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
  on(event: 'finish', listener: () => void): void;
  headersSent?: boolean;
  statusCode?: number;
}

export interface RateLimitRule {
  name: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export interface ApiHardeningOptions {
  clock?: () => number;
  logger?: HttpLoggerLike;
  limiter?: InMemoryRateLimiter;
}

export interface CorsOriginRule {
  allowed: boolean;
  origin: string;
}

export interface SecurityHeadersOptions {
  contentSecurityPolicy?: string;
  referrerPolicy?: string;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 240;

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, number[]>();

  constructor(private readonly clock: () => number = () => Date.now()) {}

  consume(key: string, rule: RateLimitRule, now = this.clock()): RateLimitDecision {
    const cutoff = now - rule.windowMs;
    const existing = this.buckets.get(key) ?? [];
    const active = existing.filter((timestamp) => timestamp > cutoff);

    if (active.length >= rule.limit) {
      const oldestActive = active[0] ?? now;
      const resetAt = oldestActive + rule.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
      this.buckets.set(key, active);
      return {
        allowed: false,
        limit: rule.limit,
        remaining: 0,
        resetAt,
        retryAfterSeconds,
      };
    }

    active.push(now);
    this.buckets.set(key, active);

    return {
      allowed: true,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - active.length),
      resetAt: (active[0] ?? now) + rule.windowMs,
      retryAfterSeconds: 0,
    };
  }
}

export function createRequestIdMiddleware() {
  return function requestIdMiddleware(req: HttpRequestLike, res: HttpResponseLike, next: () => void) {
    const requestId = readHeaderValue(req, 'x-request-id') || randomUUID();
    req.requestId = requestId;
    ensureHeader(req, 'x-request-id', requestId);
    res.setHeader('x-request-id', requestId);
    next();
  };
}

export function createSecurityHeadersMiddleware(options: SecurityHeadersOptions = {}) {
  const contentSecurityPolicy = options.contentSecurityPolicy ?? "default-src 'none'";
  const referrerPolicy = options.referrerPolicy ?? 'same-origin';

  return function securityHeadersMiddleware(_req: HttpRequestLike, res: HttpResponseLike, next: () => void) {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('x-frame-options', 'DENY');
    res.setHeader('referrer-policy', referrerPolicy);
    res.setHeader('permissions-policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('cross-origin-opener-policy', 'same-origin');
    res.setHeader('cross-origin-resource-policy', 'same-site');
    res.setHeader('content-security-policy', contentSecurityPolicy);
    next();
  };
}

export function createRequestLoggingMiddleware(options: ApiHardeningOptions = {}) {
  const logger = options.logger ?? new Logger('HTTP');
  const clock = options.clock ?? (() => Date.now());

  return function requestLoggingMiddleware(req: HttpRequestLike, res: HttpResponseLike, next: () => void) {
    const startedAt = clock();
    res.on('finish', () => {
      const elapsedMs = Math.max(0, clock() - startedAt);
      const requestId = readRequestId(req);
      const path = readRequestPath(req);
      const message = `${req.method ?? 'GET'} ${path} ${res.statusCode ?? 200} ${elapsedMs}ms requestId=${requestId}`;

      if ((res.statusCode ?? 200) >= 500) {
        logger.error(message);
        return;
      }

      if ((res.statusCode ?? 200) >= 400) {
        logger.warn(message);
        return;
      }

      logger.log(message);
    });

    next();
  };
}

export function createRateLimitMiddleware(options: ApiHardeningOptions = {}) {
  const limiter = options.limiter ?? new InMemoryRateLimiter(options.clock);
  const clock = options.clock ?? (() => Date.now());
  const logger = options.logger ?? new Logger('HTTP');

  return function rateLimitMiddleware(req: HttpRequestLike, res: HttpResponseLike, next: () => void) {
    const path = readRequestPath(req);
    if (path === '/health') {
      next();
      return;
    }

    const rule = resolveRateLimitRule(req.method ?? 'GET', path);
    if (!rule) {
      next();
      return;
    }

    const clientKey = resolveClientKey(req);
    const decision = limiter.consume(`${rule.name}:${clientKey}`, rule, clock());

    res.setHeader('x-ratelimit-limit', String(decision.limit));
    res.setHeader('x-ratelimit-remaining', String(decision.remaining));
    res.setHeader('x-ratelimit-reset', String(Math.ceil(decision.resetAt / 1000)));

    if (!decision.allowed) {
      res.setHeader('retry-after', String(decision.retryAfterSeconds));
      logger.warn(
        `rate limit exceeded route=${rule.name} client=${clientKey} path=${path} retryAfter=${decision.retryAfterSeconds}s`,
      );
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
        error: 'Too Many Requests',
        path,
        requestId: readRequestId(req),
        retryAfterSeconds: decision.retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

export function resolveCorsOrigin(origin: string | undefined, allowedOrigins: string[]): CorsOriginRule {
  if (!origin) {
    return { allowed: false, origin: '' };
  }

  if (allowedOrigins.includes('*')) {
    return { allowed: true, origin };
  }

  if (allowedOrigins.includes(origin)) {
    return { allowed: true, origin };
  }

  return { allowed: false, origin };
}

export function parseCorsOrigins(value: string | undefined, nodeEnv: string): string[] {
  if (value) {
    return value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  if (nodeEnv === 'development') {
    return [
      'http://localhost:3001',
      'http://localhost:4173',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:4173',
    ];
  }

  return [];
}

export class ApiHttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: HttpLoggerLike = new Logger('HTTP')) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const req = context.getRequest<HttpRequestLike>();
    const res = context.getResponse<HttpResponseLike>();

    if (res.headersSent) {
      return;
    }

    const response = formatHttpErrorResponse(exception, req);
    const status = response.statusCode;
    const message = `${req.method ?? 'GET'} ${response.path} ${status} requestId=${response.requestId}`;

    if (status >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(message);
    }

    res.status(status).json(response);
  }
}

export function formatHttpErrorResponse(exception: unknown, req: HttpRequestLike): Record<string, unknown> & {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  requestId: string;
  timestamp: string;
} {
  const path = readRequestPath(req);
  const requestId = readRequestId(req);
  const timestamp = new Date().toISOString();

  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    const statusName = HttpStatus[statusCode as unknown as keyof typeof HttpStatus];
    const errorName = typeof statusName === 'string' ? statusName : exception.name || 'Error';

    if (typeof response === 'string') {
      return {
        statusCode,
        message: response,
        error: errorName,
        path,
        requestId,
        timestamp,
      };
    }

    if (isRecord(response)) {
      const message = normalizeErrorMessage(response.message, exception.message);
      const error = typeof response.error === 'string' ? response.error : errorName;
      return {
        ...response,
        statusCode,
        message,
        error,
        path,
        requestId,
        timestamp,
      };
    }

    return {
      statusCode,
      message: exception.message,
      error: errorName,
      path,
      requestId,
      timestamp,
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: 'InternalServerError',
    path,
    requestId,
    timestamp,
  };
}

function resolveRateLimitRule(method: string, path: string): RateLimitRule | null {
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = path.toLowerCase();

  if (normalizedPath === '/health') {
    return null;
  }

  if (
    normalizedPath.startsWith('/auth/login')
    || normalizedPath.startsWith('/auth/register')
    || normalizedPath.startsWith('/auth/refresh')
    || normalizedPath.startsWith('/auth/logout')
  ) {
    return {
      name: 'auth',
      limit: 20,
      windowMs: DEFAULT_WINDOW_MS,
    };
  }

  if (normalizedPath.startsWith('/admin')) {
    return {
      name: 'admin',
      limit: 60,
      windowMs: DEFAULT_WINDOW_MS,
    };
  }

  if (normalizedPath.startsWith('/analytics')) {
    return {
      name: 'analytics',
      limit: 120,
      windowMs: DEFAULT_WINDOW_MS,
    };
  }

  if (normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD' && normalizedMethod !== 'OPTIONS') {
    return {
      name: 'writes',
      limit: 120,
      windowMs: DEFAULT_WINDOW_MS,
    };
  }

  return {
    name: 'default',
    limit: DEFAULT_LIMIT,
    windowMs: DEFAULT_WINDOW_MS,
  };
}

function resolveClientKey(req: HttpRequestLike): string {
  return readHeaderValue(req, 'x-forwarded-for')?.split(',')[0]?.trim()
    || req.ip?.trim()
    || req.socket?.remoteAddress?.trim()
    || 'unknown';
}

function readRequestPath(req: HttpRequestLike): string {
  return (req.originalUrl ?? req.url ?? '/').split('?')[0] || '/';
}

function readRequestId(req: HttpRequestLike): string {
  return readHeaderValue(req, 'x-request-id') || req.requestId || 'unknown';
}

function readHeaderValue(req: HttpRequestLike, name: string): string {
  const header = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(header)) {
    return String(header[0] ?? '').trim();
  }

  if (typeof header === 'string') {
    return header.trim();
  }

  return '';
}

function ensureHeader(req: HttpRequestLike, name: string, value: string): void {
  if (!req.headers) {
    req.headers = {};
  }

  req.headers[name] = value;
}

function normalizeErrorMessage(message: unknown, fallback: string): string | string[] {
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    return message.map((item) => String(item));
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { HttpException } from '@nestjs/common';

import {
  ApiHttpExceptionFilter,
  InMemoryRateLimiter,
  type HttpRequestLike,
  createRateLimitMiddleware,
  createRequestIdMiddleware,
  createRequestLoggingMiddleware,
  createSecurityHeadersMiddleware,
  parseCorsOrigins,
  resolveCorsOrigin,
  formatHttpErrorResponse,
} from './hardening.js';

class FakeResponse extends EventEmitter {
  headers = new Map<string, string>();
  statusCode = 200;
  body: unknown = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  setHeader(name: string, value: string) {
    this.headers.set(name, value);
  }

  json(body: unknown) {
    this.body = body;
    this.emit('finish');
  }
}

test('createRequestIdMiddleware seeds missing request ids', () => {
  const req: HttpRequestLike = { headers: {} };
  const res = new FakeResponse();
  let nextCalled = false;

  createRequestIdMiddleware()(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(typeof req.requestId, 'string');
  assert.match(String(req.requestId), /^[0-9a-f-]{36}$/i);
  assert.equal(res.headers.get('x-request-id'), req.requestId);
  assert.equal((req.headers as Record<string, string>)['x-request-id'], req.requestId);
});

test('createSecurityHeadersMiddleware applies baseline browser headers', () => {
  const req: HttpRequestLike = { headers: {} };
  const res = new FakeResponse();
  let nextCalled = false;

  createSecurityHeadersMiddleware()(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.headers.get('referrer-policy'), 'same-origin');
  assert.equal(res.headers.get('permissions-policy'), 'geolocation=(), microphone=(), camera=()');
  assert.equal(res.headers.get('cross-origin-opener-policy'), 'same-origin');
  assert.equal(res.headers.get('cross-origin-resource-policy'), 'same-site');
  assert.equal(res.headers.get('content-security-policy'), "default-src 'none'");
});

test('createRequestLoggingMiddleware logs by response severity', () => {
  const messages: Array<{ level: string; message: string }> = [];
  const logger = {
    log(message: string) {
      messages.push({ level: 'log', message });
    },
    warn(message: string) {
      messages.push({ level: 'warn', message });
    },
    error(message: string) {
      messages.push({ level: 'error', message });
    },
  };

  const req = {
    method: 'POST',
    originalUrl: '/admin/audiobooks',
    headers: { 'x-request-id': 'trace-1' },
  };
  const res = new FakeResponse();
  const middleware = createRequestLoggingMiddleware({ logger, clock: () => 200 });

  middleware(req, res, () => undefined);
  res.status(201);
  res.json({ ok: true });

  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.level, 'log');
  assert.match(messages[0]?.message ?? '', /POST \/admin\/audiobooks 201 0ms requestId=trace-1/);

  const warnReq = {
    method: 'POST',
    originalUrl: '/auth/login',
    headers: { 'x-request-id': 'trace-2' },
  };
  const warnRes = new FakeResponse();
  const warnMiddleware = createRequestLoggingMiddleware({ logger, clock: () => 100 });

  warnMiddleware(warnReq, warnRes, () => undefined);
  warnRes.status(401);
  warnRes.json({ ok: false });

  assert.equal(messages[1]?.level, 'warn');

  const errorReq = {
    method: 'GET',
    originalUrl: '/search',
    headers: { 'x-request-id': 'trace-3' },
  };
  const errorRes = new FakeResponse();
  const errorMiddleware = createRequestLoggingMiddleware({ logger, clock: () => 100 });

  errorMiddleware(errorReq, errorRes, () => undefined);
  errorRes.status(500);
  errorRes.json({ ok: false });

  assert.equal(messages[2]?.level, 'error');
});

test('InMemoryRateLimiter expires a bucket after the configured window', () => {
  let now = 1_000;
  const limiter = new InMemoryRateLimiter(() => now);
  const rule = { name: 'default', limit: 2, windowMs: 100 };

  const first = limiter.consume('client-a', rule);
  const second = limiter.consume('client-a', rule);
  const third = limiter.consume('client-a', rule);

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.equal(third.retryAfterSeconds, 1);

  now += 150;
  const fourth = limiter.consume('client-a', rule);
  assert.equal(fourth.allowed, true);
});

test('createRateLimitMiddleware returns a 429 response after the limit is exceeded', () => {
  let now = 0;
  const limiter = new InMemoryRateLimiter(() => now);
  const logger = {
    log() {},
    warn() {},
    error() {},
  };
  const middleware = createRateLimitMiddleware({
    limiter,
    clock: () => now,
    logger,
  });
  const req = {
    method: 'POST',
    originalUrl: '/auth/login',
    headers: {},
    ip: '127.0.0.1',
  };

  for (let index = 0; index < 20; index += 1) {
    const res = new FakeResponse();
    let nextCalled = false;
    middleware(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
    now += 1;
  }

  const blockedRes = new FakeResponse();
  let blockedNextCalled = false;
  middleware(req, blockedRes, () => {
    blockedNextCalled = true;
  });

  assert.equal(blockedNextCalled, false);
  assert.equal(blockedRes.statusCode, 429);
  assert.equal((blockedRes.body as Record<string, unknown>).statusCode, 429);
  assert.equal((blockedRes.body as Record<string, unknown>).retryAfterSeconds, 60);
});

test('parseCorsOrigins defaults to local development origins', () => {
  const origins = parseCorsOrigins(undefined, 'development');

  assert.deepEqual(origins, [
    'http://localhost:3001',
    'http://localhost:4173',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:4173',
  ]);
});

test('resolveCorsOrigin only allows configured origins or wildcard', () => {
  const allowed = resolveCorsOrigin('http://localhost:4173', ['http://localhost:4173']);
  const denied = resolveCorsOrigin('http://evil.example', ['http://localhost:4173']);
  const wildcard = resolveCorsOrigin('http://evil.example', ['*']);

  assert.equal(allowed.allowed, true);
  assert.equal(denied.allowed, false);
  assert.equal(wildcard.allowed, true);
});

test('formatHttpErrorResponse hides internal errors and preserves http exceptions', () => {
  const httpError = formatHttpErrorResponse(
    new HttpException({ message: 'Invalid payload', error: 'Bad Request', foo: 'bar' }, 400),
    {
      method: 'POST',
      originalUrl: '/auth/login',
      headers: { 'x-request-id': 'trace-1' },
    },
  );

  assert.equal(httpError.statusCode, 400);
  assert.equal(httpError.message, 'Invalid payload');
  assert.equal(httpError.error, 'Bad Request');
  assert.equal(httpError.requestId, 'trace-1');

  const internalError = formatHttpErrorResponse(
    new Error('Database password leaked'),
    {
      method: 'GET',
      originalUrl: '/search',
      headers: { 'x-request-id': 'trace-2' },
    },
  );

  assert.equal(internalError.statusCode, 500);
  assert.equal(internalError.message, 'Internal server error');
  assert.equal(internalError.error, 'InternalServerError');
  assert.equal(internalError.requestId, 'trace-2');
});

test('ApiHttpExceptionFilter serializes errors to the response body', () => {
  const filter = new ApiHttpExceptionFilter({
    log() {},
    warn() {},
    error() {},
  });
  const req = {
    method: 'GET',
    originalUrl: '/health',
    headers: { 'x-request-id': 'trace-3' },
  };
  const res = new FakeResponse();
  const host = {
    switchToHttp() {
      return {
        getRequest() {
          return req;
        },
        getResponse() {
          return res;
        },
      };
    },
  } as never;

  filter.catch(new Error('boom'), host);

  const body = res.body as Record<string, unknown>;
  assert.equal(res.statusCode, 500);
  assert.equal(body.statusCode, 500);
  assert.equal(body.message, 'Internal server error');
  assert.equal(body.requestId, 'trace-3');
});

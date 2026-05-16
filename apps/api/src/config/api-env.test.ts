import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { loadApiEnvironment, validateApiEnvironment } from './api-env.js';

function createTempWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'clone-fanos-api-'));
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "apps/*"\n  - "packages/*"\n');
  writeFileSync(
    join(root, '.env'),
    [
      'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/root_db',
      'REDIS_URL=redis://localhost:6379/0',
      'ELASTICSEARCH_URL=http://localhost:9200',
      'ASSET_PROVIDER=LOCALFILE',
      'LOCAL_ASSET_BASE_URL=http://localhost:3000',
      'ASSET_URL_TTL_SECONDS=300',
      'SUBSCRIPTION_PROVIDER=WEB_GATEWAY',
      'SUBSCRIPTION_BILLING_MODE=SANDBOX',
      'AUTH_TOKEN_SECRET=root-secret',
    ].join('\n'),
  );

  const appDir = join(root, 'apps/api');
  mkdirSync(appDir, { recursive: true });
  writeFileSync(join(appDir, '.env'), [
    'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/api_db',
    'ASSET_URL_TTL_SECONDS=600',
    'CDN_BASE_URL=https://cdn.example.com',
    'AUTH_TOKEN_SECRET=app-secret',
  ].join('\n'));

  return root;
}

test('loadApiEnvironment merges workspace root and app .env files', () => {
  const root = createTempWorkspace();
  const env = loadApiEnvironment({
    cwd: join(root, 'apps/api'),
    processEnv: {
      NODE_ENV: 'development',
      APP_ENV: 'development',
    },
  });

  assert.equal(env.DATABASE_URL, 'postgresql://postgres:postgres@localhost:5432/api_db');
  assert.equal(env.REDIS_URL, 'redis://localhost:6379/0');
  assert.equal(env.ELASTICSEARCH_URL, 'http://localhost:9200');
  assert.equal(env.ASSET_URL_TTL_SECONDS, '600');
  assert.equal(env.CDN_BASE_URL, 'https://cdn.example.com');
});

test('process env overrides file env', () => {
  const root = createTempWorkspace();
  const env = loadApiEnvironment({
    cwd: root,
    processEnv: {
      NODE_ENV: 'development',
      APP_ENV: 'development',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/override_db',
      REDIS_URL: 'redis://localhost:6379/1',
      ELASTICSEARCH_URL: 'http://localhost:9201',
      LOCAL_ASSET_BASE_URL: 'http://localhost:4000',
      AUTH_TOKEN_SECRET: 'override-secret',
    },
  });

  assert.equal(env.DATABASE_URL, 'postgresql://postgres:postgres@localhost:5432/override_db');
  assert.equal(env.REDIS_URL, 'redis://localhost:6379/1');
  assert.equal(env.ELASTICSEARCH_URL, 'http://localhost:9201');
  assert.equal(env.LOCAL_ASSET_BASE_URL, 'http://localhost:4000');
});

test('validateApiEnvironment rejects mismatched NODE_ENV and APP_ENV', () => {
  assert.throws(
    () =>
      validateApiEnvironment({
        NODE_ENV: 'development',
        APP_ENV: 'staging',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/clone_fanos',
        REDIS_URL: 'redis://localhost:6379/0',
        ELASTICSEARCH_URL: 'http://localhost:9200',
        LOCAL_ASSET_BASE_URL: 'http://localhost:3000',
        AUTH_TOKEN_SECRET: 'secret',
      }),
    /must match/,
  );
});

test('validateApiEnvironment rejects unsupported asset provider values', () => {
  assert.throws(
    () =>
      validateApiEnvironment({
        NODE_ENV: 'development',
        APP_ENV: 'development',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/clone_fanos',
        REDIS_URL: 'redis://localhost:6379/0',
        ELASTICSEARCH_URL: 'http://localhost:9200',
        ASSET_PROVIDER: 'FILESYSTEM',
        LOCAL_ASSET_BASE_URL: 'http://localhost:3000',
        AUTH_TOKEN_SECRET: 'secret',
      }),
    /Unsupported ASSET_PROVIDER/,
  );
});

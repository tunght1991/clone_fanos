import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

import { normalizeRuntimeEnvironment } from './runtime-env.js';
import { readEnvFile } from './env-file.js';

export interface LoadApiEnvironmentOptions {
  cwd?: string;
  processEnv?: NodeJS.ProcessEnv;
}

function findWorkspaceRoot(startDir: string): string {
  let currentDir = resolve(startDir);

  while (true) {
    if (existsSync(resolve(currentDir, 'pnpm-workspace.yaml'))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return resolve(startDir);
    }

    currentDir = parentDir;
  }
}

function mergeEnvSources(...sources: Array<NodeJS.ProcessEnv | Record<string, string>>): NodeJS.ProcessEnv {
  const merged: NodeJS.ProcessEnv = {};

  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'string') {
        merged[key] = value;
      }
    }
  }

  return merged;
}

function parsePositiveInteger(value: string | undefined, name: string): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseUrl(value: string | undefined, name: string): string | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}

function requireValue(value: string | undefined, name: string): string {
  if (value === undefined || value === '') {
    throw new Error(`${name} is required`);
  }

  return value;
}

function normalizeAssetProvider(value: string | undefined): 'CDN' | 'S3' | 'LOCALFILE' | undefined {
  if (!value) {
    return undefined;
  }

  switch (value.toUpperCase()) {
    case 'CDN':
    case 'S3':
    case 'LOCALFILE':
      return value.toUpperCase() as 'CDN' | 'S3' | 'LOCALFILE';
    default:
      throw new Error(`Unsupported ASSET_PROVIDER: ${value}`);
  }
}

function normalizeSubscriptionProvider(
  value: string | undefined,
): 'IAP' | 'GOOGLE_PLAY' | 'WEB_GATEWAY' | undefined {
  if (!value) {
    return undefined;
  }

  switch (value.toUpperCase()) {
    case 'IAP':
    case 'GOOGLE_PLAY':
    case 'WEB_GATEWAY':
      return value.toUpperCase() as 'IAP' | 'GOOGLE_PLAY' | 'WEB_GATEWAY';
    default:
      throw new Error(`Unsupported SUBSCRIPTION_PROVIDER: ${value}`);
  }
}

function normalizeSubscriptionMode(value: string | undefined): 'LIVE' | 'SANDBOX' | undefined {
  if (!value) {
    return undefined;
  }

  switch (value.toUpperCase()) {
    case 'LIVE':
    case 'SANDBOX':
      return value.toUpperCase() as 'LIVE' | 'SANDBOX';
    default:
      throw new Error(`Unsupported SUBSCRIPTION_BILLING_MODE: ${value}`);
  }
}

export function loadApiEnvironment(
  options: LoadApiEnvironmentOptions = {},
): NodeJS.ProcessEnv {
  const cwd = resolve(options.cwd ?? process.cwd());
  const workspaceRoot = findWorkspaceRoot(cwd);
  const appRoot = resolve(workspaceRoot, 'apps/api');
  const processEnv = options.processEnv ?? process.env;

  const fileEnv = mergeEnvSources(
    readEnvFile(resolve(workspaceRoot, '.env')),
    readEnvFile(resolve(workspaceRoot, '.env.local')),
    readEnvFile(resolve(appRoot, '.env')),
    readEnvFile(resolve(appRoot, '.env.local')),
  );

  return mergeEnvSources(fileEnv, processEnv);
}

export function validateApiEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const nodeEnv = normalizeRuntimeEnvironment(env.NODE_ENV ?? env.APP_ENV);
  const appEnv = env.APP_ENV ? normalizeRuntimeEnvironment(env.APP_ENV) : nodeEnv;

  if (env.NODE_ENV && env.APP_ENV && nodeEnv !== appEnv) {
    throw new Error(`NODE_ENV (${env.NODE_ENV}) and APP_ENV (${env.APP_ENV}) must match`);
  }

  const databaseUrl = parseUrl(requireValue(env.DATABASE_URL, 'DATABASE_URL'), 'DATABASE_URL');
  const redisUrl = parseUrl(requireValue(env.REDIS_URL, 'REDIS_URL'), 'REDIS_URL');
  const elasticsearchUrl = parseUrl(
    requireValue(env.ELASTICSEARCH_URL, 'ELASTICSEARCH_URL'),
    'ELASTICSEARCH_URL',
  );

  const assetProvider = normalizeAssetProvider(env.ASSET_PROVIDER);
  const assetUrlTtlSeconds = parsePositiveInteger(env.ASSET_URL_TTL_SECONDS, 'ASSET_URL_TTL_SECONDS');

  const defaultAssetProvider =
    assetProvider ??
    (nodeEnv === 'development' ? 'LOCALFILE' : nodeEnv === 'staging' ? 'S3' : 'CDN');

  if (defaultAssetProvider === 'CDN') {
    parseUrl(requireValue(env.CDN_BASE_URL, 'CDN_BASE_URL'), 'CDN_BASE_URL');
  }

  if (defaultAssetProvider === 'S3') {
    parseUrl(requireValue(env.S3_BASE_URL, 'S3_BASE_URL'), 'S3_BASE_URL');
  }

  if (defaultAssetProvider === 'LOCALFILE') {
    parseUrl(requireValue(env.LOCAL_ASSET_BASE_URL, 'LOCAL_ASSET_BASE_URL'), 'LOCAL_ASSET_BASE_URL');
  }

  const subscriptionProvider = normalizeSubscriptionProvider(env.SUBSCRIPTION_PROVIDER);
  const subscriptionMode = normalizeSubscriptionMode(env.SUBSCRIPTION_BILLING_MODE);

  if (nodeEnv === 'production' || subscriptionMode === 'LIVE') {
    requireValue(env.SUBSCRIPTION_WEBHOOK_SECRET, 'SUBSCRIPTION_WEBHOOK_SECRET');
  }

  requireValue(env.AUTH_TOKEN_SECRET, 'AUTH_TOKEN_SECRET');
  parsePositiveInteger(env.AUTH_REFRESH_TOKEN_TTL_SECONDS, 'AUTH_REFRESH_TOKEN_TTL_SECONDS');

  return {
    ...env,
    NODE_ENV: nodeEnv,
    APP_ENV: appEnv,
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    ELASTICSEARCH_URL: elasticsearchUrl,
    ASSET_PROVIDER: assetProvider ?? env.ASSET_PROVIDER,
    ASSET_URL_TTL_SECONDS: assetUrlTtlSeconds?.toString(),
    SUBSCRIPTION_PROVIDER: subscriptionProvider ?? env.SUBSCRIPTION_PROVIDER,
    SUBSCRIPTION_BILLING_MODE: subscriptionMode ?? env.SUBSCRIPTION_BILLING_MODE,
    AUTH_TOKEN_SECRET: env.AUTH_TOKEN_SECRET,
    AUTH_REFRESH_TOKEN_TTL_SECONDS: env.AUTH_REFRESH_TOKEN_TTL_SECONDS,
  };
}

export function loadAndValidateApiEnvironment(
  options: LoadApiEnvironmentOptions = {},
): NodeJS.ProcessEnv {
  return validateApiEnvironment(loadApiEnvironment(options));
}

import type { AssetAccessRuntimeConfig, AssetProvider } from '../modules/assets/asset-access.types.js';
import { normalizeRuntimeEnvironment } from './runtime-env.js';

function normalizeProvider(value: string | undefined): AssetProvider | undefined {
  if (!value) {
    return undefined;
  }

  switch (value.toUpperCase()) {
    case 'CDN':
    case 'S3':
    case 'LOCALFILE':
      return value.toUpperCase() as AssetProvider;
    default:
      throw new Error(`Unsupported asset provider: ${value}`);
  }
}

function normalizeBaseUrl(value: string | undefined, name: string): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    // Fail fast if the configured base URL is malformed.
    new URL(value);
    return value;
  } catch {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}

export function readAssetAccessRuntimeConfig(
  env: NodeJS.ProcessEnv = process.env,
): AssetAccessRuntimeConfig {
  const ttlRaw = env.ASSET_URL_TTL_SECONDS;
  const ttl = ttlRaw ? Number(ttlRaw) : undefined;

  return {
    environment: normalizeRuntimeEnvironment(env.NODE_ENV ?? env.APP_ENV),
    provider: normalizeProvider(env.ASSET_PROVIDER),
    cdnBaseUrl: normalizeBaseUrl(env.CDN_BASE_URL, 'CDN_BASE_URL'),
    s3BaseUrl: normalizeBaseUrl(env.S3_BASE_URL, 'S3_BASE_URL'),
    localBaseUrl: normalizeBaseUrl(env.LOCAL_ASSET_BASE_URL, 'LOCAL_ASSET_BASE_URL'),
    urlTtlSeconds: ttl,
  };
}

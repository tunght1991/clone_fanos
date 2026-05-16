import type { AssetAccessPolicy, AssetAccessRuntimeConfig, AssetProvider } from './asset-access.types.js';
import { normalizeRuntimeEnvironment } from '../../config/runtime-env.js';

const DEVELOPMENT_ALLOWED_PROVIDERS: readonly AssetProvider[] = ['LOCALFILE', 'S3', 'CDN'];
const STAGING_ALLOWED_PROVIDERS: readonly AssetProvider[] = ['S3', 'CDN'];
const PRODUCTION_ALLOWED_PROVIDERS: readonly AssetProvider[] = ['S3', 'CDN'];

const DEVELOPMENT_DEFAULT_PROVIDER: AssetProvider = 'LOCALFILE';
const STAGING_DEFAULT_PROVIDER: AssetProvider = 'S3';
const PRODUCTION_DEFAULT_PROVIDER: AssetProvider = 'CDN';

export function buildAssetAccessPolicy(config: AssetAccessRuntimeConfig): AssetAccessPolicy {
  const environment = normalizeRuntimeEnvironment(config.environment);
  const allowedProviders = resolveAllowedProviders(environment);
  const defaultProvider = resolveDefaultProvider(environment, config.provider);
  const urlTtlSeconds = config.urlTtlSeconds ?? 300;

  if (!allowedProviders.includes(defaultProvider)) {
    throw new Error(
      `Asset provider ${defaultProvider} is not allowed in ${environment} environment`,
    );
  }

  if (environment === 'production' && defaultProvider === 'LOCALFILE') {
    throw new Error('LOCALFILE asset provider is forbidden in production');
  }

  if (!Number.isFinite(urlTtlSeconds) || urlTtlSeconds <= 0) {
    throw new Error('Asset URL TTL must be greater than 0');
  }

  return {
    environment,
    allowedProviders,
    defaultProvider,
    urlTtlSeconds,
  };
}

export function isAssetProviderAllowed(
  policy: AssetAccessPolicy,
  provider: AssetProvider,
): boolean {
  return policy.allowedProviders.includes(provider);
}

function resolveAllowedProviders(environment: string): readonly AssetProvider[] {
  switch (environment) {
    case 'staging':
      return STAGING_ALLOWED_PROVIDERS;
    case 'production':
      return PRODUCTION_ALLOWED_PROVIDERS;
    default:
      return DEVELOPMENT_ALLOWED_PROVIDERS;
  }
}

function resolveDefaultProvider(environment: string, provider: AssetProvider | undefined): AssetProvider {
  if (provider) {
    return provider;
  }

  switch (environment) {
    case 'staging':
      return STAGING_DEFAULT_PROVIDER;
    case 'production':
      return PRODUCTION_DEFAULT_PROVIDER;
    default:
      return DEVELOPMENT_DEFAULT_PROVIDER;
  }
}

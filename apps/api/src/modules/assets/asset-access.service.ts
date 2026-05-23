import type {
  AssetAccessDto,
  AssetAccessPolicy,
  AssetAccessRuntimeConfig,
  AssetKind,
  AssetProvider,
  AssetPurpose,
  GetAssetAccessRequest,
} from './asset-access.types.js';
import { buildAssetAccessPolicy, isAssetProviderAllowed } from './asset-access.policy.js';

export interface AssetAccessServiceDependencies {
  policy: AssetAccessPolicy;
  config: AssetAccessRuntimeConfig;
}

export function createAssetAccessServiceConfig(
  config: AssetAccessRuntimeConfig,
): AssetAccessServiceDependencies {
  return {
    policy: buildAssetAccessPolicy(config),
    config,
  };
}

export class AssetAccessService {
  constructor(private readonly dependencies: AssetAccessServiceDependencies) {}

  resolve(request: GetAssetAccessRequest): AssetAccessDto {
    const provider = this.dependencies.policy.defaultProvider;

    if (!isAssetProviderAllowed(this.dependencies.policy, provider)) {
      throw new Error(`Asset provider ${provider} is not allowed by policy`);
    }

    const expiresAt = new Date(
      Date.now() + this.dependencies.policy.urlTtlSeconds * 1000,
    ).toISOString();
    const maxAge = this.dependencies.policy.urlTtlSeconds;

    return {
      kind: request.kind,
      provider,
      url: this.buildUrl(provider, request.assetKey, request.kind, request.purpose, expiresAt),
      expiresAt,
      streamable: request.purpose === 'STREAM' || request.purpose === 'PREVIEW',
      // Sprint 10 keeps offline playback out of scope, so asset access stays stream-only.
      offlineCapable: false,
      headers: request.kind === 'AUDIO' && request.purpose === 'STREAM'
        ? { Range: 'bytes=0-' }
        : undefined,
      cacheControl: provider === 'LOCALFILE'
        ? 'no-store'
        : `private, max-age=${maxAge}`,
    };
  }

  private buildUrl(
    provider: AssetProvider,
    assetKey: string,
    kind: AssetKind,
    purpose: AssetPurpose,
    expiresAt: string,
  ): string {
    switch (provider) {
      case 'CDN':
        return this.buildCdnUrl(assetKey, kind, purpose, expiresAt);
      case 'S3':
        return this.buildS3Url(assetKey, kind, purpose, expiresAt);
      case 'LOCALFILE':
        return this.buildLocalFileUrl(assetKey, kind, purpose);
      default: {
        const unreachable: never = provider;
        return unreachable;
      }
    }
  }

  private buildCdnUrl(
    assetKey: string,
    kind: AssetKind,
    purpose: AssetPurpose,
    expiresAt: string,
  ): string {
    const baseUrl = this.dependencies.config.cdnBaseUrl;
    if (!baseUrl) {
      throw new Error('CDN_BASE_URL is required to resolve CDN asset access');
    }
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(kind.toLowerCase())}/${encodeURIComponent(assetKey)}`);
    url.searchParams.set('purpose', purpose);
    url.searchParams.set('expiresAt', expiresAt);
    return url.toString();
  }

  private buildS3Url(
    assetKey: string,
    kind: AssetKind,
    purpose: AssetPurpose,
    expiresAt: string,
  ): string {
    const baseUrl = this.dependencies.config.s3BaseUrl;
    if (!baseUrl) {
      throw new Error('S3_BASE_URL is required to resolve S3 asset access');
    }
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(kind.toLowerCase())}/${encodeURIComponent(assetKey)}`);
    url.searchParams.set('purpose', purpose);
    url.searchParams.set('expiresAt', expiresAt);
    url.searchParams.set('presigned', 'true');
    return url.toString();
  }

  private buildLocalFileUrl(
    assetKey: string,
    kind: AssetKind,
    purpose: AssetPurpose,
  ): string {
    const baseUrl = this.dependencies.config.localBaseUrl;
    if (!baseUrl) {
      throw new Error('LOCAL_ASSET_BASE_URL is required to resolve local asset access');
    }
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/_local-assets/${encodeURIComponent(kind.toLowerCase())}/${encodeURIComponent(assetKey)}`);
    url.searchParams.set('purpose', purpose);
    return url.toString();
  }
}

import type {
  AssetAccessDto,
  AssetKind,
  AssetProvider,
  AssetPurpose,
  GetAssetAccessRequest,
} from '../../../../../packages/shared/src/contracts/asset.js';
import type { RuntimeEnvironment } from '../../config/runtime-env.js';

export type {
  AssetAccessDto,
  AssetKind,
  AssetProvider,
  AssetPurpose,
  GetAssetAccessRequest,
};

export interface AssetAccessPolicy {
  environment: RuntimeEnvironment;
  allowedProviders: readonly AssetProvider[];
  defaultProvider: AssetProvider;
  urlTtlSeconds: number;
}

export interface AssetAccessRuntimeConfig {
  environment: RuntimeEnvironment;
  provider?: AssetProvider;
  cdnBaseUrl?: string;
  s3BaseUrl?: string;
  localBaseUrl?: string;
  urlTtlSeconds?: number;
}

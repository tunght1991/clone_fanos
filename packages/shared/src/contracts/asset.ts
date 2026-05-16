export const ASSET_KINDS = ['AUDIO', 'COVER_IMAGE', 'AVATAR', 'TRANSCRIPT'] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

export const ASSET_PROVIDERS = ['CDN', 'S3', 'LOCALFILE'] as const;

export type AssetProvider = (typeof ASSET_PROVIDERS)[number];

export const ASSET_PURPOSES = ['STREAM', 'DOWNLOAD', 'THUMBNAIL', 'PREVIEW'] as const;

export type AssetPurpose = (typeof ASSET_PURPOSES)[number];

export interface GetAssetAccessRequest {
  assetKey: string;
  kind: AssetKind;
  purpose: AssetPurpose;
  offlineCapable?: boolean;
}

export type GetAssetAccessDto = GetAssetAccessRequest;

export interface AssetAccessDto {
  kind: AssetKind;
  provider: AssetProvider;
  url: string;
  expiresAt: string;
  streamable: boolean;
  offlineCapable: boolean;
  headers?: Record<string, string>;
  cacheControl?: string;
}

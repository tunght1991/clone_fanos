export declare const ASSET_KINDS: readonly ["AUDIO", "COVER_IMAGE", "AVATAR", "TRANSCRIPT"];
export type AssetKind = (typeof ASSET_KINDS)[number];
export declare const ASSET_PROVIDERS: readonly ["CDN", "S3", "LOCALFILE"];
export type AssetProvider = (typeof ASSET_PROVIDERS)[number];
export declare const ASSET_PURPOSES: readonly ["STREAM", "DOWNLOAD", "THUMBNAIL", "PREVIEW"];
export type AssetPurpose = (typeof ASSET_PURPOSES)[number];
export declare const ASSET_ACCESS_OFFLINE_CAPABLE: false;
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

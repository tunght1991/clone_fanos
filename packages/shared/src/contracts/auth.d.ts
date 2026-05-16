export declare const AUTH_USER_ROLES: readonly ["user", "admin"];
export type AuthUserRole = (typeof AUTH_USER_ROLES)[number];
export interface AuthRegisterRequestDto {
    email: string;
    password: string;
    displayName: string;
    avatarAssetKey?: string | null;
}
export interface AuthLoginRequestDto {
    email: string;
    password: string;
}
export interface AuthRefreshRequestDto {
    refreshToken: string;
}
export interface AuthLogoutRequestDto {
    refreshToken: string;
}
export interface AuthUserProfileDto {
    id: string;
    email: string;
    displayName: string;
    avatarAssetKey: string | null;
    role: AuthUserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface AuthSessionDto {
    tokenType: 'Bearer';
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    refreshExpiresAt: string;
    user: AuthUserProfileDto;
}
export interface AuthLogoutResponseDto {
    revoked: boolean;
}

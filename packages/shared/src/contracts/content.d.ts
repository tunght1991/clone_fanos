export declare const CONTENT_STATUSES: readonly ["draft", "published", "unpublished", "archived"];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export declare const CHAPTER_STATUSES: readonly ["draft", "ready", "published", "archived"];
export type ChapterStatus = (typeof CHAPTER_STATUSES)[number];
export declare function isNarratorRoleIndexValid(roleIndex: number): boolean;
export interface ContentAuthorDto {
    id: string;
    name: string;
}
export interface ContentNarratorDto {
    id: string;
    name: string;
    roleIndex: number;
    isPrimary: boolean;
}
export interface ContentChapterDto {
    id: string;
    title: string;
    orderIndex: number;
    durationSec: number;
    audioAssetKey: string;
    transcript: string | null;
    status: ChapterStatus;
}
export interface AudiobookListItemDto {
    id: string;
    title: string;
    description: string | null;
    coverImageAssetKey: string | null;
    author: ContentAuthorDto;
    durationSec: number;
    status: ContentStatus;
    premiumFlag: boolean;
    languageCode: string;
    publishedAt: string | null;
}
export interface AudiobookDetailDto extends AudiobookListItemDto {
    chapters: ContentChapterDto[];
    narrators: ContentNarratorDto[];
}
export interface AudiobookListMetaDto {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
}
export interface AudiobookListResponseDto {
    data: AudiobookListItemDto[];
    meta: AudiobookListMetaDto;
}
export interface AudiobookDetailResponseDto {
    data: AudiobookDetailDto;
}
export interface AdminCreateAudiobookRequestDto {
    title: string;
    description?: string | null;
    coverImageAssetKey?: string | null;
    authorId: string;
    durationSec?: number;
    premiumFlag?: boolean;
    languageCode?: string;
    chapters?: AdminCreateAudiobookChapterRequestDto[];
}
export interface AdminCreateAudiobookChapterRequestDto {
    title: string;
    orderIndex: number;
    durationSec?: number;
    audioAssetKey: string;
    transcript?: string | null;
}
export interface AdminUpdateAudiobookRequestDto {
    title: string;
    description?: string | null;
    coverImageAssetKey?: string | null;
    authorId: string;
    durationSec?: number;
    premiumFlag?: boolean;
    languageCode?: string;
}
export interface AdminCreateChapterRequestDto {
    audiobookId: string;
    title: string;
    orderIndex: number;
    durationSec?: number;
    audioAssetKey: string;
    transcript?: string | null;
}
export interface AdminUpdateChapterRequestDto {
    title: string;
    orderIndex: number;
    durationSec?: number;
    audioAssetKey: string;
    transcript?: string | null;
}

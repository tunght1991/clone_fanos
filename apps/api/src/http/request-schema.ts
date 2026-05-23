import { BadRequestException } from '@nestjs/common';

import type { AuthLoginRequestDto, AuthLogoutRequestDto, AuthRegisterRequestDto, AuthRefreshRequestDto } from '../modules/auth/index.js';
import type {
  AdminCreateAudiobookRequestDto,
  AdminCreateChapterRequestDto,
  AdminUpdateAudiobookRequestDto,
  AdminUpdateChapterRequestDto,
} from '../modules/content/index.js';
import type {
  AnalyticsEventRequestDto,
  AnalyticsIngestRequestDto,
} from '../modules/analytics/index.js';
import type {
  PlaybackProgressRequestDto,
} from '../modules/playback/index.js';
import type { GetAssetAccessRequest } from '../modules/assets/index.js';
import type {
  SubscriptionCheckoutRequestDto,
  SubscriptionVerifyRequestDto,
  SubscriptionWebhookEventDto,
} from '../modules/subscription/index.js';
import {
  ASSET_KINDS,
  ASSET_PURPOSES,
} from '../../../../packages/shared/src/contracts/asset.js';
import type { AdminCreateAudiobookChapterRequestDto } from '../../../../packages/shared/src/contracts/content.js';
import {
  BILLING_PROVIDERS,
  SUBSCRIPTION_WEBHOOK_EVENT_TYPES,
} from '../../../../packages/shared/src/contracts/subscription.js';

type PlainRecord = Record<string, unknown>;

const AUTH_REGISTER_KEYS = ['email', 'password', 'displayName', 'avatarAssetKey'] as const;
const AUTH_LOGIN_KEYS = ['email', 'password'] as const;
const AUTH_TOKEN_KEYS = ['refreshToken'] as const;
const ANALYTICS_EVENT_KEYS = ['eventName', 'sourcePlatform', 'payload', 'occurredAt'] as const;

const SUBSCRIPTION_CHECKOUT_KEYS = ['planId', 'provider', 'returnUrl', 'trialRequested'] as const;
const SUBSCRIPTION_VERIFY_KEYS = [
  'provider',
  'checkoutSessionId',
  'receiptToken',
  'transactionId',
  'orderId',
  'platform',
] as const;
const SUBSCRIPTION_WEBHOOK_KEYS = [
  'provider',
  'eventType',
  'billingReference',
  'subscriptionId',
  'checkoutSessionId',
  'occurredAt',
  'payload',
] as const;
const PLAYBACK_PROGRESS_KEYS = ['audiobookId', 'chapterId', 'positionMs', 'completed'] as const;
const ASSET_ACCESS_KEYS = ['assetKey', 'kind', 'purpose', 'offlineCapable'] as const;

const ADMIN_AUDIOBOOK_KEYS = ['title', 'description', 'coverImageAssetKey', 'authorId', 'durationSec', 'premiumFlag', 'languageCode', 'chapters'] as const;
const ADMIN_AUDIOBOOK_CHAPTER_KEYS = ['title', 'orderIndex', 'durationSec', 'audioAssetKey', 'transcript'] as const;
const ADMIN_CHAPTER_CREATE_KEYS = ['audiobookId', 'title', 'orderIndex', 'durationSec', 'audioAssetKey', 'transcript'] as const;
const ADMIN_CHAPTER_UPDATE_KEYS = ['title', 'orderIndex', 'durationSec', 'audioAssetKey', 'transcript'] as const;

export function parseAuthRegisterRequest(body: unknown): AuthRegisterRequestDto {
  const payload = assertPlainRecord(body, 'Auth register');
  assertAllowedKeys(payload, AUTH_REGISTER_KEYS, 'Auth register');

  return {
    email: readEmail(payload.email, 'email'),
    password: readPassword(payload.password),
    displayName: readRequiredText(payload.displayName, 'displayName', 1, 120),
    avatarAssetKey: readOptionalTextOrNull(payload.avatarAssetKey, 'avatarAssetKey', 1, 512),
  };
}

export function parseAuthLoginRequest(body: unknown): AuthLoginRequestDto {
  const payload = assertPlainRecord(body, 'Auth login');
  assertAllowedKeys(payload, AUTH_LOGIN_KEYS, 'Auth login');

  return {
    email: readEmail(payload.email, 'email'),
    password: readPassword(payload.password),
  };
}

export function parseAuthRefreshRequest(body: unknown): AuthRefreshRequestDto {
  const payload = assertPlainRecord(body, 'Auth refresh');
  assertAllowedKeys(payload, AUTH_TOKEN_KEYS, 'Auth refresh');

  return {
    refreshToken: readRequiredText(payload.refreshToken, 'refreshToken', 1, 1024),
  };
}

export function parseAuthLogoutRequest(body: unknown): AuthLogoutRequestDto {
  const payload = assertPlainRecord(body, 'Auth logout');
  assertAllowedKeys(payload, AUTH_TOKEN_KEYS, 'Auth logout');

  return {
    refreshToken: readRequiredText(payload.refreshToken, 'refreshToken', 1, 1024),
  };
}

export function parseAdminCreateAudiobookRequest(body: unknown): AdminCreateAudiobookRequestDto {
  const payload = assertPlainRecord(body, 'Admin create audiobook');
  assertAllowedKeys(payload, ADMIN_AUDIOBOOK_KEYS, 'Admin create audiobook');

  const request = normalizeAdminAudiobookPayload(payload) as AdminCreateAudiobookRequestDto;
  const chapters = parseAdminCreateAudiobookChapters(payload.chapters);
  if (chapters !== undefined) {
    request.chapters = chapters;
  }

  return request;
}

export function parseAdminUpdateAudiobookRequest(body: unknown): AdminUpdateAudiobookRequestDto {
  const payload = assertPlainRecord(body, 'Admin update audiobook');
  assertAllowedKeys(payload, ADMIN_AUDIOBOOK_KEYS, 'Admin update audiobook');

  return normalizeAdminAudiobookPayload(payload);
}

export function parseAdminCreateChapterRequest(body: unknown): AdminCreateChapterRequestDto {
  const payload = assertPlainRecord(body, 'Admin create chapter');
  assertAllowedKeys(payload, ADMIN_CHAPTER_CREATE_KEYS, 'Admin create chapter');

  return {
    audiobookId: readRequiredText(payload.audiobookId, 'audiobookId', 1, 64),
    title: readRequiredText(payload.title, 'title', 1, 200),
    orderIndex: readRequiredPositiveInteger(payload.orderIndex, 'orderIndex'),
    durationSec: readOptionalNonNegativeInteger(payload.durationSec, 'durationSec', 0),
    audioAssetKey: readRequiredText(payload.audioAssetKey, 'audioAssetKey', 1, 512),
    transcript: readOptionalTextOrNull(payload.transcript, 'transcript', 1, 100_000),
  };
}

export function parseAdminUpdateChapterRequest(body: unknown): AdminUpdateChapterRequestDto {
  const payload = assertPlainRecord(body, 'Admin update chapter');
  assertAllowedKeys(payload, ADMIN_CHAPTER_UPDATE_KEYS, 'Admin update chapter');

  return {
    title: readRequiredText(payload.title, 'title', 1, 200),
    orderIndex: readRequiredPositiveInteger(payload.orderIndex, 'orderIndex'),
    durationSec: readOptionalNonNegativeInteger(payload.durationSec, 'durationSec', 0),
    audioAssetKey: readRequiredText(payload.audioAssetKey, 'audioAssetKey', 1, 512),
    transcript: readOptionalTextOrNull(payload.transcript, 'transcript', 1, 100_000),
  };
}

export function parseAnalyticsIngestRequest(body: unknown): AnalyticsIngestRequestDto {
  if (Array.isArray(body)) {
    return { events: body.map(parseAnalyticsEvent) };
  }

  const payload = assertPlainRecord(body, 'Analytics ingest');
  if (Array.isArray(payload.events)) {
    assertAllowedKeys(payload, ['events'] as const, 'Analytics ingest');
    return { events: payload.events.map(parseAnalyticsEvent) };
  }

  assertAllowedKeys(payload, ANALYTICS_EVENT_KEYS, 'Analytics ingest');
  return { events: [parseAnalyticsEvent(payload)] };
}

export function parseSubscriptionCheckoutRequest(body: unknown): SubscriptionCheckoutRequestDto {
  const payload = assertPlainRecord(body, 'Subscription checkout');
  assertAllowedKeys(payload, SUBSCRIPTION_CHECKOUT_KEYS, 'Subscription checkout');

  const request: SubscriptionCheckoutRequestDto = {
    planId: readRequiredText(payload.planId, 'planId', 1, 64),
    provider: readSubscriptionProvider(payload.provider, 'provider'),
    trialRequested: readOptionalBoolean(payload.trialRequested, 'trialRequested', false),
  };

  const returnUrl = readOptionalUrl(payload.returnUrl, 'returnUrl');
  if (returnUrl !== undefined) {
    request.returnUrl = returnUrl;
  }

  return request;
}

export function parseSubscriptionVerifyRequest(body: unknown): SubscriptionVerifyRequestDto {
  const payload = assertPlainRecord(body, 'Subscription verify');
  assertAllowedKeys(payload, SUBSCRIPTION_VERIFY_KEYS, 'Subscription verify');

  const request: SubscriptionVerifyRequestDto = {};

  const provider = readOptionalSubscriptionProvider(payload.provider, 'provider');
  if (provider !== undefined) {
    request.provider = provider;
  }

  const checkoutSessionId = readOptionalTextOrNull(payload.checkoutSessionId, 'checkoutSessionId', 1, 128);
  if (checkoutSessionId !== null) {
    request.checkoutSessionId = checkoutSessionId;
  }

  const receiptToken = readOptionalTextOrNull(payload.receiptToken, 'receiptToken', 1, 2048);
  if (receiptToken !== null) {
    request.receiptToken = receiptToken;
  }

  const transactionId = readOptionalTextOrNull(payload.transactionId, 'transactionId', 1, 128);
  if (transactionId !== null) {
    request.transactionId = transactionId;
  }

  const orderId = readOptionalTextOrNull(payload.orderId, 'orderId', 1, 128);
  if (orderId !== null) {
    request.orderId = orderId;
  }

  const platform = readOptionalPlatform(payload.platform, 'platform');
  if (platform !== undefined) {
    request.platform = platform;
  }

  return request;
}

export function parseSubscriptionWebhookEvent(body: unknown): SubscriptionWebhookEventDto {
  const payload = assertPlainRecord(body, 'Subscription webhook');
  assertAllowedKeys(payload, SUBSCRIPTION_WEBHOOK_KEYS, 'Subscription webhook');

  const event: SubscriptionWebhookEventDto = {
    provider: readSubscriptionProvider(payload.provider, 'provider'),
    eventType: readSubscriptionWebhookEventType(payload.eventType, 'eventType'),
    billingReference: readRequiredText(payload.billingReference, 'billingReference', 1, 128),
    occurredAt: readIsoDateTime(payload.occurredAt, 'occurredAt'),
    payload: readRecord(payload.payload, 'payload'),
  };

  const subscriptionId = readOptionalTextOrNull(payload.subscriptionId, 'subscriptionId', 1, 128);
  if (subscriptionId !== null) {
    event.subscriptionId = subscriptionId;
  }

  const checkoutSessionId = readOptionalTextOrNull(payload.checkoutSessionId, 'checkoutSessionId', 1, 128);
  if (checkoutSessionId !== null) {
    event.checkoutSessionId = checkoutSessionId;
  }

  return event;
}

export function parsePlaybackProgressRequest(body: unknown): PlaybackProgressRequestDto {
  const payload = assertPlainRecord(body, 'Playback progress');
  assertAllowedKeys(payload, PLAYBACK_PROGRESS_KEYS, 'Playback progress');

  return {
    audiobookId: readRequiredText(payload.audiobookId, 'audiobookId', 1, 64),
    chapterId: readRequiredText(payload.chapterId, 'chapterId', 1, 64),
    positionMs: readRequiredPositiveOrZeroInteger(payload.positionMs, 'positionMs'),
    completed: readOptionalBoolean(payload.completed, 'completed', false),
  };
}

export function parseAssetAccessRequest(body: unknown): GetAssetAccessRequest {
  const payload = assertPlainRecord(body, 'Asset access');
  assertAllowedKeys(payload, ASSET_ACCESS_KEYS, 'Asset access');

  return {
    assetKey: readRequiredText(payload.assetKey, 'assetKey', 1, 512),
    kind: readAssetKind(payload.kind, 'kind'),
    purpose: readAssetPurpose(payload.purpose, 'purpose'),
    // Sprint 10 keeps offline playback out of scope, so the API boundary normalizes this to false.
    offlineCapable: false,
  };
}

function normalizeAdminAudiobookPayload(payload: PlainRecord): AdminCreateAudiobookRequestDto | AdminUpdateAudiobookRequestDto {
  return {
    title: readRequiredText(payload.title, 'title', 1, 200),
    description: readOptionalTextOrNull(payload.description, 'description', 1, 4000),
    coverImageAssetKey: readOptionalTextOrNull(payload.coverImageAssetKey, 'coverImageAssetKey', 1, 512),
    authorId: readRequiredText(payload.authorId, 'authorId', 1, 64),
    durationSec: readOptionalNonNegativeInteger(payload.durationSec, 'durationSec', 0),
    premiumFlag: readOptionalBoolean(payload.premiumFlag, 'premiumFlag', false),
    languageCode: readLanguageCode(payload.languageCode, 'languageCode', 'vi'),
  };
}

function parseAdminCreateAudiobookChapters(value: unknown): AdminCreateAudiobookChapterRequestDto[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new BadRequestException('chapters must be an array');
  }

  return value.map((chapter, index) => parseAdminCreateAudiobookChapter(chapter, index));
}

function parseAdminCreateAudiobookChapter(
  value: unknown,
  index: number,
): AdminCreateAudiobookChapterRequestDto {
  const payload = assertPlainRecord(value, `Admin create audiobook chapter ${index + 1}`);
  assertAllowedKeys(payload, ADMIN_AUDIOBOOK_CHAPTER_KEYS, `Admin create audiobook chapter ${index + 1}`);

  return {
    title: readRequiredText(payload.title, 'chapter.title', 1, 200),
    orderIndex: readRequiredPositiveInteger(payload.orderIndex, 'chapter.orderIndex'),
    durationSec: readOptionalNonNegativeInteger(payload.durationSec, 'chapter.durationSec', 0),
    audioAssetKey: readRequiredText(payload.audioAssetKey, 'chapter.audioAssetKey', 1, 512),
    transcript: readOptionalTextOrNull(payload.transcript, 'chapter.transcript', 1, 100_000),
  };
}

function assertPlainRecord(value: unknown, scope: string): PlainRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException(`${scope} payload must be an object`);
  }

  return value as PlainRecord;
}

function assertAllowedKeys(payload: PlainRecord, allowedKeys: readonly string[], scope: string): void {
  const unknownKeys = Object.keys(payload).filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    throw new BadRequestException(`${scope} payload contains unknown fields: ${unknownKeys.join(', ')}`);
  }
}

function readRequiredText(value: unknown, fieldName: string, minLength: number, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const normalized = value.trim();
  if (normalized.length < minLength) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  if (normalized.length > maxLength) {
    throw new BadRequestException(`${fieldName} is too long`);
  }

  return normalized;
}

function readOptionalTextOrNull(value: unknown, fieldName: string, minLength: number, maxLength: number): string | null {
  if (value === undefined) {
    return null;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string or null`);
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length < minLength) {
    throw new BadRequestException(`${fieldName} is too short`);
  }

  if (normalized.length > maxLength) {
    throw new BadRequestException(`${fieldName} is too long`);
  }

  return normalized;
}

function readRequiredPositiveInteger(value: unknown, fieldName: string): number {
  const numberValue = readNumber(value, fieldName);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return numberValue;
}

function readOptionalNonNegativeInteger(value: unknown, fieldName: string, defaultValue: number): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const numberValue = readNumber(value, fieldName);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new BadRequestException(`${fieldName} must be a non-negative integer`);
  }

  return numberValue;
}

function readOptionalBoolean(value: unknown, fieldName: string, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${fieldName} must be a boolean`);
  }

  return value;
}

function readRequiredPositiveOrZeroInteger(value: unknown, fieldName: string): number {
  const numberValue = readNumber(value, fieldName);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new BadRequestException(`${fieldName} must be a non-negative integer`);
  }

  return numberValue;
}

function readEmail(value: unknown, fieldName: string): string {
  const normalized = readRequiredText(value, fieldName, 3, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/.test(normalized)) {
    throw new BadRequestException(`${fieldName} is invalid`);
  }

  return normalized;
}

function readPassword(value: unknown): string {
  const password = readRequiredText(value, 'password', 8, 128);
  if (password.includes(' ')) {
    throw new BadRequestException('password must not contain spaces');
  }

  return password;
}

function readLanguageCode(value: unknown, fieldName: string, defaultValue: string): string {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = readRequiredText(value, fieldName, 2, 16).toLowerCase();
  if (!/^[a-z]{2,8}(?:-[a-z0-9]{2,8})*$/.test(normalized)) {
    throw new BadRequestException(`${fieldName} is invalid`);
  }

  return normalized;
}

function readNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new BadRequestException(`${fieldName} must be a number`);
  }

  return value;
}

function parseAnalyticsEvent(value: unknown): AnalyticsEventRequestDto {
  const payload = assertPlainRecord(value, 'Analytics event');
  assertAllowedKeys(payload, ANALYTICS_EVENT_KEYS, 'Analytics event');

  const event: AnalyticsEventRequestDto = {
    eventName: readRequiredText(payload.eventName, 'eventName', 1, 120),
    sourcePlatform: readAnalyticsSourcePlatform(payload.sourcePlatform, 'sourcePlatform'),
  };

  if (payload.payload !== undefined) {
    event.payload = readRecord(payload.payload, 'payload');
  }

  if (payload.occurredAt !== undefined) {
    event.occurredAt = readIsoDateTime(payload.occurredAt, 'occurredAt');
  }

  return event;
}

function readAnalyticsSourcePlatform(value: unknown, fieldName: string): AnalyticsEventRequestDto['sourcePlatform'] {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'ios' || normalized === 'android' || normalized === 'web') {
    return normalized;
  }

  throw new BadRequestException(`${fieldName} is invalid`);
}

function readSubscriptionProvider(value: unknown, fieldName: string): SubscriptionCheckoutRequestDto['provider'] {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const normalized = value.trim().toUpperCase();
  if (BILLING_PROVIDERS.includes(normalized as SubscriptionCheckoutRequestDto['provider'])) {
    return normalized as SubscriptionCheckoutRequestDto['provider'];
  }

  throw new BadRequestException(`${fieldName} is invalid`);
}

function readOptionalSubscriptionProvider(
  value: unknown,
  fieldName: string,
): SubscriptionVerifyRequestDto['provider'] {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return readSubscriptionProvider(value, fieldName);
}

function readOptionalPlatform(value: unknown, fieldName: string): SubscriptionVerifyRequestDto['platform'] {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'ios' || normalized === 'android' || normalized === 'web') {
    return normalized;
  }

  throw new BadRequestException(`${fieldName} is invalid`);
}

function readSubscriptionWebhookEventType(value: unknown, fieldName: string): SubscriptionWebhookEventDto['eventType'] {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const normalized = value.trim().toUpperCase();
  if (SUBSCRIPTION_WEBHOOK_EVENT_TYPES.includes(normalized as SubscriptionWebhookEventDto['eventType'])) {
    return normalized as SubscriptionWebhookEventDto['eventType'];
  }

  throw new BadRequestException(`${fieldName} is invalid`);
}

function readAssetKind(value: unknown, fieldName: string): GetAssetAccessRequest['kind'] {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const normalized = value.trim().toUpperCase();
  if (ASSET_KINDS.includes(normalized as GetAssetAccessRequest['kind'])) {
    return normalized as GetAssetAccessRequest['kind'];
  }

  throw new BadRequestException(`${fieldName} must be one of AUDIO, COVER_IMAGE, AVATAR, TRANSCRIPT`);
}

function readAssetPurpose(value: unknown, fieldName: string): GetAssetAccessRequest['purpose'] {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const normalized = value.trim().toUpperCase();
  if (ASSET_PURPOSES.includes(normalized as GetAssetAccessRequest['purpose'])) {
    return normalized as GetAssetAccessRequest['purpose'];
  }

  throw new BadRequestException(`${fieldName} must be one of STREAM, DOWNLOAD, THUMBNAIL, PREVIEW`);
}

function readOptionalUrl(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = readRequiredText(value, fieldName, 1, 2048);
  try {
    return new URL(normalized).toString();
  } catch {
    throw new BadRequestException(`${fieldName} is invalid`);
  }
}

function readOptionalIsoDateTime(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return readIsoDateTime(value, fieldName);
}

function readIsoDateTime(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} is invalid`);
  }

  return parsed.toISOString();
}

function readRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException(`${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
}

import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import {
  parseAnalyticsIngestRequest,
  parseAssetAccessRequest,
  parseAdminCreateAudiobookRequest,
  parseAdminCreateChapterRequest,
  parseAuthLoginRequest,
  parseAuthRegisterRequest,
  parsePlaybackProgressRequest,
  parseSubscriptionCheckoutRequest,
  parseSubscriptionVerifyRequest,
  parseSubscriptionWebhookEvent,
} from './request-schema.js';

test('parseAuthRegisterRequest trims and normalizes a valid register payload', () => {
  const request = parseAuthRegisterRequest({
    email: ' User@Example.com ',
    password: 'secret-pass',
    displayName: '  User One  ',
    avatarAssetKey: '  avatars/user-1.png  ',
  });

  assert.deepEqual(request, {
    email: 'user@example.com',
    password: 'secret-pass',
    displayName: 'User One',
    avatarAssetKey: 'avatars/user-1.png',
  });
});

test('parseAuthRegisterRequest rejects unknown fields', () => {
  assert.throws(
    () =>
      parseAuthRegisterRequest({
        email: 'user@example.com',
        password: 'secret-pass',
        displayName: 'User One',
        extra: 'nope',
      }),
    BadRequestException,
  );
});

test('parseAuthLoginRequest rejects invalid payloads', () => {
  assert.throws(
    () =>
      parseAuthLoginRequest({
        email: 'user@example.com',
        password: 'short',
      }),
    BadRequestException,
  );
});

test('parseAdminCreateAudiobookRequest requires strict audiobook metadata', () => {
  const request = parseAdminCreateAudiobookRequest({
    title: '  Clean Architecture  ',
    description: '  ',
    coverImageAssetKey: '  covers/book.jpg  ',
    authorId: ' author-1 ',
    durationSec: 1200,
    premiumFlag: true,
    languageCode: ' vi ',
  });

  assert.deepEqual(request, {
    title: 'Clean Architecture',
    description: null,
    coverImageAssetKey: 'covers/book.jpg',
    authorId: 'author-1',
    durationSec: 1200,
    premiumFlag: true,
    languageCode: 'vi',
  });
});

test('parseAdminCreateChapterRequest rejects invalid chapter payloads', () => {
  assert.throws(
    () =>
      parseAdminCreateChapterRequest({
        audiobookId: 'book-1',
        title: 'Chapter 1',
        orderIndex: 0,
        audioAssetKey: 'audio/ch1.mp3',
      }),
    BadRequestException,
  );
});

test('parseAnalyticsIngestRequest accepts array and envelope payloads', () => {
  const arrayRequest = parseAnalyticsIngestRequest([
    {
      eventName: ' app_opened ',
      sourcePlatform: ' IOS ',
      payload: { route: '/dashboard' },
      occurredAt: '2026-05-12T00:00:00.000Z',
    },
  ]);

  assert.deepEqual(arrayRequest, {
    events: [
      {
        eventName: 'app_opened',
        sourcePlatform: 'ios',
        payload: { route: '/dashboard' },
        occurredAt: '2026-05-12T00:00:00.000Z',
      },
    ],
  });

  const envelopeRequest = parseAnalyticsIngestRequest({
    events: [
      {
        eventName: 'chapter_started',
        sourcePlatform: 'web',
      },
    ],
  });

  assert.equal(envelopeRequest.events[0]?.eventName, 'chapter_started');
  assert.equal(envelopeRequest.events[0]?.sourcePlatform, 'web');
});

test('parseAnalyticsIngestRequest rejects unknown fields on event payloads', () => {
  assert.throws(
    () =>
      parseAnalyticsIngestRequest({
        eventName: 'app_opened',
        sourcePlatform: 'web',
        unknown: true,
      }),
    BadRequestException,
  );
});

test('parseSubscriptionCheckoutRequest normalizes checkout payloads', () => {
  const request = parseSubscriptionCheckoutRequest({
    planId: ' plan-1 ',
    provider: ' web_gateway ',
    returnUrl: ' https://app.example.com/billing/return ',
    trialRequested: true,
  });

  assert.deepEqual(request, {
    planId: 'plan-1',
    provider: 'WEB_GATEWAY',
    returnUrl: 'https://app.example.com/billing/return',
    trialRequested: true,
  });
});

test('parseSubscriptionVerifyRequest normalizes verify payloads', () => {
  const request = parseSubscriptionVerifyRequest({
    provider: ' iap ',
    checkoutSessionId: ' checkout-1 ',
    receiptToken: ' receipt-token-1 ',
    transactionId: ' txn-1 ',
    orderId: ' order-1 ',
    platform: ' ios ',
  });

  assert.deepEqual(request, {
    provider: 'IAP',
    checkoutSessionId: 'checkout-1',
    receiptToken: 'receipt-token-1',
    transactionId: 'txn-1',
    orderId: 'order-1',
    platform: 'ios',
  });
});

test('parseSubscriptionWebhookEvent normalizes provider and timestamp', () => {
  const event = parseSubscriptionWebhookEvent({
    provider: ' google_play ',
    eventType: ' subscription_created ',
    billingReference: ' billing-1 ',
    subscriptionId: ' sub-1 ',
    checkoutSessionId: ' checkout-1 ',
    occurredAt: '2026-05-12T01:02:03.000Z',
    payload: { source: 'sandbox' },
  });

  assert.deepEqual(event, {
    provider: 'GOOGLE_PLAY',
    eventType: 'SUBSCRIPTION_CREATED',
    billingReference: 'billing-1',
    subscriptionId: 'sub-1',
    checkoutSessionId: 'checkout-1',
    occurredAt: '2026-05-12T01:02:03.000Z',
    payload: { source: 'sandbox' },
  });
});

test('parseSubscriptionWebhookEvent rejects invalid payload shape', () => {
  assert.throws(
    () =>
      parseSubscriptionWebhookEvent({
        provider: 'WEB_GATEWAY',
        eventType: 'PAYMENT_FAILED',
        billingReference: 'billing-1',
        occurredAt: 'not-a-date',
        payload: [],
      }),
    BadRequestException,
  );
});

test('parsePlaybackProgressRequest trims ids and normalizes booleans', () => {
  const request = parsePlaybackProgressRequest({
    audiobookId: ' book-1 ',
    chapterId: ' chapter-1 ',
    positionMs: 12345,
    completed: true,
  });

  assert.deepEqual(request, {
    audiobookId: 'book-1',
    chapterId: 'chapter-1',
    positionMs: 12345,
    completed: true,
  });
});

test('parsePlaybackProgressRequest rejects unknown fields and invalid numbers', () => {
  assert.throws(
    () =>
      parsePlaybackProgressRequest({
        audiobookId: 'book-1',
        chapterId: 'chapter-1',
        positionMs: -1,
        extra: true,
      }),
    BadRequestException,
  );
});

test('parseAssetAccessRequest normalizes asset access payloads', () => {
  const request = parseAssetAccessRequest({
    assetKey: ' chapters/book-1/ch-1.mp3 ',
    kind: ' audio ',
    purpose: ' stream ',
    offlineCapable: true,
  });

  assert.deepEqual(request, {
    assetKey: 'chapters/book-1/ch-1.mp3',
    kind: 'AUDIO',
    purpose: 'STREAM',
    offlineCapable: true,
  });
});

test('parseAssetAccessRequest rejects unknown fields', () => {
  assert.throws(
    () =>
      parseAssetAccessRequest({
        assetKey: 'chapter.mp3',
        kind: 'AUDIO',
        purpose: 'STREAM',
        extra: true,
      }),
    BadRequestException,
  );
});

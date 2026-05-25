import assert from 'node:assert/strict';
import test from 'node:test';

import { UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { AssetsHttpController } from './assets.http.controller.js';

function createAuthControllerStub() {
  return {
    async resolvePrincipalFromToken(token: string) {
      if (token !== 'token-1') {
        return null;
      }

      return {
        userId: 'user-1',
        email: 'reader@example.com',
        role: 'user' as const,
      };
    },
  };
}

test('AssetsHttpController requires auth before minting asset URLs', async () => {
  const controller = new AssetsHttpController(
    {
      resolve() {
        return {
          url: 'https://assets.example.com/audio.mp3',
        };
      },
    } as never,
    {
      async getPublishedAudioAssetAccessContext() {
        return {
          audiobookId: 'book-1',
          audiobookStatus: 'published',
          chapterId: 'chapter-1',
          chapterStatus: 'published',
          premiumFlag: false,
        };
      },
    } as never,
    {
      async getMySubscription() {
        return null;
      },
    } as never,
    createAuthControllerStub() as never,
  );

  await assert.rejects(
    () =>
      controller.access(undefined, {
        assetKey: 'audio/book-1/chapter-1.mp3',
        kind: 'AUDIO',
        purpose: 'STREAM',
      }),
    UnauthorizedException,
  );
});

test('AssetsHttpController blocks premium asset access without entitlement', async () => {
  const controller = new AssetsHttpController(
    {
      resolve() {
        return {
          url: 'https://assets.example.com/audio.mp3',
        };
      },
    } as never,
    {
      async getPublishedAudioAssetAccessContext() {
        return {
          audiobookId: 'book-1',
          audiobookStatus: 'published',
          chapterId: 'chapter-1',
          chapterStatus: 'published',
          premiumFlag: true,
        };
      },
    } as never,
    {
      async getMySubscription() {
        return {
          entitlement: {
            canAccessPremium: false,
          },
        };
      },
    } as never,
    createAuthControllerStub() as never,
  );

  await assert.rejects(
    () =>
      controller.access('Bearer token-1', {
        assetKey: 'audio/book-1/chapter-1.mp3',
        kind: 'AUDIO',
        purpose: 'STREAM',
      }),
    ForbiddenException,
  );
});

test('AssetsHttpController returns resolved access for free audio assets', async () => {
  const controller = new AssetsHttpController(
    {
      resolve(request) {
        return {
          provider: 'CDN',
          url: `https://assets.example.com/${request.assetKey}`,
        };
      },
    } as never,
    {
      async getPublishedAudioAssetAccessContext() {
        return {
          audiobookId: 'book-1',
          audiobookStatus: 'published',
          chapterId: 'chapter-1',
          chapterStatus: 'published',
          premiumFlag: false,
        };
      },
    } as never,
    {
      async getMySubscription() {
        return null;
      },
    } as never,
    createAuthControllerStub() as never,
  );

  const response = await controller.access('Bearer token-1', {
    assetKey: 'audio/book-1/chapter-1.mp3',
    kind: 'AUDIO',
    purpose: 'STREAM',
  });

  assert.equal(response.url, 'https://assets.example.com/audio/book-1/chapter-1.mp3');
});

test('AssetsHttpController rejects unknown audio assets', async () => {
  const controller = new AssetsHttpController(
    {
      resolve() {
        return {
          url: 'https://assets.example.com/audio.mp3',
        };
      },
    } as never,
    {
      async getPublishedAudioAssetAccessContext() {
        return null;
      },
    } as never,
    {
      async getMySubscription() {
        return null;
      },
    } as never,
    createAuthControllerStub() as never,
  );

  await assert.rejects(
    () =>
      controller.access('Bearer token-1', {
        assetKey: 'audio/unknown.mp3',
        kind: 'AUDIO',
        purpose: 'STREAM',
      }),
    NotFoundException,
  );
});

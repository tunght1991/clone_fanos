import assert from 'node:assert/strict';
import test from 'node:test';

import { ASSET_KINDS, ASSET_PROVIDERS, ASSET_PURPOSES } from './asset.js';

test('asset contract exposes the expected kinds', () => {
  assert.deepEqual(ASSET_KINDS, ['AUDIO', 'COVER_IMAGE', 'AVATAR', 'TRANSCRIPT']);
});

test('asset contract exposes the expected providers', () => {
  assert.deepEqual(ASSET_PROVIDERS, ['CDN', 'S3', 'LOCALFILE']);
});

test('asset contract exposes the expected purposes', () => {
  assert.deepEqual(ASSET_PURPOSES, ['STREAM', 'DOWNLOAD', 'THUMBNAIL', 'PREVIEW']);
});

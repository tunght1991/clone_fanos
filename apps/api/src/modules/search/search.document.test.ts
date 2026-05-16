import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSearchDocument } from './search.document.js';

test('buildSearchDocument composes searchable text and ISO timestamps', () => {
  const document = buildSearchDocument({
    audiobookId: 'book-1',
    title: 'Atomic Habits',
    description: 'Tiny changes',
    coverImageAssetKey: 'covers/book-1.jpg',
    authorId: 'author-1',
    authorName: 'James Clear',
    narratorIds: ['narrator-1'],
    narratorNames: ['Vo 1'],
    categoryIds: ['cat-1'],
    categoryNames: ['Self Development'],
    tagIds: ['tag-1'],
    tagNames: ['habit'],
    premiumFlag: true,
    status: 'PUBLISHED',
    publishedAt: new Date('2026-05-11T00:00:00.000Z'),
    popularityScore: 42,
    languageCode: 'vi',
    createdAt: new Date('2026-05-10T00:00:00.000Z'),
    updatedAt: new Date('2026-05-11T00:00:00.000Z'),
  });

  assert.equal(document.searchableText, 'atomic habits tiny changes james clear vo 1 self development habit');
  assert.equal(document.publishedAt, '2026-05-11T00:00:00.000Z');
  assert.equal(document.createdAt, '2026-05-10T00:00:00.000Z');
  assert.equal(document.updatedAt, '2026-05-11T00:00:00.000Z');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { AdminContentService } from './admin-content.service.js';

function createDatabaseStub() {
  const calls: Array<{ text: string; params: readonly unknown[] }> = [];

  return {
    calls,
    async query(text: string, params?: readonly unknown[]) {
      calls.push({ text, params: params ?? [] });

      if (text.includes('COUNT(*)::text AS count')) {
        return {
          rows: [{ count: '1' }],
        } as never;
      }

      if (text.includes('FROM audiobooks') && text.includes('LIMIT $3 OFFSET $4')) {
        return {
          rows: [
            {
              id: 'ab-new',
              title: 'New audiobook',
              description: 'Draft audiobook',
              coverImageAssetKey: null,
              authorId: 'author-1',
              authorName: 'Author 1',
              durationSec: 900,
              status: 'draft',
              premiumFlag: false,
              languageCode: 'vi',
              publishedAt: null,
              createdAt: new Date('2026-05-01T00:00:00.000Z'),
              updatedAt: new Date('2026-05-02T00:00:00.000Z'),
              chapterCount: 1,
              narratorNames: ['Lan Anh'],
              categoryNames: ['Business'],
              tagNames: ['habit'],
            },
          ],
        } as never;
      }

      if (text.includes('FROM audiobooks') && text.includes('WHERE a.id = $1')) {
        return {
          rows: [
            {
              id: 'ab-new',
              title: 'New audiobook',
              description: 'Draft audiobook',
              coverImageAssetKey: null,
              authorId: 'author-1',
              authorName: 'Author 1',
              durationSec: 900,
              status: 'draft',
              premiumFlag: false,
              languageCode: 'vi',
              publishedAt: null,
              createdAt: new Date('2026-05-01T00:00:00.000Z'),
              updatedAt: new Date('2026-05-02T00:00:00.000Z'),
              chapterCount: 1,
              narratorNames: ['Lan Anh'],
              categoryNames: ['Business'],
              tagNames: ['habit'],
            },
          ],
        } as never;
      }

      if (text.includes('FROM chapters')) {
        return {
          rows: [
            {
              id: 'chapter-1',
              audiobookId: 'ab-new',
              title: 'Intro',
              orderIndex: 1,
              durationSec: 120,
              audioAssetKey: 'chapters/intro.mp3',
              transcript: null,
              status: 'draft',
              createdAt: new Date('2026-05-01T00:00:00.000Z'),
              updatedAt: new Date('2026-05-01T00:00:00.000Z'),
            },
          ],
        } as never;
      }

      if (text.includes('FROM audiobook_narrators')) {
        return {
          rows: [
            {
              id: 'narrator-link-1',
              audiobookId: 'ab-new',
              narratorId: 'narrator-1',
              narratorName: 'Lan Anh',
              roleIndex: 1,
              isPrimary: true,
              createdAt: new Date('2026-05-01T00:00:00.000Z'),
              updatedAt: new Date('2026-05-01T00:00:00.000Z'),
            },
          ],
        } as never;
      }

      if (text.includes('FROM audiobook_categories')) {
        return {
          rows: [
            {
              id: 'category-business',
              name: 'Business',
            },
          ],
        } as never;
      }

      if (text.includes('FROM audiobook_tags')) {
        return {
          rows: [
            {
              id: 'tag-habit',
              name: 'habit',
            },
          ],
        } as never;
      }

      throw new Error(`Unexpected query: ${text}`);
    },
  };
}

test('AdminContentService lists draft audiobooks for management', async () => {
  const database = createDatabaseStub();
  const service = new AdminContentService(database as never);

  const result = await service.listAudiobooks({
    page: 1,
    pageSize: 20,
    query: 'new',
    status: 'DRAFT',
  });

  assert.equal(result.meta.totalItems, 1);
  assert.equal(result.meta.totalPages, 1);
  assert.equal(result.meta.hasPrevious, false);
  assert.equal(result.data[0].id, 'ab-new');
  assert.equal(result.data[0].status, 'draft');
  assert.equal(result.data[0].chapterCount, 1);
  assert.deepEqual(result.data[0].narratorNames, ['Lan Anh']);
  assert.deepEqual(result.data[0].categoryNames, ['Business']);
  assert.deepEqual(result.data[0].tagNames, ['habit']);
});

test('AdminContentService returns audiobook detail with chapters and narrators', async () => {
  const database = createDatabaseStub();
  const service = new AdminContentService(database as never);

  const result = await service.getAudiobookById('ab-new');

  assert.ok(result);
  assert.equal(result?.id, 'ab-new');
  assert.equal(result?.chapters.length, 1);
  assert.equal(result?.chapters[0].title, 'Intro');
  assert.equal(result?.narrators.length, 1);
  assert.equal(result?.narrators[0].narratorName, 'Lan Anh');
  assert.deepEqual(result?.categoryIds, ['category-business']);
  assert.deepEqual(result?.tagIds, ['tag-habit']);
});

test('AdminContentService rejects narrator rows with invalid role index', async () => {
  const database = createDatabaseStub();
  database.query = async function query(text: string) {
    if (text.includes('FROM audiobook_narrators')) {
      return {
        rows: [
          {
            id: 'narrator-link-1',
            audiobookId: 'ab-new',
            narratorId: 'narrator-1',
            narratorName: 'Lan Anh',
            roleIndex: 4,
            isPrimary: true,
            createdAt: new Date('2026-05-01T00:00:00.000Z'),
            updatedAt: new Date('2026-05-01T00:00:00.000Z'),
          },
        ],
      } as never;
    }

    return createDatabaseStub().query(text);
  };
  const service = new AdminContentService(database as never);

  await assert.rejects(
    () => service.getAudiobookById('ab-new'),
    /invalid narrator role index/i,
  );
});

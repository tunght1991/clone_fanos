import assert from 'node:assert/strict';
import test from 'node:test';
import { createTaxonomyRepository } from '../src/features/taxonomy/taxonomy-repository.js';

test('taxonomy repository falls back to local demo data when API is unavailable', async () => {
  const repository = createTaxonomyRepository({ adminApi: {} });
  const records = await repository.listTaxonomy('author');

  assert.ok(records.length > 0);

  const saved = await repository.saveTaxonomy({
    type: 'author',
    mode: 'create',
    draft: {
      id: '',
      type: 'author',
      name: 'New Author',
      slug: '',
      description: '',
      usageCount: 0,
      isActive: true,
    },
  });

  assert.equal(saved.name, 'New Author');

  const afterDelete = await repository.deleteTaxonomy({
    type: 'author',
    id: saved.id,
  });

  assert.ok(afterDelete.every((record) => record.id !== saved.id));
});

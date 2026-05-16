import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildTaxonomyDraftFromRecord,
  createBlankTaxonomyDraft,
  createTaxonomyManagerState,
  DEMO_AUTHOR_OPTIONS,
  DEMO_CATEGORY_OPTIONS,
  DEMO_NARRATOR_OPTIONS,
  DEMO_TAG_OPTIONS,
  filterTaxonomyRecords,
  listDemoTaxonomyRecords,
  validateTaxonomyDraft,
} from '../src/features/taxonomy/taxonomy-data.js';

test('taxonomy demo options are available for editor selectors', () => {
  assert.ok(DEMO_AUTHOR_OPTIONS.length > 0);
  assert.ok(DEMO_CATEGORY_OPTIONS.length > 0);
  assert.ok(DEMO_TAG_OPTIONS.length > 0);
  assert.ok(DEMO_NARRATOR_OPTIONS.length > 0);
});

test('listDemoTaxonomyRecords returns sorted records for a type', () => {
  const records = listDemoTaxonomyRecords('author');

  assert.ok(records.length > 0);
  assert.equal(records[0].type, 'author');
  assert.ok(records.every((record) => record.type === 'author'));
});

test('createTaxonomyManagerState seeds a draft for the requested type', () => {
  const state = createTaxonomyManagerState('tag', listDemoTaxonomyRecords('tag'));

  assert.equal(state.type, 'tag');
  assert.equal(state.draft.type, 'tag');
  assert.ok(state.records.length > 0);
});

test('validateTaxonomyDraft rejects duplicate names and missing slug fallback', () => {
  const records = listDemoTaxonomyRecords('category');
  const draft = createBlankTaxonomyDraft('category');
  draft.name = records[0].name;
  draft.slug = records[0].slug;

  const result = validateTaxonomyDraft(draft, records);

  assert.equal(result.valid, false);
  assert.equal(Boolean(result.errors.name), true);
  assert.equal(Boolean(result.errors.slug), true);
});

test('buildTaxonomyDraftFromRecord preserves selected record fields', () => {
  const record = listDemoTaxonomyRecords('narrator')[0];
  const draft = buildTaxonomyDraftFromRecord(record, 'narrator');

  assert.equal(draft.id, record.id);
  assert.equal(draft.name, record.name);
  assert.equal(draft.slug, record.slug);
});

test('filterTaxonomyRecords matches search text across name and description', () => {
  const records = listDemoTaxonomyRecords('author');
  const result = filterTaxonomyRecords(records, 'systems');

  assert.ok(result.some((record) => record.id === 'author-001'));
});

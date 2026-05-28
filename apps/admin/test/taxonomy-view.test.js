import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTaxonomyManagerState,
  listDemoTaxonomyRecords,
} from '../src/features/taxonomy/taxonomy-data.js';
import { renderTaxonomyManagerView } from '../src/features/taxonomy/taxonomy-view.js';

test('renderTaxonomyManagerView shows tabbed list and draft form', () => {
  const state = createTaxonomyManagerState('author', listDemoTaxonomyRecords('author'));
  const html = renderTaxonomyManagerView({ state });

  assert.match(html, /Taxonomy/i);
  assert.match(html, /Authors/i);
  assert.match(html, /Search/i);
  assert.match(html, /Apply filters/i);
  assert.match(html, /Clear filters/i);
  assert.match(html, /Save taxonomy/i);
  assert.match(html, /Delete/i);
});

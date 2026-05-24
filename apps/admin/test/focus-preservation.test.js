import assert from 'node:assert/strict';
import test from 'node:test';

import { getFocusableSelector } from '../src/ui/focus-preservation.js';

function createMockElement(attributes) {
  return {
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
    },
  };
}

test('getFocusableSelector prefers chapter-specific selector over generic input name', () => {
  const selector = getFocusableSelector(
    createMockElement({
      name: 'chapterTitle',
      'data-editor-chapter-index': '1',
      'data-editor-chapter-field': 'title',
    }),
  );

  assert.equal(selector, '[data-editor-chapter-index="1"][data-editor-chapter-field="title"]');
});

test('getFocusableSelector keeps special selectors for search and narrated inputs', () => {
  assert.equal(
    getFocusableSelector(createMockElement({ 'data-editor-search': 'authorId' })),
    '[data-editor-search="authorId"]',
  );

  assert.equal(
    getFocusableSelector(createMockElement({ 'data-editor-narrator-slot': '2' })),
    '[data-editor-narrator-slot="2"]',
  );
});

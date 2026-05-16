import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseSearchRequestQuery,
  parseOptionalBoolean,
  parseOptionalPositiveInteger,
  parseOptionalSortBy,
  parseOptionalSortOrder,
} from './search.http.parsers.js';

test('parseOptionalPositiveInteger accepts positive integers and rejects invalid values', () => {
  assert.equal(parseOptionalPositiveInteger(undefined), undefined);
  assert.equal(parseOptionalPositiveInteger('20'), 20);
  assert.throws(() => parseOptionalPositiveInteger('abc'), /Invalid integer value/i);
  assert.throws(() => parseOptionalPositiveInteger('0'), /Invalid integer value/i);
});

test('parseOptionalBoolean accepts true and false strings', () => {
  assert.equal(parseOptionalBoolean(undefined), undefined);
  assert.equal(parseOptionalBoolean('true'), true);
  assert.equal(parseOptionalBoolean('false'), false);
  assert.throws(() => parseOptionalBoolean('maybe'), /Invalid boolean value/i);
});

test('parseOptionalSortBy accepts supported search sort values', () => {
  assert.equal(parseOptionalSortBy(undefined), undefined);
  assert.equal(parseOptionalSortBy('RELEVANCE'), 'RELEVANCE');
  assert.equal(parseOptionalSortBy('CREATED_AT'), 'CREATED_AT');
  assert.equal(parseOptionalSortBy('POPULARITY'), 'POPULARITY');
  assert.throws(() => parseOptionalSortBy('TRENDING'), /Invalid sortBy value/i);
});

test('parseOptionalSortOrder accepts supported sort order values', () => {
  assert.equal(parseOptionalSortOrder(undefined), undefined);
  assert.equal(parseOptionalSortOrder('ASC'), 'ASC');
  assert.equal(parseOptionalSortOrder('DESC'), 'DESC');
  assert.throws(() => parseOptionalSortOrder('UP'), /Invalid sortOrder value/i);
});

test('parseSearchRequestQuery trims and normalizes search query parameters', () => {
  const query = parseSearchRequestQuery({
    query: '  clean architecture  ',
    page: '2',
    pageSize: '25',
    categoryId: '  cat-1 ',
    tagId: ' tag-2 ',
    authorId: ' author-3 ',
    narratorId: ' narrator-4 ',
    premiumFlag: 'true',
    sortBy: 'POPULARITY',
    sortOrder: 'ASC',
  });

  assert.deepEqual(query, {
    query: 'clean architecture',
    page: 2,
    pageSize: 25,
    categoryId: 'cat-1',
    tagId: 'tag-2',
    authorId: 'author-3',
    narratorId: 'narrator-4',
    premiumFlag: true,
    sortBy: 'POPULARITY',
    sortOrder: 'ASC',
  });
});

test('parseSearchRequestQuery rejects unknown fields', () => {
  assert.throws(
    () =>
      parseSearchRequestQuery({
        query: 'clean architecture',
        extra: 'nope',
      }),
    /unknown fields/i,
  );
});

test('parseSearchRequestQuery rejects empty query strings', () => {
  assert.throws(
    () =>
      parseSearchRequestQuery({
        query: '   ',
      }),
    /query is required/i,
  );
});

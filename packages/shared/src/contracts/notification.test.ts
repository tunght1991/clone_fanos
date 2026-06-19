import assert from 'node:assert/strict';
import test from 'node:test';

import { NOTIFICATION_HOME_WINDOW_DAYS } from './notification.js';

test('notification contract keeps the home window duration stable', () => {
  assert.equal(NOTIFICATION_HOME_WINDOW_DAYS, 7);
});

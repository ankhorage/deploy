import { expect, test } from 'bun:test';

import * as deploy from './index.js';

test('package entrypoint is loadable', () => {
  expect(deploy).toEqual({});
});

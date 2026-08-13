import { expect, test } from 'bun:test';

import * as project from './index.js';

test('project entrypoint exposes the monetization owner lifecycle', () => {
  expect(typeof project.readProjectMonetization).toBe('function');
  expect(typeof project.inspectProjectMonetization).toBe('function');
  expect(typeof project.createProjectMonetizationPlan).toBe('function');
  expect(typeof project.executeProjectMonetizationSync).toBe('function');
});

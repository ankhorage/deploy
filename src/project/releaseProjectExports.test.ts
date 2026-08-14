import { expect, test } from 'bun:test';

import * as project from './index.js';

test('project entrypoint exposes release authoring and immutable history ownership', () => {
  expect(typeof project.readProjectRelease).toBe('function');
  expect(typeof project.createProjectReleaseHistoryRecord).toBe('function');
  expect(typeof project.recordProjectReleaseHistory).toBe('function');
  expect(typeof project.readProjectReleaseHistory).toBe('function');
  expect(typeof project.listProjectReleaseHistory).toBe('function');
});

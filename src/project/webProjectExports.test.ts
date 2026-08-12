import { expect, test } from 'bun:test';

import * as project from './index.js';

test('project entrypoint exposes the Web deployment lifecycle', () => {
  expect(typeof project.inspectProjectWebDeployment).toBe('function');
  expect(typeof project.createProjectWebDeploymentPlan).toBe('function');
  expect(typeof project.executeProjectWebDeployment).toBe('function');
});

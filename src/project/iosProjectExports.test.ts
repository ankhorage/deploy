import { expect, test } from 'bun:test';

import * as project from './index.js';

test('project entrypoint exposes the iOS deployment lifecycle', () => {
  expect(typeof project.inspectProjectIosDeployment).toBe('function');
  expect(typeof project.createProjectIosDeploymentPlan).toBe('function');
  expect(typeof project.executeProjectIosDeployment).toBe('function');
});

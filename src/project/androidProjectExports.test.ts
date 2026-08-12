import { expect, test } from 'bun:test';

import * as project from './index.js';

test('project entrypoint exposes the Android deployment lifecycle', () => {
  expect(typeof project.inspectProjectAndroidDeployment).toBe('function');
  expect(typeof project.createProjectAndroidDeploymentPlan).toBe('function');
  expect(typeof project.executeProjectAndroidDeployment).toBe('function');
});

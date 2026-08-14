import { expect, test } from 'bun:test';

import type {
  ReleaseDesiredState,
  ReleaseLifecycleControl,
  ReleaseMutationResult,
  ReleaseObservedState,
  ReleasePlan,
  ReleaseReconcileResult,
} from './index.js';
import * as deploy from './index.js';

test('root entrypoint exposes the provider-neutral release lifecycle', () => {
  expect(typeof deploy.createReleaseRevision).toBe('function');
  expect(typeof deploy.createReleaseCurrentRevision).toBe('function');
  expect(typeof deploy.createReleasePlan).toBe('function');
  expect(typeof deploy.createReleaseExecutionState).toBe('function');
  expect(typeof deploy.executeReleasePlan).toBe('function');
  expect(typeof deploy.resumeReleaseExecution).toBe('function');
  expect(typeof deploy.listReleaseLifecycleControls).toBe('function');
  expect(typeof deploy.executeReleaseLifecycleControl).toBe('function');
  expect(typeof deploy.isReleaseStepResumable).toBe('function');
});

test('release public types compose without provider-specific contracts', () => {
  const desired = desiredState();
  const observed: ReleaseObservedState = {
    targets: [{ target: 'web', version: '2.1.0', artifactRevision: 'revision' }],
  };
  const plan: ReleasePlan = deploy.createReleasePlan(desired, observed);
  const control: ReleaseLifecycleControl = { target: 'android', action: 'halt' };
  const mutation: ReleaseMutationResult = { status: 'completed' };
  const result: ReleaseReconcileResult = {
    status: 'completed',
    plan,
    currentRevision: plan.currentRevision,
    executedStepIds: [],
  };
  expect([control.action, mutation.status, result.status]).toEqual([
    'halt',
    'completed',
    'completed',
  ]);
});

function desiredState(): ReleaseDesiredState {
  const base = {
    version: '2.1.0',
    targets: ['web'] as const,
    notes: [],
    rollout: { web: { mode: 'immediate' as const } },
  };
  return { ...base, revision: deploy.createReleaseRevision(base) };
}

import { expect, test } from 'bun:test';

import { createReleasePlan } from '../../domain/release/createReleasePlan';
import { createReleaseRevision } from '../../domain/release/createReleaseRevision';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleaseObservedState } from '../../domain/release/ReleaseObservedState';
import { createProjectReleaseHistoryRecord } from '../../project/releaseHistory/createProjectReleaseHistoryRecord';
import { resumeReleaseExecution } from './resumeReleaseExecution';

test('resume starts from fresh inspection and blocks unresolved never-retry step', async () => {
  const desired = desiredState();
  const current = iosPendingRelease();
  const initialPlan = createReleasePlan(desired, current);
  const previous = createProjectReleaseHistoryRecord({
    executionId: 'attempt-1',
    recordedAt: '2026-08-14T00:00:00.000Z',
    desired,
    initialPlan,
    result: {
      status: 'failed',
      plan: initialPlan,
      currentRevision: initialPlan.currentRevision,
      executedStepIds: [],
      attemptedStepId: 'ios:release',
      code: 'APP_STORE_RELEASE_REQUEST_FAILED',
    },
  });
  let mutations = 0;
  const result = await resumeReleaseExecution({
    desired,
    previous,
    inspect: () => Promise.resolve(current),
    mutate: () => {
      mutations += 1;
      return Promise.resolve({ status: 'completed' });
    },
  });
  expect(result.status).toBe('blocked');
  expect(result.code).toBe('RELEASE_STEP_NON_RESUMABLE');
  expect(mutations).toBe(0);
});

test('resume proceeds when fresh inspection proves irreversible step completed', async () => {
  const desired = desiredState();
  const before = iosPendingRelease();
  const initialPlan = createReleasePlan(desired, before);
  const previous = createProjectReleaseHistoryRecord({
    executionId: 'attempt-1',
    recordedAt: '2026-08-14T00:00:00.000Z',
    desired,
    initialPlan,
    result: {
      status: 'failed',
      plan: initialPlan,
      currentRevision: initialPlan.currentRevision,
      executedStepIds: [],
      attemptedStepId: 'ios:release',
      code: 'RELEASE_READBACK_VERIFICATION_FAILED',
    },
  });
  const after = iosReleased();
  const result = await resumeReleaseExecution({
    desired,
    previous,
    inspect: () => Promise.resolve(after),
    mutate: () => Promise.resolve({ status: 'completed' }),
  });
  expect(result.status).toBe('completed');
  expect(result.executedStepIds).toEqual([]);
});

function desiredState(): ReleaseDesiredState {
  const base = {
    version: '2.1.0',
    targets: ['ios'] as const,
    notes: [{ locale: 'en-US', text: 'New' }],
    rollout: { ios: { mode: 'immediate' as const } },
  };
  return { ...base, revision: createReleaseRevision(base) };
}

function iosPendingRelease(): ReleaseObservedState {
  return {
    targets: [
      {
        target: 'ios',
        version: '2.1.0',
        artifactRevision: 'ios-artifact',
        buildNumber: '42',
        releaseNotes: [{ locale: 'en-US', text: 'New' }],
        appVersionState: 'PENDING_DEVELOPER_RELEASE',
        releaseType: 'MANUAL',
        reviewState: 'COMPLETE',
        phasedReleaseState: null,
      },
    ],
  };
}

function iosReleased(): ReleaseObservedState {
  const [ios] = iosPendingRelease().targets;
  if (ios?.target !== 'ios') throw new Error('Expected iOS fixture.');
  return { targets: [{ ...ios, appVersionState: 'READY_FOR_DISTRIBUTION' }] };
}

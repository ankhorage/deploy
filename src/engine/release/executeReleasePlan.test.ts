import { expect, test } from 'bun:test';

import { createReleasePlan } from '../../domain/release/createReleasePlan';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleaseObservedState } from '../../domain/release/ReleaseObservedState';
import { executeReleasePlan } from './executeReleasePlan';

const desired: ReleaseDesiredState = {
  version: '2.1.0',
  targets: ['android'],
  notes: [{ locale: 'en-US', text: 'New' }],
  rollout: { android: { mode: 'staged', initialFraction: '0.1' } },
  revision: 'desired',
};

test('release execution refuses stale preflight state before mutation', async () => {
  const initial = androidState('0.25');
  const stale = androidState('0.5');
  let mutations = 0;
  const result = await executeReleasePlan({
    desired,
    plan: createReleasePlan(desired, initial),
    inspect: () => Promise.resolve(stale),
    mutate: () => {
      mutations += 1;
      return Promise.resolve({ status: 'completed' });
    },
  });
  expect(result.status).toBe('drifted');
  expect(result.code).toBe('RELEASE_STATE_DRIFTED');
  expect(mutations).toBe(0);
});

test('release execution verifies read-back before completing', async () => {
  let current = androidState('0.25');
  const result = await executeReleasePlan({
    desired,
    plan: createReleasePlan(desired, current),
    inspect: () => Promise.resolve(current),
    mutate: () => {
      current = androidState('0.1');
      return Promise.resolve({ status: 'completed' });
    },
  });
  expect(result.status).toBe('completed');
  expect(result.executedStepIds).toEqual(['android:rollout']);
});

test('release execution fails when provider mutation is not visible on read-back', async () => {
  const current = androidState('0.25');
  const result = await executeReleasePlan({
    desired,
    plan: createReleasePlan(desired, current),
    inspect: () => Promise.resolve(current),
    mutate: () => Promise.resolve({ status: 'completed' }),
  });
  expect(result.status).toBe('failed');
  expect(result.code).toBe('RELEASE_READBACK_VERIFICATION_FAILED');
});

function androidState(userFraction: string): ReleaseObservedState {
  return {
    targets: [
      {
        target: 'android',
        version: '2.1.0',
        artifactRevision: 'artifact',
        versionCodes: ['42'],
        releaseNotes: [{ locale: 'en-US', text: 'New' }],
        rolloutStatus: 'inProgress',
        userFraction,
      },
    ],
  };
}

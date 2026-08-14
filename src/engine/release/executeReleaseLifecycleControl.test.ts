import { expect, test } from 'bun:test';

import type { ReleaseObservedAndroidState } from '../../domain/release/ReleaseObservedAndroidState';
import { executeReleaseLifecycleControl } from './executeReleaseLifecycleControl';

test('release control performs one write and verifies fresh read-back', async () => {
  let current = androidState('inProgress');
  let mutations = 0;
  const result = await executeReleaseLifecycleControl({
    control: { target: 'android', action: 'halt' },
    inspect: () => Promise.resolve(current),
    mutate: () => {
      mutations += 1;
      current = androidState('halted');
      return Promise.resolve({ status: 'completed' });
    },
  });
  expect(result).toEqual({ status: 'completed', writePerformed: true });
  expect(mutations).toBe(1);
});

test('release control makes no write when fresh state already satisfies the request', async () => {
  let mutations = 0;
  const result = await executeReleaseLifecycleControl({
    control: { target: 'android', action: 'halt' },
    inspect: () => Promise.resolve(androidState('halted')),
    mutate: () => {
      mutations += 1;
      return Promise.resolve({ status: 'completed' });
    },
  });
  expect(result).toEqual({ status: 'completed', writePerformed: false });
  expect(mutations).toBe(0);
});

test('release control fails when mutation is not visible on read-back', async () => {
  const result = await executeReleaseLifecycleControl({
    control: { target: 'android', action: 'halt' },
    inspect: () => Promise.resolve(androidState('inProgress')),
    mutate: () => Promise.resolve({ status: 'completed' }),
  });
  expect(result).toEqual({
    status: 'failed',
    writePerformed: true,
    code: 'RELEASE_CONTROL_READBACK_VERIFICATION_FAILED',
  });
});

function androidState(
  rolloutStatus: ReleaseObservedAndroidState['rolloutStatus'],
): ReleaseObservedAndroidState {
  return {
    target: 'android',
    version: '2.1.0',
    artifactRevision: 'artifact',
    versionCodes: ['42'],
    releaseNotes: [],
    rolloutStatus,
    userFraction: '0.1',
  };
}

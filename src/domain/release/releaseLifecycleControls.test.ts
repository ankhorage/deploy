import { expect, test } from 'bun:test';

import { listReleaseLifecycleControls } from './listReleaseLifecycleControls';
import type { ReleaseObservedAndroidState } from './ReleaseObservedAndroidState';
import type { ReleaseObservedIosState } from './ReleaseObservedIosState';

test('Android lifecycle controls expose only safe staged-rollout transitions', () => {
  expect(listReleaseLifecycleControls(androidState('inProgress'))).toEqual([
    { target: 'android', action: 'halt' },
  ]);
  expect(listReleaseLifecycleControls(androidState('halted'))).toEqual([
    { target: 'android', action: 'resume' },
  ]);
  expect(listReleaseLifecycleControls(androidState('completed'))).toEqual([]);
});

test('iOS lifecycle controls preserve provider-specific semantics', () => {
  expect(listReleaseLifecycleControls(iosState({ phasedReleaseState: 'ACTIVE' }))).toEqual([
    { target: 'ios', action: 'pause-phased' },
  ]);
  expect(listReleaseLifecycleControls(iosState({ phasedReleaseState: 'PAUSED' }))).toEqual([
    { target: 'ios', action: 'resume-phased' },
  ]);
  expect(listReleaseLifecycleControls(iosState({ phasedReleaseState: 'INACTIVE' }))).toEqual([
    { target: 'ios', action: 'cancel-phased' },
  ]);
  expect(listReleaseLifecycleControls(iosState({ reviewState: 'IN_REVIEW' }))).toEqual([
    { target: 'ios', action: 'cancel-review' },
  ]);
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
    ...(rolloutStatus === 'inProgress' || rolloutStatus === 'halted'
      ? { userFraction: '0.1' }
      : {}),
  };
}

function iosState(overrides: Partial<ReleaseObservedIosState>): ReleaseObservedIosState {
  return {
    target: 'ios',
    version: '2.1.0',
    artifactRevision: 'artifact',
    buildNumber: '42',
    releaseNotes: [],
    phasedReleaseState: null,
    ...overrides,
  };
}

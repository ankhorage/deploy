import { expect, test } from 'bun:test';

import { createReleasePlan } from './createReleasePlan';
import type { ReleaseDesiredState } from './ReleaseDesiredState';
import type { ReleaseObservedIosState } from './ReleaseObservedIosState';

const immediate: ReleaseDesiredState = {
  version: '2.1.0',
  targets: ['ios'],
  notes: [{ locale: 'en-US', text: 'New' }],
  rollout: { ios: { mode: 'immediate' } },
  revision: 'desired-immediate',
};

test('iOS waiting for review does not duplicate submission or release', () => {
  const plan = createReleasePlan(immediate, {
    targets: [
      iosState({ appVersionState: 'WAITING_FOR_REVIEW', reviewState: 'WAITING_FOR_REVIEW' }),
    ],
  });
  expect(plan.status).toBe('waiting');
  expect(plan.steps).toEqual([]);
  expect(plan.diagnostics[0]?.code).toBe('IOS_REVIEW_PENDING');
});

test('manual iOS release request is explicit and irreversible', () => {
  const plan = createReleasePlan(immediate, {
    targets: [iosState({ appVersionState: 'PENDING_DEVELOPER_RELEASE', reviewState: 'COMPLETE' })],
  });
  const release = plan.steps.find((step) => step.id === 'ios:release');
  expect(release?.irreversible).toBe(true);
  expect(release?.retry).toBe('never');
});

test('staged iOS config is planned before review and never invents a percentage', () => {
  const staged: ReleaseDesiredState = {
    ...immediate,
    rollout: { ios: { mode: 'staged' } },
    revision: 'desired-staged',
  };
  const plan = createReleasePlan(staged, {
    targets: [
      iosState({
        artifactRevision: null,
        buildNumber: null,
        appVersionState: 'PREPARE_FOR_SUBMISSION',
        phasedReleaseState: null,
      }),
    ],
  });
  expect(plan.steps.map((step) => step.id)).toEqual([
    'ios:publish',
    'ios:rollout',
    'ios:submit-review',
  ]);
  expect(plan.status).toBe('changes');
  expect(JSON.stringify(plan)).not.toContain('initialFraction');
});

test('paused App Store phased release remains waiting', () => {
  const staged: ReleaseDesiredState = {
    ...immediate,
    rollout: { ios: { mode: 'staged' } },
    revision: 'desired-staged',
  };
  const plan = createReleasePlan(staged, {
    targets: [
      iosState({
        appVersionState: 'READY_FOR_DISTRIBUTION',
        reviewState: 'COMPLETE',
        phasedReleaseState: 'PAUSED',
      }),
    ],
  });
  expect(plan.status).toBe('waiting');
  expect(plan.steps).toEqual([]);
  expect(plan.diagnostics[0]?.code).toBe('IOS_PHASED_RELEASE_PAUSED');
});

function iosState(overrides: Partial<ReleaseObservedIosState> = {}): ReleaseObservedIosState {
  return {
    target: 'ios',
    version: '2.1.0',
    artifactRevision: 'ios-artifact',
    buildNumber: '42',
    releaseNotes: [{ locale: 'en-US', text: 'New' }],
    appVersionState: 'PREPARE_FOR_SUBMISSION',
    releaseType: 'MANUAL',
    phasedReleaseState: null,
    ...overrides,
  };
}

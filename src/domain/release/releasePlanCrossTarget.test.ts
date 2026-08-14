import { expect, test } from 'bun:test';

import { createReleasePlan } from './createReleasePlan';
import type { ReleaseDesiredState } from './ReleaseDesiredState';
import type { ReleaseObservedState } from './ReleaseObservedState';

const desired: ReleaseDesiredState = {
  version: '2.1.0',
  targets: ['web', 'android', 'ios'],
  notes: [{ locale: 'en-US', text: 'New' }],
  rollout: {
    web: { mode: 'immediate' },
    android: { mode: 'immediate' },
    ios: { mode: 'immediate' },
  },
  revision: 'desired-revision',
};

test('fully completed multi-target release is no-change', () => {
  const plan = createReleasePlan(desired, completedState());
  expect(plan.status).toBe('no-change');
  expect(plan.steps).toEqual([]);
});

test('completed Android is not rewritten while iOS still needs release', () => {
  const current = completedState();
  const ios = current.targets.find((target) => target.target === 'ios');
  if (ios?.target !== 'ios') throw new Error('Expected iOS fixture.');
  const plan = createReleasePlan(desired, {
    targets: [
      ...current.targets.filter((target) => target.target !== 'ios'),
      { ...ios, appVersionState: 'PENDING_DEVELOPER_RELEASE' },
    ],
  });
  expect(plan.steps.some((step) => step.target === 'android')).toBe(false);
  expect(plan.steps.some((step) => step.id === 'ios:release')).toBe(true);
});

test('final record depends on every changed target verification step', () => {
  const plan = createReleasePlan(desired, {
    targets: [
      { target: 'web', version: null, artifactRevision: null },
      {
        target: 'android',
        version: null,
        artifactRevision: null,
        versionCodes: [],
        releaseNotes: [],
        rolloutStatus: 'missing',
      },
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
  });
  const record = plan.steps.find((step) => step.id === 'release:record');
  expect(record?.dependsOn).toEqual(['android:verify', 'ios:verify', 'web:verify']);
});

test('independent Android changes can proceed while iOS waits for review', () => {
  const current = completedState();
  const android = current.targets.find((target) => target.target === 'android');
  const ios = current.targets.find((target) => target.target === 'ios');
  const web = current.targets.find((target) => target.target === 'web');
  if (android?.target !== 'android' || ios?.target !== 'ios' || web?.target !== 'web') {
    throw new Error('Expected release fixtures.');
  }
  const plan = createReleasePlan(desired, {
    targets: [
      web,
      { ...android, rolloutStatus: 'draft' },
      { ...ios, appVersionState: 'WAITING_FOR_REVIEW', reviewState: 'WAITING_FOR_REVIEW' },
    ],
  });
  expect(plan.status).toBe('changes');
  expect(plan.steps.some((step) => step.target === 'android')).toBe(true);
  expect(plan.steps.some((step) => step.id === 'release:record')).toBe(false);
});

function completedState(): ReleaseObservedState {
  return {
    targets: [
      { target: 'web', version: '2.1.0', artifactRevision: 'web-artifact' },
      {
        target: 'android',
        version: '2.1.0',
        artifactRevision: 'android-artifact',
        versionCodes: ['42'],
        releaseNotes: [{ locale: 'en-US', text: 'New' }],
        rolloutStatus: 'completed',
      },
      {
        target: 'ios',
        version: '2.1.0',
        artifactRevision: 'ios-artifact',
        buildNumber: '42',
        releaseNotes: [{ locale: 'en-US', text: 'New' }],
        appVersionState: 'READY_FOR_DISTRIBUTION',
        releaseType: 'MANUAL',
        reviewState: 'COMPLETE',
        phasedReleaseState: null,
      },
    ],
  };
}

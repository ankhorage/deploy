import { expect, test } from 'bun:test';

import { createReleasePlan } from './createReleasePlan';
import type { ReleaseDesiredState } from './ReleaseDesiredState';
import type { ReleaseObservedAndroidState } from './ReleaseObservedAndroidState';

const desired: ReleaseDesiredState = {
  version: '2.1.0',
  targets: ['android'],
  notes: [{ locale: 'de-CH', text: 'Neu' }],
  rollout: { android: { mode: 'staged', initialFraction: '0.1' } },
  revision: 'desired-revision',
};

test('Android-only release emits no iOS or Web steps', () => {
  const plan = createReleasePlan(desired, androidState('0.25'));
  expect(plan.status).toBe('changes');
  expect(plan.steps.every((step) => step.target === 'android' || step.target === 'release')).toBe(
    true,
  );
});

test('matching Android staged fraction requires no change', () => {
  const plan = createReleasePlan(desired, androidState('0.1000'));
  expect(plan.status).toBe('no-change');
  expect(plan.steps).toEqual([]);
});

test('Android staged fraction drift plans rollout without floating-point comparison', () => {
  const plan = createReleasePlan(desired, androidState('0.25'));
  expect(plan.steps.map((step) => step.id)).toEqual([
    'android:rollout',
    'android:verify',
    'release:record',
  ]);
});

test('halted Android rollout remains waiting instead of resuming implicitly', () => {
  const current = androidState('0.1');
  const [android] = current.targets;
  if (android?.target !== 'android') throw new Error('Expected Android fixture.');
  const plan = createReleasePlan(desired, {
    targets: [{ ...android, rolloutStatus: 'halted' }],
  });
  expect(plan.status).toBe('waiting');
  expect(plan.steps).toEqual([]);
  expect(plan.diagnostics[0]?.code).toBe('ANDROID_ROLLOUT_HALTED');
});

function androidState(userFraction: string) {
  const android: ReleaseObservedAndroidState = {
    target: 'android',
    version: '2.1.0',
    artifactRevision: 'android-artifact',
    versionCodes: ['42'],
    releaseNotes: [{ locale: 'de-CH', text: 'Neu' }],
    rolloutStatus: 'inProgress',
    userFraction,
  };
  return { targets: [android] };
}

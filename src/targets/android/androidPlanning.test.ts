import { expect, test } from 'bun:test';

import type { DeploymentTargetChange } from '../../domain/DeploymentTargetChange';
import { createAndroidDeploymentRevision } from './createAndroidDeploymentRevision';
import { createAndroidTargetPlanContributor } from './createAndroidTargetPlanContributor';
import { normalizeAndroidProviders } from './normalizeAndroidProviders';

const BASE_INTENT = {
  buildProfile: 'production',
  track: 'internal',
  releaseStatus: 'draft',
} as const;

const CREATE_CHANGE: DeploymentTargetChange = {
  target: 'android',
  kind: 'create',
  desired: {
    target: 'android',
    package: 'com.example.app',
    providers: { build: 'eas', publish: 'google-play' },
    revision: 'revision',
  },
  current: null,
  reason: 'target-missing',
};

test('Android revision is deterministic and intent-bound', () => {
  const revision = createAndroidDeploymentRevision('fingerprint-a', BASE_INTENT);
  expect(createAndroidDeploymentRevision('fingerprint-a', BASE_INTENT)).toBe(revision);
  expect(createAndroidDeploymentRevision('fingerprint-b', BASE_INTENT)).not.toBe(revision);
  expect(
    createAndroidDeploymentRevision('fingerprint-a', { ...BASE_INTENT, track: 'production' }),
  ).not.toBe(revision);
  expect(
    createAndroidDeploymentRevision('fingerprint-a', { ...BASE_INTENT, releaseStatus: 'completed' }),
  ).not.toBe(revision);
  expect(
    createAndroidDeploymentRevision('fingerprint-a', { ...BASE_INTENT, buildProfile: 'preview' }),
  ).not.toBe(revision);
});

test('Android providers normalize to EAS and Google Play', () => {
  expect(normalizeAndroidProviders(undefined)).toEqual({
    ok: true,
    providers: { build: 'eas', publish: 'google-play' },
  });
  expect(normalizeAndroidProviders({ build: 'other' }).ok).toBe(false);
  expect(normalizeAndroidProviders({ publish: 'other' }).ok).toBe(false);
});

test('Android create plan uses prepare build publish verify order', () => {
  const contributor = createAndroidTargetPlanContributor();
  const steps = contributor.createSteps(CREATE_CHANGE);
  expect(steps.map((step) => step.id)).toEqual([
    'android:prepare',
    'android:build',
    'android:publish',
    'android:verify',
  ]);
  expect(steps.map((step) => step.provider)).toEqual(['eas', 'eas', 'google-play', 'google-play']);
});

test('Android removal stays one explicit portable removal step', () => {
  const current = CREATE_CHANGE.desired;
  const steps = createAndroidTargetPlanContributor().createSteps({
    target: 'android',
    kind: 'remove',
    desired: null,
    current,
    reason: 'target-not-desired',
  });
  expect(steps).toEqual([
    {
      id: 'android:remove',
      target: 'android',
      phase: 'publish',
      operation: 'remove',
      provider: 'google-play',
      reason: 'target-not-desired',
    },
  ]);
});

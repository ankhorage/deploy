import { expect, test } from 'bun:test';

import type { DeploymentTargetChange } from '../../domain/DeploymentTargetChange';
import { createIosDeploymentRevision } from './createIosDeploymentRevision';
import { createIosTargetPlanContributor } from './createIosTargetPlanContributor';
import { normalizeIosProviders } from './normalizeIosProviders';

const BASE_INTENT = { buildProfile: 'production', version: '1.2.3' } as const;

const CREATE_CHANGE: DeploymentTargetChange = {
  target: 'ios',
  kind: 'create',
  desired: {
    target: 'ios',
    bundleIdentifier: 'com.example.app',
    providers: { build: 'eas', publish: 'app-store-connect' },
    revision: 'revision',
  },
  current: null,
  reason: 'target-missing',
};

test('iOS revision is deterministic and intent-bound', () => {
  const revision = createIosDeploymentRevision('fingerprint-a', BASE_INTENT);
  expect(createIosDeploymentRevision('fingerprint-a', BASE_INTENT)).toBe(revision);
  expect(createIosDeploymentRevision('fingerprint-b', BASE_INTENT)).not.toBe(revision);
  expect(
    createIosDeploymentRevision('fingerprint-a', { ...BASE_INTENT, version: '1.2.4' }),
  ).not.toBe(revision);
  expect(
    createIosDeploymentRevision('fingerprint-a', { ...BASE_INTENT, buildProfile: 'preview' }),
  ).not.toBe(revision);
});

test('iOS providers normalize to EAS and App Store Connect', () => {
  expect(normalizeIosProviders(undefined)).toEqual({
    ok: true,
    providers: { build: 'eas', publish: 'app-store-connect' },
  });
  expect(normalizeIosProviders({ build: 'other' }).ok).toBe(false);
  expect(normalizeIosProviders({ publish: 'other' }).ok).toBe(false);
});

test('iOS create plan uses prepare build publish verify order', () => {
  const steps = createIosTargetPlanContributor().createSteps(CREATE_CHANGE);
  expect(steps.map((step) => step.id)).toEqual([
    'ios:prepare',
    'ios:build',
    'ios:publish',
    'ios:verify',
  ]);
  expect(steps.map((step) => step.provider)).toEqual([
    'eas',
    'eas',
    'app-store-connect',
    'app-store-connect',
  ]);
});

test('iOS removal stays one explicit portable removal step', () => {
  const steps = createIosTargetPlanContributor().createSteps({
    target: 'ios',
    kind: 'remove',
    desired: null,
    current: CREATE_CHANGE.desired,
    reason: 'target-not-desired',
  });
  expect(steps[0]?.id).toBe('ios:remove');
  expect(steps[0]?.provider).toBe('app-store-connect');
});

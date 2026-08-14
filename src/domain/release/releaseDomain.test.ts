import { expect, test } from 'bun:test';

import { createReleaseExecutionState } from './createReleaseExecutionState';
import { createReleaseRevision } from './createReleaseRevision';
import { isReleaseStepResumable } from './isReleaseStepResumable';
import type { ReleasePlanStep } from './ReleasePlanStep';

test('release revision is deterministic across target and note ordering', () => {
  const first = createReleaseRevision({
    version: '2.1.0',
    targets: ['ios', 'android'],
    notes: [
      { locale: 'de-CH', text: 'Neu' },
      { locale: 'en-US', text: 'New' },
    ],
    rollout: {
      android: { mode: 'staged', initialFraction: '0.1' },
      ios: { mode: 'staged' },
    },
  });
  const second = createReleaseRevision({
    version: '2.1.0',
    targets: ['android', 'ios'],
    notes: [
      { locale: 'en-US', text: 'New' },
      { locale: 'de-CH', text: 'Neu' },
    ],
    rollout: {
      android: { mode: 'staged', initialFraction: '0.1' },
      ios: { mode: 'staged' },
    },
  });
  expect(first).toBe(second);
});

test('release execution state exposes retry and irreversibility before execution', () => {
  const steps: ReleasePlanStep[] = [
    {
      id: 'ios:release',
      target: 'ios',
      operation: 'release',
      dependsOn: ['ios:verify'],
      retry: 'never',
      irreversible: true,
    },
    {
      id: 'android:verify',
      target: 'android',
      operation: 'verify',
      dependsOn: [],
      retry: 'safe',
      irreversible: false,
    },
  ];
  const state = createReleaseExecutionState('revision', steps);
  const [iosRelease, androidVerify] = state.steps;
  if (iosRelease === undefined || androidVerify === undefined) {
    throw new Error('Expected release execution fixtures.');
  }
  expect(state.steps.map((step) => step.status)).toEqual(['pending', 'pending']);
  expect(isReleaseStepResumable(iosRelease)).toBe(false);
  expect(isReleaseStepResumable(androidVerify)).toBe(true);
});

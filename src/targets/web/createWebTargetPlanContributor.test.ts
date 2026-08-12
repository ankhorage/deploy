import { expect, test } from 'bun:test';

import type { DeploymentTargetChange } from '../../domain/DeploymentTargetChange';
import { createWebTargetPlanContributor } from './createWebTargetPlanContributor';

function webChange(kind: 'create' | 'update' | 'remove'): DeploymentTargetChange {
  const current = {
    target: 'web' as const,
    providers: { build: 'expo', publish: 'eas' },
    revision: 'old',
  };
  const desired = { ...current, revision: 'new' };
  return {
    target: 'web',
    kind,
    desired: kind === 'remove' ? null : desired,
    current: kind === 'create' ? null : current,
    reason: kind === 'create' ? 'target-missing' : kind === 'remove' ? 'target-not-desired' : 'revision-changed',
  };
}

test('web create plan uses prepare publish verify order', () => {
  const steps = createWebTargetPlanContributor().createSteps(webChange('create'));
  expect(steps.map((step) => step.id)).toEqual(['web:prepare', 'web:publish', 'web:verify']);
  expect(steps.map((step) => step.provider)).toEqual(['expo', 'eas', 'eas']);
  expect(steps[1]?.operation).toBe('create');
});

test('web update plan preserves update publication operation', () => {
  const steps = createWebTargetPlanContributor().createSteps(webChange('update'));
  expect(steps[1]?.operation).toBe('update');
});

test('web removal is one explicit portable remove step', () => {
  const steps = createWebTargetPlanContributor().createSteps(webChange('remove'));
  expect(steps).toHaveLength(1);
  expect(steps[0]?.id).toBe('web:remove');
  expect(steps[0]?.operation).toBe('remove');
});
